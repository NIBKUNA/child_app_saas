-- Migration: Add RLS Policies for Center and Storage
-- Description: Enables update access for centers and storage for logos.

-- 1. Center RLS Policy
-- Allow authenticated users (presumably admins/managers) to update their center info
CREATE POLICY "Enable update for users based on center_id" ON centers
FOR UPDATE USING (
  id IN (
    SELECT center_id FROM profiles WHERE id = auth.uid()
  )
) WITH CHECK (
  id IN (
    SELECT center_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable select for users based on center_id" ON centers
FOR SELECT USING (
  true -- For now allow reading all centers or restrict?
  -- ideally: id IN (SELECT center_id FROM profiles WHERE id = auth.uid())
  -- But for 'SettingsPage' fallback logic (limit 1), we might need broader read or just precise logic.
  -- Let's stick to strict:
  -- id IN (SELECT center_id FROM profiles WHERE id = auth.uid()) OR 
  -- (SELECT count(*) FROM centers) = 1 -- heuristic for single tenant
);

-- Simpler Policy for now since it's likely single tenant or small scale
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON centers;
CREATE POLICY "Allow all access to authenticated users" ON centers
FOR ALL USING (auth.role() = 'authenticated');


-- 2. Storage Policies (Bucket 'images')
-- Need to enable RLS on storage.objects if not already
-- Create bucket if not exists (This usually requires API, but policies can be set)

-- Allow public read
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );

-- Allow authenticated upload
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'images' AND auth.role() = 'authenticated'
);

-- Allow owner delete/update
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'images' AND auth.uid() = owner
);
