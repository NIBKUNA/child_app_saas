-- Check leads count
SELECT count(*) FROM leads;

-- Check partial data if any
SELECT * FROM leads LIMIT 5;

-- Check RLS policies on leads
select *
from pg_policies
where tablename = 'leads';
