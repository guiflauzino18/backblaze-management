package aws

import (
	"context"
	"fmt"

	"b2-management/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	S3Client *s3.Client
	Config   aws.Config
)

// InitializeAWSClient inicializa o cliente AWS S3 com as credenciais globais
func InitializeAWSClient(cfg *config.Config) error {
	// Criar credenciais estáticas
	creds := aws.NewCredentialsCache(
		credentials.NewStaticCredentialsProvider(
			cfg.AWSAccessKey,
			cfg.AWSSecretKey,
			"",
		),
	)

	// Carregar configuração AWS
	awsConfig, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithRegion(cfg.AWSRegion),
	)
	if err != nil {
		return fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Atribuir credenciais
	awsConfig.Credentials = creds

	// Sobrescrever endpoint para Backblaze B2
	awsConfig.EndpointResolverWithOptions = aws.EndpointResolverWithOptionsFunc(
		func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			if service == s3.ServiceID {
				return aws.Endpoint{
					URL:               cfg.AWSEndpoint,
					SigningRegion:     cfg.AWSRegion,
					HostnameImmutable: true,
				}, nil
			}
			return aws.Endpoint{}, fmt.Errorf("unknown endpoint for service: %s", service)
		},
	)

	Config = awsConfig
	S3Client = s3.NewFromConfig(awsConfig)

	return nil
}

// GetS3Client retorna o cliente S3 inicializado
func GetS3Client() (*s3.Client, error) {
	if S3Client == nil {
		return nil, fmt.Errorf("AWS client not initialized")
	}
	return S3Client, nil
}
