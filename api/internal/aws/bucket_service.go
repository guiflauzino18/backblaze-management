package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// ListBuckets lista todos os buckets disponíveis
func ListBuckets() ([]types.Bucket, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	result, err := client.ListBuckets(context.TODO(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to list buckets: %w", err)
	}

	return result.Buckets, nil
}

// CreateBucket cria um novo bucket
func CreateBucket(bucketName, region string) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	_, err = client.CreateBucket(context.TODO(), &s3.CreateBucketInput{
		Bucket: &bucketName,
		CreateBucketConfiguration: &types.CreateBucketConfiguration{
			LocationConstraint: types.BucketLocationConstraint(region),
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create bucket %s: %w", bucketName, err)
	}

	return nil
}

// DeleteBucket deleta um bucket (deve estar vazio)
func DeleteBucket(bucketName string) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	_, err = client.DeleteBucket(context.TODO(), &s3.DeleteBucketInput{
		Bucket: &bucketName,
	})
	if err != nil {
		return fmt.Errorf("failed to delete bucket %s: %w", bucketName, err)
	}

	return nil
}

// BucketExists verifica se um bucket existe
func BucketExists(bucketName string) (bool, error) {
	client, err := GetS3Client()
	if err != nil {
		return false, err
	}

	_, err = client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: &bucketName,
	})
	if err != nil {
		return false, nil
	}

	return true, nil
}
