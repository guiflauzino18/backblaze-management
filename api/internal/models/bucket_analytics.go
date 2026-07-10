package models

import (
	"time"

	"github.com/google/uuid"
)

type BucketAnalytics struct {
	ID            uuid.UUID `json:"id"`
	BucketName    string    `json:"bucket_name"`
	ObjectCount   int64     `json:"object_count"`
	StorageSize   int64     `json:"storage_size"`
	LastUpdatedAt time.Time `json:"last_updated_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
