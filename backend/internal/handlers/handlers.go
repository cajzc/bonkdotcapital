package handlers

import (
	"encoding/json"
	"backend/internal/db"
	"backend/internal/models"
	"backend/internal/websocket"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// AppContext holds application-wide dependencies like the DB connection and WebSocket hub.
type AppContext struct {
	DB  *mongo.Database
	Hub *websocket.Hub
}


// CreateOfferHandler creates a new loan offer and broadcasts it via WebSocket
func (app *AppContext) CreateOfferHandler(c *gin.Context) {
	var offer models.LoanOffer
	if err := c.ShouldBindJSON(&offer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	createdOffer, err := db.CreateOffer(&offer)
	if err != nil {
		log.Printf("Error creating offer: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create offer"})
		return
	}

    // New offers are broadcast to a general "offers" room for all clients to see.
	broadcastMessage, err := json.Marshal(createdOffer)
	if err == nil {
		app.Hub.Broadcast <- websocket.Message{Room: "offers", Content: broadcastMessage}
	} else {
		log.Printf("Error marshalling offer for broadcast: %v", err)
	}

	c.JSON(http.StatusCreated, createdOffer)
}

// GetOffersHandler retrieves all loan offers from the database
func (app *AppContext) GetOffersHandler(c *gin.Context) {
	offers, err := db.GetOffers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve offers"})
		return
	}
	c.JSON(http.StatusOK, offers)
}

// GetOfferByIDHandler retrieves a specific loan offer by its ID
func (app *AppContext) GetOfferByIDHandler(c *gin.Context) {
	offerID := c.Param("offerId")
	offer, err := db.GetOfferByID(offerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Offer not found"})
		return
	}
	c.JSON(http.StatusOK, offer)
}


// CreateCommentHandler creates a new comment on a loan offer and broadcasts it
func (app *AppContext) CreateCommentHandler(c *gin.Context) {
	offerID := c.Param("offerId")
	var comment models.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	createdComment, err := db.CreateComment(offerID, &comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

    // New comments are broadcast only to the room for that specific offer.
	broadcastMessage, err := json.Marshal(createdComment)
	if err == nil {
		app.Hub.Broadcast <- websocket.Message{Room: offerID, Content: broadcastMessage}
	} else {
		log.Printf("Error marshalling comment for broadcast: %v", err)
	}

	c.JSON(http.StatusCreated, createdComment)
}

// GetCommentsHandler retrieves all comments for a specific loan offer
func (app *AppContext) GetCommentsHandler(c *gin.Context) {
	offerID := c.Param("offerId")
	comments, err := db.GetCommentsForOffer(offerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
		return
	}
	c.JSON(http.StatusOK, comments)
}


// GetUserActiveLoansHandler retrieves all active loans for a user (as lender or borrower)
func (app *AppContext) GetUserActiveLoansHandler(c *gin.Context) {
	userAddress := c.Param("userAddress")
	if userAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User address is required"})
		return
	}

	loans, err := db.GetUserActiveLoans(userAddress)
	if err != nil {
		log.Printf("Error retrieving user active loans: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user active loans"})
		return
	}

	c.JSON(http.StatusOK, loans)
}

// GetUserActiveRequestsHandler retrieves all active loan requests for a borrower
func (app *AppContext) GetUserActiveRequestsHandler(c *gin.Context) {
	userAddress := c.Param("userAddress")
	if userAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User address is required"})
		return
	}

	requests, err := db.GetUserActiveRequests(userAddress)
	if err != nil {
		log.Printf("Error retrieving user active requests: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user active requests"})
		return
	}

	c.JSON(http.StatusOK, requests)
}


// GetRequestsHandler retrieves all loan requests from the database
func (app *AppContext) GetRequestsHandler(c *gin.Context) {
	requests, err := db.GetRequests()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve requests"})
		return
	}
	c.JSON(http.StatusOK, requests)
}

// GetRequestByIDHandler retrieves a specific loan request by its ID
func (app *AppContext) GetRequestByIDHandler(c *gin.Context) {
	requestID := c.Param("requestId")
	request, err := db.GetRequestByID(requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}
	c.JSON(http.StatusOK, request)
}

// CreateRequestCommentHandler creates a new comment on a loan request and broadcasts it
func (app *AppContext) CreateRequestCommentHandler(c *gin.Context) {
	requestID := c.Param("requestId")
	var comment models.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	createdComment, err := db.CreateRequestComment(requestID, &comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

    // New comments are broadcast only to the room for that specific request.
	broadcastMessage, err := json.Marshal(createdComment)
	if err == nil {
		app.Hub.Broadcast <- websocket.Message{Room: requestID, Content: broadcastMessage}
	} else {
		log.Printf("Error marshalling comment for broadcast: %v", err)
	}

	c.JSON(http.StatusCreated, createdComment)
}

// GetRequestCommentsHandler retrieves all comments for a specific loan request
func (app *AppContext) GetRequestCommentsHandler(c *gin.Context) {
	requestID := c.Param("requestId")
	comments, err := db.GetCommentsForRequest(requestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
		return
	}
	c.JSON(http.StatusOK, comments)
}

// GetPlatformStatsHandler retrieves platform-wide statistics and analytics
func (app *AppContext) GetPlatformStatsHandler(c *gin.Context) {
	stats, err := db.GetPlatformStats()
	if err != nil {
		log.Printf("Error retrieving platform statistics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve platform statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
