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
    usersCollection      *mongo.Collection
)

// InitCollections initializes the collection handles.
func InitCollections(db *mongo.Database) {
    offersCollection = db.Collection("offers")
    commentsCollection = db.Collection("comments")
    loansCollection = db.Collection("loans")
    requestsCollection = db.Collection("requests")
    usersCollection = db.Collection("users")
    log.Println("Database collections initialized.")
}


// CreateOffer inserts a new loan offer into the database
func CreateOffer(offer *models.LoanOffer) (*models.LoanOffer, error) {
	offer.ID = primitive.NewObjectID()
	now := time.Now()
	offer.CreatedAt = &now
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
	comment.OfferID = &objID
	comment.CreatedAt = time.Now()

	_, err = commentsCollection.InsertOne(context.TODO(), comment)
	if err != nil {
		return nil, err
	}
	return comment, nil
}

// CreateRequestComment creates a new comment linked to a specific loan request
func CreateRequestComment(requestID string, comment *models.Comment) (*models.Comment, error) {
	objID, err := primitive.ObjectIDFromHex(requestID)
	if err != nil {
		return nil, err
	}
	
	comment.ID = primitive.NewObjectID()
	comment.RequestID = &objID
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

// GetCommentsForRequest retrieves all comments for a specific loan request
func GetCommentsForRequest(requestID string) ([]models.Comment, error) {
	objID, err := primitive.ObjectIDFromHex(requestID)
	if err != nil {
		return nil, err
	}

	var comments []models.Comment
	cursor, err := commentsCollection.Find(context.TODO(), bson.M{"request_id": objID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &comments); err != nil {
		return nil, err
	}
	return comments, nil
}

// GetRequestByID retrieves a specific loan request by its MongoDB ObjectID
func GetRequestByID(id string) (*models.LoanRequest, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var request models.LoanRequest
	err = requestsCollection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&request)
	if err != nil {
		return nil, err
	}
	return &request, nil
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


// GetRequests retrieves all loan requests from the database
func GetRequests() ([]models.LoanRequest, error) {
	var requests []models.LoanRequest
	cursor, err := requestsCollection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &requests); err != nil {
		return nil, err
	}
	return requests, nil
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
	
	cursor, err := offersCollection.Aggregate(context.TODO(), pipeline)
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
	
	lendersCursor, err := offersCollection.Aggregate(context.TODO(), topLendersPipeline)
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
			"_id": "$token",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"count": -1}},
		{"$limit": 5},
	}
	
	collateralCursor, err := offersCollection.Aggregate(context.TODO(), collateralPipeline)
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

// User-related database functions

// GetOrCreateUser retrieves an existing user or creates a new one
func GetOrCreateUser(walletAddress string, username *string, email *string) (*models.User, error) {
	// Try to find existing user
	var existingUser models.User
	err := usersCollection.FindOne(context.TODO(), bson.M{"wallet_address": walletAddress}).Decode(&existingUser)
	
	if err == nil {
		// User exists, update last active
		now := time.Now()
		existingUser.LastActive = now
		existingUser.UpdatedAt = now
		
		_, updateErr := usersCollection.UpdateOne(
			context.TODO(),
			bson.M{"wallet_address": walletAddress},
			bson.M{"$set": bson.M{
				"last_active": now,
				"updated_at": now,
			}},
		)
		if updateErr != nil {
			log.Printf("Error updating user last active: %v", updateErr)
		}
		
		return &existingUser, nil
	}
	
	if err != mongo.ErrNoDocuments {
		return nil, err
	}
	
	// Create new user
	now := time.Now()
	newUser := &models.User{
		ID:                     primitive.NewObjectID(),
		WalletAddress:          walletAddress,
		Username:               username,
		Email:                  email,
		CreditScore:            0,
		TotalLoansAsLender:     0,
		TotalLoansAsBorrower:   0,
		TotalVolumeLent:        0,
		TotalVolumeBorrowed:    0,
		DefaultCount:           0,
		SuccessfulLoansCount:   0,
		JoinDate:               now,
		LastActive:             now,
		IsActive:               true,
		CreatedAt:              now,
		UpdatedAt:              now,
	}
	
	_, err = usersCollection.InsertOne(context.TODO(), newUser)
	if err != nil {
		return nil, err
	}
	
	return newUser, nil
}

// GetUserByAddress retrieves a user by wallet address
func GetUserByAddress(walletAddress string) (*models.User, error) {
	var user models.User
	err := usersCollection.FindOne(context.TODO(), bson.M{"wallet_address": walletAddress}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser updates user information
func UpdateUser(walletAddress string, updates map[string]interface{}) (*models.User, error) {
	updates["updated_at"] = time.Now()
	
	_, err := usersCollection.UpdateOne(
		context.TODO(),
		bson.M{"wallet_address": walletAddress},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}
	
	return GetUserByAddress(walletAddress)
}

// GetUserLoans retrieves all loans for a user (as lender or borrower)
func GetUserLoans(userAddress string) ([]models.Loan, error) {
	var loans []models.Loan
	filter := bson.M{
		"$or": []bson.M{
			{"lender_address": userAddress},
			{"borrower_address": userAddress},
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

// GetUserOffers retrieves all offers created by a user
func GetUserOffers(userAddress string) ([]models.LoanOffer, error) {
	var offers []models.LoanOffer
	filter := bson.M{"lender_address": userAddress}
	
	cursor, err := offersCollection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &offers); err != nil {
		return nil, err
	}
	return offers, nil
}

// GetUserProfile retrieves comprehensive user profile with all related data
func GetUserProfile(userAddress string) (*models.UserProfile, error) {
	// Get user
	user, err := GetUserByAddress(userAddress)
	if err != nil {
		return nil, err
	}
	
	// Get all loans for user
	loans, err := GetUserLoans(userAddress)
	if err != nil {
		return nil, err
	}
	
	// Get user offers
	offers, err := GetUserOffers(userAddress)
	if err != nil {
		return nil, err
	}
	
	// Get user requests
	requests, err := GetUserActiveRequests(userAddress)
	if err != nil {
		return nil, err
	}
	
	// Categorize loans
	var activeLoansAsBorrower []models.Loan
	var activeLoansAsLender []models.Loan
	var completedLoansAsBorrower []models.Loan
	var completedLoansAsLender []models.Loan
	
	for _, loan := range loans {
		if loan.BorrowerAddress == userAddress {
			if loan.IsActive {
				activeLoansAsBorrower = append(activeLoansAsBorrower, loan)
			} else {
				completedLoansAsBorrower = append(completedLoansAsBorrower, loan)
			}
		}
		if loan.LenderAddress == userAddress {
			if loan.IsActive {
				activeLoansAsLender = append(activeLoansAsLender, loan)
			} else {
				completedLoansAsLender = append(completedLoansAsLender, loan)
			}
		}
	}
	
	// Filter active offers
	var activeOffers []models.LoanOffer
	for _, offer := range offers {
		if offer.IsActive != nil && *offer.IsActive {
			activeOffers = append(activeOffers, offer)
		}
	}
	
	// Calculate stats
	totalVolume := 0.0
	totalAPY := 0.0
	apyCount := 0
	completedLoansCount := int32(len(completedLoansAsBorrower) + len(completedLoansAsLender))
	
	for _, loan := range loans {
		if !loan.IsActive {
			totalVolume += loan.Amount
			totalAPY += loan.APY
			apyCount++
		}
	}
	
	averageAPY := 0.0
	if apyCount > 0 {
		averageAPY = totalAPY / float64(apyCount)
	}
	
	successRate := 100.0
	if user.TotalLoansAsLender > 0 || user.TotalLoansAsBorrower > 0 {
		totalLoans := user.TotalLoansAsLender + user.TotalLoansAsBorrower
		if totalLoans > 0 {
			successRate = (float64(user.SuccessfulLoansCount) / float64(totalLoans)) * 100
		}
	}
	
	stats := models.UserStats{
		LoansCompleted: completedLoansCount,
		TotalVolume:    totalVolume,
		AverageAPY:     averageAPY,
		SuccessRate:    successRate,
	}
	
	profile := &models.UserProfile{
		User:                        *user,
		ActiveLoansAsBorrower:       activeLoansAsBorrower,
		ActiveLoansAsLender:         activeLoansAsLender,
		CompletedLoansAsBorrower:    completedLoansAsBorrower,
		CompletedLoansAsLender:      completedLoansAsLender,
		ActiveOffers:                activeOffers,
		ActiveRequests:              requests,
		TotalStats:                  stats,
	}
	
	return profile, nil
}

// AcceptLoanOffer creates a loan record and updates the offer status
func AcceptLoanOffer(offerID string, acceptanceData *struct {
	BorrowerAddress     string `json:"borrower_address"`
	TransactionSignature string `json:"transaction_signature"`
	OpenLoanPDA         string `json:"open_loan_pda"`
	CollateralVaultPDA  string `json:"collateral_vault_pda"`
	StartDate           string `json:"start_date,omitempty"`
	EndDate             string `json:"end_date,omitempty"`
}) (*models.Loan, error) {
	
	// Get the original offer
	offer, err := GetOfferByID(offerID)
	if err != nil {
		return nil, err
	}
	
	// Parse dates and calculate proper end date based on offer duration
	var startDate, endDate time.Time
	if acceptanceData.StartDate != "" {
		startDate, _ = time.Parse(time.RFC3339, acceptanceData.StartDate)
	} else {
		startDate = time.Now()
	}
	if acceptanceData.EndDate != "" {
		endDate, _ = time.Parse(time.RFC3339, acceptanceData.EndDate)
	} else {
		// Use the actual duration from the offer
		durationSeconds := *offer.Duration
		// If duration seems to be in days (< 365), convert to seconds
		if durationSeconds < 365 {
			durationSeconds = durationSeconds * 24 * 60 * 60
		}
		endDate = startDate.Add(time.Duration(durationSeconds) * time.Second)
	}
	
	// Create loan record
	loan := &models.Loan{
		ID:               primitive.NewObjectID(),
		LoanAddress:      acceptanceData.OpenLoanPDA,
		LenderAddress:    *offer.LenderAddress,
		BorrowerAddress:  acceptanceData.BorrowerAddress,
		Amount:           *offer.Amount,
		APY:              *offer.APY,
		Token:            *offer.Token,
		CollateralToken:  *offer.CollateralName,
		CollateralAmount: *offer.CollateralAmount,
		Duration:         *offer.Duration,
		StartDate:        startDate,
		EndDate:          endDate,
		IsActive:         true,
		CreatedAt:        time.Now(),
	}
	
	// Insert loan
	_, err = loansCollection.InsertOne(context.TODO(), loan)
	if err != nil {
		return nil, err
	}
	
	// Update offer to inactive
	offerObjID, _ := primitive.ObjectIDFromHex(offerID)
	inactive := false
	_, err = offersCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": offerObjID},
		bson.M{"$set": bson.M{"is_active": &inactive}},
	)
	if err != nil {
		log.Printf("Error updating offer status: %v", err)
	}
	
	// Update user statistics for both lender and borrower
	go func() {
		// Update lender stats
		lenderUpdates := map[string]interface{}{
			"$inc": bson.M{
				"total_loans_as_lender": 1,
				"total_volume_lent":     *offer.Amount,
			},
			"$set": bson.M{
				"last_active": time.Now(),
				"updated_at":  time.Now(),
			},
		}
		_, lenderErr := usersCollection.UpdateOne(
			context.TODO(),
			bson.M{"wallet_address": *offer.LenderAddress},
			lenderUpdates,
		)
		if lenderErr != nil {
			log.Printf("Error updating lender stats: %v", lenderErr)
		}
		
		// Update borrower stats
		borrowerUpdates := map[string]interface{}{
			"$inc": bson.M{
				"total_loans_as_borrower": 1,
				"total_volume_borrowed":   *offer.Amount,
			},
			"$set": bson.M{
				"last_active": time.Now(),
				"updated_at":  time.Now(),
			},
		}
		_, borrowerErr := usersCollection.UpdateOne(
			context.TODO(),
			bson.M{"wallet_address": acceptanceData.BorrowerAddress},
			borrowerUpdates,
		)
		if borrowerErr != nil {
			log.Printf("Error updating borrower stats: %v", borrowerErr)
		}
		
		log.Printf("Updated user statistics for loan %s", loan.ID.Hex())
	}()
	
	return loan, nil
}
