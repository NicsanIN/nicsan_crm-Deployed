-- User Management Tables Setup
-- Run this in pgAdmin on staging database

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ops' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    phone VARCHAR(20),
    department VARCHAR(100)
);

-- 2. Create telecallers table
CREATE TABLE IF NOT EXISTS public.telecallers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255),
    phone VARCHAR(20),
    branch VARCHAR(255)
);

-- 3. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create password_change_logs table (after users exists)
CREATE TABLE IF NOT EXISTS public.password_change_logs (
    id SERIAL PRIMARY KEY,
    changed_by INTEGER REFERENCES public.users(id),
    target_user INTEGER REFERENCES public.users(id),
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_change_logs_changed_by ON public.password_change_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_password_change_logs_target_user ON public.password_change_logs(target_user);

-- 6. Insert default admin user (optional)
INSERT INTO public.users (email, password_hash, name, role, is_active) 
VALUES ('admin@nicsanin.com', '$2b$10$example_hash_here', 'Admin User', 'founder', true)
ON CONFLICT (email) DO NOTHING;
