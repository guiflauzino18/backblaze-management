package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// GetBucketStorageMetrics obtém métricas de armazenamento de um bucket
func GetBucketStorageMetrics(bucketName string) (int64, int64, error) {
	client, err := GetS3Client()
	if err != nil {
		return 0, 0, err
	}

	// Listar todos os objetos para calcular métricas
	result, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: &bucketName,
	})
	if err != nil {
		return 0, 0, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	var totalSize int64
	var objectCount int64

	for _, obj := range result.Contents {
		if obj.Size != nil {
			totalSize += *obj.Size
		}
		objectCount++
	}

	// Se houver mais páginas, continuar listando
	for result.IsTruncated != nil && *result.IsTruncated {
		result, err = client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
			Bucket:            &bucketName,
			ContinuationToken: result.NextContinuationToken,
		})
		if err != nil {
			return totalSize, objectCount, fmt.Errorf("failed to list more objects in bucket %s: %w", bucketName, err)
		}

		for _, obj := range result.Contents {
			if obj.Size != nil {
				totalSize += *obj.Size
			}
			objectCount++
		}
	}

	return totalSize, objectCount, nil
}

// GetObjectCount retorna a quantidade de objetos em um bucket
func GetObjectCount(bucketName string) (int64, error) {
	client, err := GetS3Client()
	if err != nil {
		return 0, err
	}

	result, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: &bucketName,
	})
	if err != nil {
		return 0, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	objectCount := int64(len(result.Contents))

	// Se houver mais páginas, continuar contando
	for result.IsTruncated != nil && *result.IsTruncated {
		result, err = client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
			Bucket:            &bucketName,
			ContinuationToken: result.NextContinuationToken,
		})
		if err != nil {
			return objectCount, fmt.Errorf("failed to list more objects in bucket %s: %w", bucketName, err)
		}
		objectCount += int64(len(result.Contents))
	}

	return objectCount, nil
}

// GetTotalStorageSize retorna o tamanho total armazenado em um bucket em bytes
func GetTotalStorageSize(bucketName string) (int64, error) {
	client, err := GetS3Client()
	if err != nil {
		return 0, err
	}

	result, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: &bucketName,
	})
	if err != nil {
		return 0, fmt.Errorf("failed to list objects in bucket %s: %w", bucketName, err)
	}

	var totalSize int64

	for _, obj := range result.Contents {
		if obj.Size != nil {
			totalSize += *obj.Size
		}
	}

	// Se houver mais páginas, continuar somando
	for result.IsTruncated != nil && *result.IsTruncated {
		result, err = client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
			Bucket:            &bucketName,
			ContinuationToken: result.NextContinuationToken,
		})
		if err != nil {
			return totalSize, fmt.Errorf("failed to list more objects in bucket %s: %w", bucketName, err)
		}

		for _, obj := range result.Contents {
			if obj.Size != nil {
				totalSize += *obj.Size
			}
		}
	}

	return totalSize, nil
}
