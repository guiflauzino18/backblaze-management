package aws

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// ListObjectsV2Paginated lista objetos em um bucket com paginação
func ListObjectsV2Paginated(bucketName string, continuationToken *string) (*s3.ListObjectsV2Output, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	input := &s3.ListObjectsV2Input{
		Bucket: &bucketName,
	}
	if continuationToken != nil {
		input.ContinuationToken = continuationToken
	}

	result, err := client.ListObjectsV2(context.TODO(), input)
	if err != nil {
		return nil, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	return result, nil
}

// ListObjectsV2VersionsPaginated lista versões de objetos em um bucket com paginação
func ListObjectsV2VersionsPaginated(bucketName string, keyMarker, versionIdMarker *string) (*s3.ListObjectVersionsOutput, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	input := &s3.ListObjectVersionsInput{
		Bucket: &bucketName,
	}
	if keyMarker != nil {
		input.KeyMarker = keyMarker
	}
	if versionIdMarker != nil {
		input.VersionIdMarker = versionIdMarker
	}

	result, err := client.ListObjectVersions(context.TODO(), input)
	if err != nil {
		return nil, fmt.Errorf("failed to list object versions in bucket %s: %w", bucketName, err)
	}

	return result, nil
}

// ListObjects lista objetos em um bucket
func ListObjects(bucketName, prefix string) (*s3.ListObjectsV2Output, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	var delimiter string = `/`

	result, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket:    &bucketName,
		Prefix:    &prefix,
		Delimiter: &delimiter,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	return result, nil
}

// ListObjectsWithDeleted lista objetos incluindo os que possuem delete marker
func ListObjectsWithDeleted(bucketName, prefix string) (*s3.ListObjectsV2Output, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	var delimiter string = `/`

	result, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket:    &bucketName,
		Prefix:    &prefix,
		Delimiter: &delimiter,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	// Busca versões para identificar objetos com delete marker
	versionsResult, err := client.ListObjectVersions(context.TODO(), &s3.ListObjectVersionsInput{
		Bucket: &bucketName,
		Prefix: &prefix,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list object versions in bucket %s: %w", bucketName, err)
	}

	// Mapeia keys que têm delete marker como versão mais recente
	deletedKeys := make(map[string]bool)
	for _, v := range versionsResult.DeleteMarkers {
		if v.IsLatest != nil && *v.IsLatest {
			deletedKeys[*v.Key] = true
		}
	}

	// Adiciona objetos deletados ao resultado
	for key := range deletedKeys {
		// Verifica se já não está em Contents
		found := false
		for _, obj := range result.Contents {
			if obj.Key != nil && *obj.Key == key {
				found = true
				break
			}
		}
		if !found {
			// Busca o LastModified do delete marker
			var lastModified *time.Time
			for _, dm := range versionsResult.DeleteMarkers {
				if dm.Key != nil && *dm.Key == key {
					lastModified = dm.LastModified
					break
				}
			}
			size := int64(0)
			result.Contents = append(result.Contents, types.Object{
				Key:          &key,
				Size:         &size,
				LastModified: lastModified,
			})
		}
	}

	return result, nil
}

// ListObjectVersions lista versões de um objeto
func ListObjectVersions(bucketName, key string) ([]types.ObjectVersion, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	result, err := client.ListObjectVersions(context.TODO(), &s3.ListObjectVersionsInput{
		Bucket: &bucketName,
		Prefix: &key,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list versions for object %s: %w", key, err)
	}

	return result.Versions, nil
}

// UploadFile faz upload de um arquivo para o bucket
func UploadFile(bucketName, key string, body io.Reader, contentType string) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      &bucketName,
		Key:         &key,
		Body:        body,
		ContentType: &contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file %s to bucket %s: %w", key, bucketName, err)
	}

	return nil
}

// DownloadFile faz download de um arquivo do bucket
func DownloadFile(bucketName, key, versionId string) ([]byte, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	input := &s3.GetObjectInput{
		Bucket: &bucketName,
		Key:    &key,
	}

	if versionId != "" {
		input.VersionId = &versionId
	}

	result, err := client.GetObject(context.TODO(), input)
	if err != nil {
		return nil, fmt.Errorf("failed to download file %s from bucket %s: %w", key, bucketName, err)
	}
	defer result.Body.Close()

	body, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}

	return body, nil
}

// DeleteObject deleta um objeto do bucket
func DeleteObject(bucketName, key string) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	_, err = client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: &bucketName,
		Key:    &key,
	})
	if err != nil {
		return fmt.Errorf("failed to delete object %s from bucket %s: %w", key, bucketName, err)
	}

	return nil
}

// GetObjectMetadata obtém metadados de um objeto
func GetObjectMetadata(bucketName, key string) (*s3.HeadObjectOutput, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	result, err := client.HeadObject(context.TODO(), &s3.HeadObjectInput{
		Bucket: &bucketName,
		Key:    &key,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata for object %s: %w", key, err)
	}

	return result, nil
}

// CopyObject copia um objeto dentro do mesmo bucket ou entre buckets
func CopyObject(sourceBucket, sourceKey, destBucket, destKey string) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	copySource := sourceBucket + "/" + sourceKey

	_, err = client.CopyObject(context.TODO(), &s3.CopyObjectInput{
		Bucket:     &destBucket,
		Key:        &destKey,
		CopySource: &copySource,
	})
	if err != nil {
		return fmt.Errorf("failed to copy object from %s/%s to %s/%s: %w",
			sourceBucket, sourceKey, destBucket, destKey, err)
	}

	return nil
}

// GeneratePresignedURL gera uma URL pré-assinada para download temporário
func GeneratePresignedURL(bucketName, key string, expiration time.Duration) (string, error) {
	client, err := GetS3Client()
	if err != nil {
		return "", err
	}

	presignClient := s3.NewPresignClient(client)
	presignResult, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: &bucketName,
		Key:    &key,
	}, s3.WithPresignExpires(expiration))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignResult.URL, nil
}
