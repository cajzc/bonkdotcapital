package main

import (
	"context"
	"log"
	"os"

	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/routes"
	"backend/internal/websocket"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// --- Database Connection ---
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
		log.Println("MONGO_URI not set, defaulting to localhost.")
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer func() {
		if err = client.Disconnect(context.TODO()); err != nil {
			log.Fatalf("Failed to disconnect from MongoDB: %v", err)
		}
	}()
	log.Println("Successfully connected to MongoDB.")

	database := client.Database("lending_platform")
    db.InitCollections(database) // Initialize collections

	// --- Initialize WebSocket Hub ---
	hub := websocket.NewHub()
	go hub.Run() // Run the hub in a separate goroutine

	// --- Initialize Router ---
	router := gin.Default()

	// --- Create App context to hold dependencies ---
	app := &handlers.AppContext{
		DB:  database,
		Hub: hub,
	}

	// --- Setup Routes ---
	routes.SetupRoutes(router, app)

	// --- Start Server ---
	log.Println("Starting server on port 8080...")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}