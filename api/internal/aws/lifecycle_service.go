package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// GetLifecycleConfiguration obtém as regras de lifecycle de um bucket
func GetLifecycleConfiguration(bucketName string) (*s3.GetBucketLifecycleConfigurationOutput, error) {
	client, err := GetS3Client()
	if err != nil {
		return nil, err
	}

	result, err := client.GetBucketLifecycleConfiguration(context.TODO(), &s3.GetBucketLifecycleConfigurationInput{
		Bucket: &bucketName,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get lifecycle configuration for bucket %s: %w", bucketName, err)
	}

	return result, nil
}

// DeleteLifecycleConfiguration remove todas as regras de lifecycle de um bucket
func DeleteLifecycleConfiguration(bucketName string) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	_, err = client.DeleteBucketLifecycle(context.TODO(), &s3.DeleteBucketLifecycleInput{
		Bucket: &bucketName,
	})
	if err != nil {
		return fmt.Errorf("failed to delete lifecycle configuration for bucket %s: %w", bucketName, err)
	}

	return nil
}

// PutLifecycleConfiguration salva as regras de lifecycle de um bucket
func PutLifecycleConfiguration(bucketName string, rules []types.LifecycleRule) error {
	client, err := GetS3Client()
	if err != nil {
		return err
	}

	_, err = client.PutBucketLifecycleConfiguration(context.TODO(), &s3.PutBucketLifecycleConfigurationInput{
		Bucket: &bucketName,
		LifecycleConfiguration: &types.BucketLifecycleConfiguration{
			Rules: rules,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to put lifecycle configuration for bucket %s: %w", bucketName, err)
	}

	return nil
}
