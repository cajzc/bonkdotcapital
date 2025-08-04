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
		// websocket connection endpoint for a specific offer room
		api.GET("/ws/:offerId", func(c *gin.Context) {
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
		}

		// Routes for user-specific data
		users := api.Group("/users")
		{
			// route for getting user's active loans
			users.GET("/:userAddress/loans", app.GetUserActiveLoansHandler)

			// route for getting user's active loan requests
			users.GET("/:userAddress/requests", app.GetUserActiveRequestsHandler)
		}

		// Route for platform statistics
		api.GET("/stats", app.GetPlatformStatsHandler)
	}
}
