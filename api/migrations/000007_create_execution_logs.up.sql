CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_name VARCHAR(255) NOT NULL,
    exit_code INT NOT NULL,
    log_content TEXT NOT NULL,
    endpoint_user_id UUID REFERENCES users(id),
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execution_logs_bucket ON execution_logs(bucket_name);
CREATE INDEX idx_execution_logs_created ON execution_logs(created_at);
CREATE INDEX idx_execution_logs_exit_code ON execution_logs(exit_code);