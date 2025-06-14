-- Create storage bucket for agent documentation
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'agent-docs',
  'agent-docs',
  true, -- Public bucket for simplicity, can be made private with RLS
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload their own agent docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agent-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own agent docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'agent-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own agent docs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agent-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view agent docs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'agent-docs'); 