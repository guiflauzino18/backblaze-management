CREATE TABLE IF NOT EXISTS bucket_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_name VARCHAR(255) NOT NULL UNIQUE,
    object_count BIGINT NOT NULL DEFAULT 0,
    storage_size BIGINT NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bucket_analytics_bucket_name ON bucket_analytics(bucket_name);