DROP TRIGGER IF EXISTS trg_bucket_objects_updated_at ON bucket_objects;
DROP FUNCTION IF EXISTS update_bucket_objects_updated_at();
DROP TABLE IF EXISTS bucket_objects;