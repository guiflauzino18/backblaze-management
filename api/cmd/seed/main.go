package main

import (
	"log"
	"os"

	"b2-management/internal/config"
	"b2-management/internal/database"
	"b2-management/internal/models"
	"b2-management/internal/repository"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	_ = godotenv.Load()

	// Load config
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

	// Create repositories
	userRepo := repository.NewUserRepository(db)

	// Check if admin already exists
	existing, err := userRepo.FindByEmail("admin@b2management.com")
	if err != nil {
		log.Fatalf("Failed to check existing admin: %v", err)
	}

	if existing != nil {
		log.Println("Admin user already exists, skipping seed")
		os.Exit(0)
	}

	// Create admin user
	admin := models.CreateUserRequest{
		Name:     "Admin",
		Surname:  "System",
		Email:    "admin@b2management.com",
		Password: "sysadmin",
		Role:     "admin",
		Gender:   "neutral",
	}

	user, err := userRepo.Create(&admin)
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	log.Printf("Admin user created successfully!")
	log.Printf("  ID:    %s", user.ID)
	log.Printf("  Email: admin@b2management.com")
	log.Printf("  Senha: sysadmin")

	// Set the DB_PASSWORD if it was provided via flag or env
	if cfg.DBPassword == "" {
		log.Println("Warning: DB_PASSWORD not set. Make sure the database is accessible.")
	}
}
