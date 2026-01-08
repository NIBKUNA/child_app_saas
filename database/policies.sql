-- Enable RLS on leads table (if not already handled)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert new leads (public inquiry form)
CREATE POLICY "Allow public insert" ON leads 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anonymous users to view ONLY their own inserted leads? 
-- Usually we don't allow anon select unless we track session ID, so just insert is fine.
-- Admin can view all.

-- Grant usage on sequence if needed (usually handled by uuid_generate_v4 but just in case)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE leads TO anon;
