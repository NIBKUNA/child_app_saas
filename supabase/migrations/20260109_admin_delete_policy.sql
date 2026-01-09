-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can delete" ON blog_posts;

-- Create the specific policy requested
CREATE POLICY "Admins can delete" 
ON blog_posts 
FOR DELETE 
USING (auth.role() = 'authenticated');
