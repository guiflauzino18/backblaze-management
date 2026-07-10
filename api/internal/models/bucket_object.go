package models

import (
	"time"

	"github.com/google/uuid"
)

type BucketObject struct {
	ID           uuid.UUID `json:"id"`
	BucketName   string    `json:"bucket_name"`
	ObjectKey    string    `json:"object_key"`
	Size         int64     `json:"size"`
	LastModified time.Time `json:"last_modified"`
	IsDeleted    bool      `json:"is_deleted"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ObjectIndexSearchResult struct {
	ObjectKey    string    `json:"object_key"`
	Size         int64     `json:"size"`
	LastModified time.Time `json:"last_modified"`
	IsDeleted    bool      `json:"is_deleted"`
}

type ObjectIndexSearchResponse struct {
	Results []ObjectIndexSearchResult `json:"results"`
	Total   int                       `json:"total"`
}
