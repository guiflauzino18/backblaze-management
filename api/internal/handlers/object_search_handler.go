package handlers

import (
	"net/http"
	"strconv"

	"b2-management/internal/aws"
	"b2-management/internal/repository"

	"github.com/gin-gonic/gin"
)

// ObjectSearchHandler gerencia busca de objetos indexados
type ObjectSearchHandler struct {
	objectRepo *repository.ObjectIndexRepository
}

func NewObjectSearchHandler(objectRepo *repository.ObjectIndexRepository) *ObjectSearchHandler {
	return &ObjectSearchHandler{objectRepo: objectRepo}
}

// SearchObjects busca objetos indexados no banco e retorna dados atualizados da AWS
// @Summary Buscar objetos
// @Tags Objects
// @Accept json
// @Produce json
// @Param name path string true "Nome do bucket"
// @Param q query string true "Termo de busca"
// @Param limit query int false "Limite de resultados (default 20)"
// @Param offset query int false "Offset para paginação (default 0)"
// @Param include_deleted query bool false "Incluir objetos excluídos (default false)"
// @Success 200 {object} models.ObjectIndexSearchResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security BearerAuth
// @Router /buckets/{name}/objects/search [get]
func (h *ObjectSearchHandler) SearchObjects(c *gin.Context) {
	bucketName := c.Param("name")
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	includeDeleted := c.Query("include_deleted") == "true"

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Busca no banco
	searchResult, err := h.objectRepo.SearchObjects(bucketName, query, limit, offset, includeDeleted)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Para cada resultado, tenta obter metadados atualizados da AWS
	// Se falhar (objeto não existe mais), mantém os dados do banco
	for i, result := range searchResult.Results {
		meta, err := aws.GetObjectMetadata(bucketName, result.ObjectKey)
		if err == nil && meta != nil {
			if meta.ContentLength != nil {
				searchResult.Results[i].Size = *meta.ContentLength
			}
			if meta.LastModified != nil {
				searchResult.Results[i].LastModified = *meta.LastModified
			}
		}
	}

	c.JSON(http.StatusOK, searchResult)
}
