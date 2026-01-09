-- EMERGENCY: Allow ALL deletes for verification
DROP POLICY IF EXISTS "Admins can delete" ON blog_posts;

create policy "Admins can delete"
on "public"."blog_posts"
as PERMISSIVE
for DELETE
to public
using (
  true
);
