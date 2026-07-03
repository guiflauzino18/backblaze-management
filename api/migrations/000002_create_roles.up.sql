CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
    ('admin', 'Full access to the system'),
    ('user', 'Read-only access to the system')
ON CONFLICT (name) DO NOTHING;