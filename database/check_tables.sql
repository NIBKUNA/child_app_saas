
SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('profiles', 'user_profiles');
SELECT * FROM pg_views WHERE viewname = 'profiles';
