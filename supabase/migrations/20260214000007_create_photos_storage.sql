-- Create storage bucket for photos
-- Run in Supabase SQL Editor

-- Create the photos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  104857600, -- 100MB per file (RAW files can be large)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-fuji-raf', 'image/x-olympus-orf', 'image/x-panasonic-rw2', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the photos bucket
-- Photographers can upload to their own folder: photos/{photographer_id}/...
CREATE POLICY "photographers_upload_own_photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE auth_user_id = auth.uid()
  )
);

-- Photographers can view their own photos
CREATE POLICY "photographers_view_own_photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE auth_user_id = auth.uid()
  )
);

-- Photographers can delete their own photos
CREATE POLICY "photographers_delete_own_photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE auth_user_id = auth.uid()
  )
);

-- Photographers can update their own photos (for moving/renaming)
CREATE POLICY "photographers_update_own_photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM photographers WHERE auth_user_id = auth.uid()
  )
);
