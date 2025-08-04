package db

import (
	"context"
	"log"
	"backend/internal/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
    offersCollection     *mongo.Collection
    commentsCollection   *mongo.Collection
    loansCollection      *mongo.Collection
    requestsCollection   *mongo.Collection
)

// InitCollections initializes the collection handles.
func InitCollections(db *mongo.Database) {
    offersCollection = db.Collection("offers")
    commentsCollection = db.Collection("comments")
    loansCollection = db.Collection("loans")
    requestsCollection = db.Collection("requests")
    log.Println("Database collections initialized.")
}


// CreateOffer inserts a new loan offer into the database
func CreateOffer(offer *models.LoanOffer) (*models.LoanOffer, error) {
	offer.ID = primitive.NewObjectID()
	offer.CreatedAt = time.Now()
	_, err := offersCollection.InsertOne(context.TODO(), offer)
	if err != nil {
		return nil, err
	}
	return offer, nil
}

// GetOffers retrieves all loan offers from the database
func GetOffers() ([]models.LoanOffer, error) {
	var offers []models.LoanOffer
	cursor, err := offersCollection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &offers); err != nil {
		return nil, err
	}
	return offers, nil
}

// GetOfferByID retrieves a specific loan offer by its MongoDB ObjectID
func GetOfferByID(id string) (*models.LoanOffer, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var offer models.LoanOffer
	err = offersCollection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&offer)
	if err != nil {
		return nil, err
	}
	return &offer, nil
}

// CreateComment creates a new comment linked to a specific loan offer
func CreateComment(offerID string, comment *models.Comment) (*models.Comment, error) {
	objID, err := primitive.ObjectIDFromHex(offerID)
	if err != nil {
		return nil, err
	}
	
	comment.ID = primitive.NewObjectID()
	comment.OfferID = objID
	comment.CreatedAt = time.Now()

	_, err = commentsCollection.InsertOne(context.TODO(), comment)
	if err != nil {
		return nil, err
	}
	return comment, nil
}

// GetCommentsForOffer retrieves all comments for a specific loan offer
func GetCommentsForOffer(offerID string) ([]models.Comment, error) {
	objID, err := primitive.ObjectIDFromHex(offerID)
	if err != nil {
		return nil, err
	}

	var comments []models.Comment
	cursor, err := commentsCollection.Find(context.TODO(), bson.M{"offer_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &comments); err != nil {
		return nil, err
	}
	return comments, nil
}


// GetUserActiveLoans retrieves active loans where user is either lender or borrower
func GetUserActiveLoans(userAddress string) ([]models.Loan, error) {
	var loans []models.Loan
	filter := bson.M{
		"$or": []bson.M{
			{"lender_address": userAddress, "is_active": true},
			{"borrower_address": userAddress, "is_active": true},
		},
	}
	
	cursor, err := loansCollection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &loans); err != nil {
		return nil, err
	}
	return loans, nil
}


// GetUserActiveRequests retrieves active loan requests for a specific borrower
func GetUserActiveRequests(userAddress string) ([]models.LoanRequest, error) {
	var requests []models.LoanRequest
	filter := bson.M{
		"borrower_address": userAddress,
		"is_active": true,
	}
	
	cursor, err := requestsCollection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &requests); err != nil {
		return nil, err
	}
	return requests, nil
}


// GetPlatformStats calculates and returns platform-wide analytics using aggregation
func GetPlatformStats() (*models.PlatformStats, error) {
	stats := &models.PlatformStats{}
	
	// Get total volume and active loans count
	pipeline := []bson.M{
		{"$match": bson.M{"is_active": true}},
		{"$group": bson.M{
			"_id": nil,
			"total_volume": bson.M{"$sum": "$amount"},
			"average_apy": bson.M{"$avg": "$apy"},
			"count": bson.M{"$sum": 1},
		}},
	}
	
	cursor, err := loansCollection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())
	
	var result []bson.M
	if err = cursor.All(context.TODO(), &result); err != nil {
		return nil, err
	}
	
	if len(result) > 0 {
		if totalVolume, ok := result[0]["total_volume"].(float64); ok {
			stats.TotalVolume = totalVolume
		}
		if avgAPY, ok := result[0]["average_apy"].(float64); ok {
			stats.AverageAPY = avgAPY
		}
		if count, ok := result[0]["count"].(int32); ok {
			stats.ActiveLoansCount = int64(count)
		}
	}
	
	// Get top lenders
	topLendersPipeline := []bson.M{
		{"$match": bson.M{"is_active": true}},
		{"$group": bson.M{
			"_id": "$lender_address",
			"avg_apy": bson.M{"$avg": "$apy"},
		}},
		{"$sort": bson.M{"avg_apy": -1}},
		{"$limit": 5},
	}
	
	lendersCursor, err := loansCollection.Aggregate(context.TODO(), topLendersPipeline)
	if err != nil {
		return nil, err
	}
	defer lendersCursor.Close(context.TODO())
	
	var lendersResult []bson.M
	if err = lendersCursor.All(context.TODO(), &lendersResult); err != nil {
		return nil, err
	}
	
	for _, lender := range lendersResult {
		if address, ok := lender["_id"].(string); ok {
			if apy, ok := lender["avg_apy"].(float64); ok {
				stats.TopLenders = append(stats.TopLenders, models.LenderStat{
					Address: address,
					APY:     apy,
				})
			}
		}
	}
	
	// Get popular collateral tokens
	collateralPipeline := []bson.M{
		{"$match": bson.M{"is_active": true}},
		{"$group": bson.M{
			"_id": "$collateral_token",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"count": -1}},
		{"$limit": 5},
	}
	
	collateralCursor, err := loansCollection.Aggregate(context.TODO(), collateralPipeline)
	if err != nil {
		return nil, err
	}
	defer collateralCursor.Close(context.TODO())
	
	var collateralResult []bson.M
	if err = collateralCursor.All(context.TODO(), &collateralResult); err != nil {
		return nil, err
	}
	
	for _, collateral := range collateralResult {
		if token, ok := collateral["_id"].(string); ok {
			stats.PopularCollaterals = append(stats.PopularCollaterals, token)
		}
	}
	
	return stats, nil
}