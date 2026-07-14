INSERT INTO roles (name, description) VALUES
    ('endpoint', 'API endpoint access for sending execution logs')
ON CONFLICT (name) DO NOTHING;