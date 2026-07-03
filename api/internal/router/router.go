package router

import (
	"database/sql"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"b2-management/internal/config"
	"b2-management/internal/handlers"
	"b2-management/internal/middleware"
	"b2-management/internal/repository"
)

func Setup(db *sql.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Repositories
	userRepo := repository.NewUserRepository(db)
	sessionRepo := repository.NewSessionRepository(db)

	// Handlers
	healthHandler := handlers.NewHealthHandler(db)
	authHandler := handlers.NewAuthHandler(userRepo, sessionRepo, cfg.JWTSecret)
	userHandler := handlers.NewUserHandler(userRepo)

	// API routes
	v1 := r.Group("/api/v1")
	{
		// Public routes
		v1.GET("/health", healthHandler.Check)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/refresh", authHandler.RefreshToken)

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Auth
			protected.POST("/auth/logout", authHandler.Logout)
			protected.GET("/auth/me", authHandler.Me)

			// Users (admin only)
			admin := protected.Group("/users")
			admin.Use(middleware.RoleMiddleware("admin"))
			{
				admin.GET("", userHandler.List)
				admin.GET("/:id", userHandler.GetByID)
				admin.POST("", userHandler.Create)
				admin.PUT("/:id", userHandler.Update)
				admin.DELETE("/:id", userHandler.Delete)
			}
		}
	}

	return r
}
