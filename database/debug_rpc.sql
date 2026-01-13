
select pg_get_functiondef(oid) 
from pg_proc 
where proname = 'delete_user_completely';
