package handlers

import (
	"net/http"
	"strconv"

	"b2-management/internal/aws"

	"github.com/gin-gonic/gin"
)

// BucketHandler gerencia operações de buckets e objetos S3
type BucketHandler struct{}

func NewBucketHandler() *BucketHandler {
	return &BucketHandler{}
}

// ListBuckets lista todos os buckets
// @Summary Listar buckets
// @Tags Buckets
// @Accept json
// @Produce json
// @Success 200 {array} types.Bucket
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets [get]
func (h *BucketHandler) ListBuckets(c *gin.Context) {
	buckets, err := aws.ListBuckets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, buckets)
}

// CreateBucket cria um novo bucket
// @Summary Criar bucket
// @Tags Buckets
// @Accept json
// @Produce json
// @Param bucket body CreateBucketRequest true "Dados do bucket"
// @Success 201 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets [post]
func (h *BucketHandler) CreateBucket(c *gin.Context) {
	var req CreateBucketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Apenas admin pode criar buckets
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	err := aws.CreateBucket(req.Name, req.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "bucket created successfully"})
}

// DeleteBucket deleta um bucket
// @Summary Deletar bucket
// @Tags Buckets
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Success 200 {object} SuccessResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name} [delete]
func (h *BucketHandler) DeleteBucket(c *gin.Context) {
	bucketName := c.Param("name")

	// Apenas admin pode deletar buckets
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	err := aws.DeleteBucket(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "bucket deleted successfully"})
}

// ListObjects lista objetos em um bucket
// @Summary Listar objetos
// @Tags Objects
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Param prefix query string false "Prefixo de filtro"
// @Success 200 {array} types.Object
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/objects [get]
func (h *BucketHandler) ListObjects(c *gin.Context) {
	bucketName := c.Param("name")
	prefix := c.Query("prefix")

	objects, err := aws.ListObjects(bucketName, prefix)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, objects)
}

// ListObjectVersions lista versões de um objeto
// @Summary Listar versões de objeto
// @Tags Objects
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Param key query string true "Chave do objeto"
// @Success 200 {array} types.ObjectVersion
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/objects/versions [get]
func (h *BucketHandler) ListObjectVersions(c *gin.Context) {
	bucketName := c.Param("name")
	key := c.Query("key")

	versions, err := aws.ListObjectVersions(bucketName, key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, versions)
}

// UploadObject faz upload de um arquivo
// @Summary Upload de arquivo
// @Tags Objects
// @Accept multipart/form-data
// @Produce json
// @Param name path string true "Nome do bucket"
// @Param key path string true "Chave do objeto"
// @Param file formData file true "Arquivo para upload"
// @Success 201 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/objects/{key}/upload [post]
func (h *BucketHandler) UploadObject(c *gin.Context) {
	bucketName := c.Param("name")
	key := c.Param("key")

	// Apenas admin pode fazer upload
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer src.Close()

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	err = aws.UploadFile(bucketName, key, src, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "file uploaded successfully"})
}

// DownloadObject faz download de um arquivo
// @Summary Download de arquivo
// @Tags Objects
// @Accept json
// @Produce application/octet-stream
// @Param name path string true "Nome do bucket"
// @Param key path string true "Chave do objeto"
// @Success 200 {file} binary
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/objects/{key}/download [get]
func (h *BucketHandler) DownloadObject(c *gin.Context) {
	bucketName := c.Param("name")
	key := c.Param("key")

	data, err := aws.DownloadFile(bucketName, key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+key)
	c.Data(http.StatusOK, "application/octet-stream", data)
}

// DeleteObject deleta um objeto
// @Summary Deletar objeto
// @Tags Objects
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Param key path string true "Chave do objeto"
// @Success 200 {object} SuccessResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/objects/{key} [delete]
func (h *BucketHandler) DeleteObject(c *gin.Context) {
	bucketName := c.Param("name")
	key := c.Param("key")

	// Apenas admin pode deletar objetos
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	err := aws.DeleteObject(bucketName, key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "object deleted successfully"})
}

// GetLifecycle obtém regras de lifecycle de um bucket
// @Summary Obter lifecycle configuration
// @Tags Lifecycle
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Success 200 {object} s3.GetBucketLifecycleConfigurationOutput
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/lifecycle [get]
func (h *BucketHandler) GetLifecycle(c *gin.Context) {
	bucketName := c.Param("name")

	result, err := aws.GetLifecycleConfiguration(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// DeleteLifecycle deleta regras de lifecycle de um bucket
// @Summary Deletar lifecycle configuration
// @Tags Lifecycle
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Success 200 {object} SuccessResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/lifecycle [delete]
func (h *BucketHandler) DeleteLifecycle(c *gin.Context) {
	bucketName := c.Param("name")

	// Apenas admin pode modificar lifecycle
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	err := aws.DeleteLifecycleConfiguration(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "lifecycle configuration deleted successfully"})
}

// GetStorageMetrics obtém métricas de armazenamento de um bucket
// @Summary Obter métricas de armazenamento
// @Tags Storage
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Success 200 {object} StorageMetricsResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/storage [get]
func (h *BucketHandler) GetStorageMetrics(c *gin.Context) {
	bucketName := c.Param("name")

	totalSize, objectCount, err := aws.GetBucketStorageMetrics(bucketName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bucket_name":  bucketName,
		"total_size":   totalSize,
		"object_count": objectCount,
	})
}

// Request DTOs

type CreateBucketRequest struct {
	Name   string `json:"name" binding:"required,min=3,max=63"`
	Region string `json:"region" binding:"required"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type StorageMetricsResponse struct {
	BucketName  string `json:"bucket_name"`
	TotalSize   int64  `json:"total_size"`
	ObjectCount int64  `json:"object_count"`
}

// Helper para converter tamanho em bytes para formato legível
func FormatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return strconv.FormatInt(bytes, 10) + " B"
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return strconv.FormatFloat(float64(bytes)/float64(div), 'f', 2, 64) + " " + "KMGTPE"[exp:exp+1] + "B"
}
