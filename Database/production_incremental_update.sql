-- Production Incremental Update Script
-- Run this ONLY after comparing schemas and creating a full backup

-- 1. Add missing password_change_logs table
CREATE TABLE IF NOT EXISTS public.password_change_logs (
    id SERIAL PRIMARY KEY,
    changed_by INTEGER,
    target_user INTEGER,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints (add only if users table has proper structure)
    CONSTRAINT fk_password_change_logs_changed_by 
        FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_password_change_logs_target_user 
        FOREIGN KEY (target_user) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_change_logs_changed_by 
    ON public.password_change_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_password_change_logs_target_user 
    ON public.password_change_logs(target_user);

-- 3. Add missing columns to users table (if needed)
-- Uncomment these only if the schema comparison shows they're missing:

-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions TEXT[];
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 4. Add missing columns to telecallers table (if needed)
-- Uncomment these only if the schema comparison shows they're missing:

-- ALTER TABLE public.telecallers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- ALTER TABLE public.telecallers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
-- ALTER TABLE public.telecallers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
-- ALTER TABLE public.telecallers ADD COLUMN IF NOT EXISTS branch VARCHAR(255);

-- 5. Add constraints (if missing)
-- Uncomment these only if the schema comparison shows they're missing:

-- ALTER TABLE public.users ADD CONSTRAINT IF NOT EXISTS users_email_unique UNIQUE (email);
-- ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'ops';
