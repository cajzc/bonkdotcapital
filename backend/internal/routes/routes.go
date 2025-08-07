package routes

import (
	"backend/internal/handlers"
	"backend/internal/websocket"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, app *handlers.AppContext) {
	// Group routes under /api/v1
	api := router.Group("/api/v1")
	{
		// websocket connection endpoint for a specific offer or request room
		api.GET("/ws/:roomId", func(c *gin.Context) {
			websocket.ServeWs(app.Hub, c)
		})

		// Routes for creating a new loan offer
		offers := api.Group("/offers")
		{
			// route for creating new loan offer
			offers.POST("/", app.CreateOfferHandler)

			// route for getting list of all loan offers
			offers.GET("/", app.GetOffersHandler)

			// route for getting details of specific loan offer
			offers.GET("/:offerId", app.GetOfferByIDHandler)
			
			// route for accepting a loan offer
			offers.POST("/:offerId/accept", app.AcceptLoanOfferHandler)
			
			// route for creating comment on specific loan offer
			offers.POST("/:offerId/comments", app.CreateCommentHandler)

			// route for getting all comments on a specific loan
			offers.GET("/:offerId/comments", app.GetCommentsHandler)
		}

		// Routes for loan requests
		requests := api.Group("/requests")
		{
			// route for getting list of all loan requests
			requests.GET("/", app.GetRequestsHandler)

			// route for getting details of specific loan request
			requests.GET("/:requestId", app.GetRequestByIDHandler)
			
			// route for creating comment on specific loan request
			requests.POST("/:requestId/comments", app.CreateRequestCommentHandler)

			// route for getting all comments on a specific loan request
			requests.GET("/:requestId/comments", app.GetRequestCommentsHandler)
		}

		// Routes for user-specific data
		users := api.Group("/users")
		{
			// route for creating/getting user
			users.POST("/:userAddress", app.CreateUserHandler)
			
			// route for getting user details
			users.GET("/:userAddress", app.GetUserHandler)
			
			// route for updating user information
			users.PATCH("/:userAddress", app.UpdateUserHandler)
			
			// route for getting comprehensive user profile
			users.GET("/:userAddress/profile", app.GetUserProfileHandler)

			// route for getting all user loans (active and completed)
			users.GET("/:userAddress/loans", app.GetUserLoansHandler)
			
			// route for getting user's offers
			users.GET("/:userAddress/offers", app.GetUserOffersHandler)

			// route for getting user's active loan requests
			users.GET("/:userAddress/requests", app.GetUserActiveRequestsHandler)
		}

		// Route for platform statistics
		api.GET("/stats", app.GetPlatformStatsHandler)
	}
}
