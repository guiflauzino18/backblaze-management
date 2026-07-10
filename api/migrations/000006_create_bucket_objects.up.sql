CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS bucket_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_name VARCHAR(255) NOT NULL,
    object_key VARCHAR(2048) NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    last_modified TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(bucket_name, object_key)
);

CREATE INDEX idx_bucket_objects_bucket_name ON bucket_objects(bucket_name);
CREATE INDEX idx_bucket_objects_object_key ON bucket_objects(object_key);
CREATE INDEX idx_bucket_objects_search ON bucket_objects USING gin (object_key gin_trgm_ops);
CREATE INDEX idx_bucket_objects_deleted ON bucket_objects(bucket_name, is_deleted);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_bucket_objects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bucket_objects_updated_at
    BEFORE UPDATE ON bucket_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_bucket_objects_updated_at();