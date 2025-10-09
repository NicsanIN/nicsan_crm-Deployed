-- Comprehensive database permissions fix for Nicsan CRM
-- Run this script as a database superuser (like postgres user)

-- Grant permissions on all sequences
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN 
        SELECT sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE ' || seq_name || ' TO PUBLIC';
        RAISE NOTICE 'Granted permissions on sequence: %', seq_name;
    END LOOP;
END $$;

-- Grant permissions on all tables
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE ' || table_name || ' TO PUBLIC';
        RAISE NOTICE 'Granted permissions on table: %', table_name;
    END LOOP;
END $$;

-- Grant permissions on all functions
DO $$
DECLARE
    func_name TEXT;
BEGIN
    FOR func_name IN 
        SELECT proname 
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || func_name || ' TO PUBLIC';
        RAISE NOTICE 'Granted permissions on function: %', func_name;
    END LOOP;
END $$;

-- Verify permissions
SELECT 
    'Sequences' as object_type,
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Tables' as object_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public';

