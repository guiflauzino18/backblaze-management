.PHONY: run build test test-coverage lint migrate-up migrate-down migrate-create docker-up docker-down swag seed clean dev

# Variables
APP_NAME = backblaze-management
DB_URL ?= postgres://b2management:b2management*.@localhost:5432/b2management?sslmode=disable
API_DIR = ./api

## Development
run:
	make seed && cd $(API_DIR) && go run ./cmd/api & cd ./frontend && npm run dev

build:
	cd $(API_DIR) && go build -ldflags="-w -s" -o bin/$(APP_NAME) ./cmd/api

## Testing
test:
	cd $(API_DIR) && go test ./... -v -count=1

test-coverage:
	cd $(API_DIR) && go test ./... -coverprofile=coverage.out -count=1
	cd $(API_DIR) && go tool cover -html=coverage.out -o coverage.html

## Linting
lint:
	cd $(API_DIR) && golangci-lint run ./...

## Database migrations
migrate-up:
	~/go/bin/migrate -path $(API_DIR)/migrations -database "$(DB_URL)" up

migrate-down:
	~/go/bin/migrate -path $(API_DIR)/migrations -database "$(DB_URL)" down 1

migrate-create:
	@read -p "Migration name: " name; \
	~/go/bin/migrate create -ext sql -dir $(API_DIR)/migrations -seq $$name

## Seed
seed:
	cd $(API_DIR) && go run ./cmd/seed

## Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

## Documentation
swag:
	cd $(API_DIR) && ~/go/bin/swag init -g cmd/api/main.go -o docs

## Frontend
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

## Utilities
clean:
	rm -rf $(API_DIR)/bin/ $(API_DIR)/coverage.out $(API_DIR)/coverage.html $(API_DIR)/tmp/

tidy:
	cd $(API_DIR) && go mod tidy

vendor:
	cd $(API_DIR) && go mod vendor

## Full development setup
dev: docker-up migrate-up seed
	cd $(API_DIR) && go run ./cmd/api

dev-frontend:
	cd frontend && npm run dev

kill:
	kill -9 $(lsof -t -i:8080)