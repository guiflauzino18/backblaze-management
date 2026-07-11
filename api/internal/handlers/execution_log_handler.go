package handlers

import (
	"net/http"

	"b2-management/internal/aws"
	"b2-management/internal/models"
	"b2-management/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ExecutionLogHandler struct {
	executionLogRepo *repository.ExecutionLogRepository
}

func NewExecutionLogHandler(executionLogRepo *repository.ExecutionLogRepository) *ExecutionLogHandler {
	return &ExecutionLogHandler{executionLogRepo: executionLogRepo}
}

// CreateLog godoc
// @Summary Create an execution log
// @Description Receive execution logs from an endpoint
// @Tags Execution Logs
// @Accept json
// @Produce json
// @Param request body models.CreateExecutionLogRequest true "Execution log request"
// @Success 201 {object} models.ExecutionLog
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/executions/logs [post]
func (h *ExecutionLogHandler) CreateLog(c *gin.Context) {
	var req models.CreateExecutionLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if bucket exists in Backblaze
	buckets, err := aws.ListBuckets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify bucket"})
		return
	}

	bucketExists := false
	for _, bucket := range buckets {
		if bucket.Name != nil && *bucket.Name == req.BucketName {
			bucketExists = true
			break
		}
	}

	if !bucketExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bucket not found"})
		return
	}

	// Get the endpoint user ID from the authenticated context
	endpointUserID, _ := c.Get("user_id")
	uid := endpointUserID.(uuid.UUID)

	log, err := h.executionLogRepo.Create(&req, &uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save execution log"})
		return
	}

	c.JSON(http.StatusCreated, log)
}

// ListLogs godoc
// @Summary List execution logs
// @Description Get paginated execution logs with optional filters
// @Tags Execution Logs
// @Accept json
// @Produce json
// @Param bucket_name query string false "Filter by bucket name"
// @Param exit_code query int false "Filter by exit code"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 20)"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /api/v1/executions/logs [get]
func (h *ExecutionLogHandler) ListLogs(c *gin.Context) {
	var filter models.ExecutionLogFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}

	logs, total, err := h.executionLogRepo.List(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list execution logs"})
		return
	}

	if logs == nil {
		logs = []*models.ExecutionLog{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       logs,
		"total":      total,
		"page":       filter.Page,
		"limit":      filter.Limit,
		"totalPages": (total + filter.Limit - 1) / filter.Limit,
	})
}

// ListBuckets godoc
// @Summary List unique bucket names from execution logs
// @Description Get distinct bucket names that have execution logs
// @Tags Execution Logs
// @Accept json
// @Produce json
// @Success 200 {array} string
// @Failure 500 {object} map[string]string
// @Router /api/v1/executions/buckets [get]
func (h *ExecutionLogHandler) ListBuckets(c *gin.Context) {
	buckets, err := h.executionLogRepo.ListBuckets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list buckets"})
		return
	}

	if buckets == nil {
		buckets = []string{}
	}

	c.JSON(http.StatusOK, buckets)
}
