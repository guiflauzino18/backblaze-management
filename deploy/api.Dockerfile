# Stage 1: Build
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY api/go.mod api/go.sum ./
RUN go mod download

# Copy source code
COPY api/ ./

# Build the server binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/server ./cmd/api/

# Build the seed binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/seed ./cmd/seed/

# Stage 2: Runtime
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binaries from builder
COPY --from=builder /app/server .
COPY --from=builder /app/seed .

# Copy migrations
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

CMD ["./server"]