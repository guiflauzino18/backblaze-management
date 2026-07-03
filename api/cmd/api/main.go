package main

import (
	"log"

	"b2-management/internal/config"
	"b2-management/internal/database"
	"b2-management/internal/router"
)

// @title B2 Management API
// @version 1.0
// @description API for managing Backblaze B2 cloud storage
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@b2management.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1
func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Setup router
	r := router.Setup(db, cfg)

	// Start server
	addr := ":" + cfg.ServerPort
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
