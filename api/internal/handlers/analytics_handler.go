package handlers

import (
	"net/http"

	"b2-management/internal/repository"

	"github.com/gin-gonic/gin"
)

// AnalyticsHandler gerencia requisições de dados analíticos
type AnalyticsHandler struct {
	analyticsRepo *repository.BucketAnalyticsRepository
}

func NewAnalyticsHandler(analyticsRepo *repository.BucketAnalyticsRepository) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsRepo: analyticsRepo}
}

// ListAnalytics retorna todos os dados analíticos dos buckets
// @Summary Listar analytics
// @Tags Analytics
// @Accept json
// @Produce json
// @Success 200 {array} models.BucketAnalytics
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /analytics [get]
func (h *AnalyticsHandler) ListAnalytics(c *gin.Context) {
	analytics, err := h.analyticsRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetBucketAnalytics retorna dados analíticos de um bucket específico
// @Summary Obter analytics de um bucket
// @Tags Analytics
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Success 200 {object} models.BucketAnalytics
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /analytics/{name} [get]
func (h *AnalyticsHandler) GetBucketAnalytics(c *gin.Context) {
	bucketName := c.Param("name")

	analytics, err := h.analyticsRepo.FindByBucketName(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if analytics == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "analytics not found for this bucket"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}
