-- Gallery delivery features + public gallery access
-- Run in Supabase SQL Editor

-- 1. Add gallery default settings to photographers table
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS gallery_default_expiry_days integer DEFAULT 30;
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS gallery_default_access_type text DEFAULT 'password';
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS gallery_default_download_full_res boolean DEFAULT true;
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS gallery_default_download_web boolean DEFAULT true;
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS gallery_default_watermark boolean DEFAULT true;

-- 2. Add password_hash to galleries for password-protected access
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS password_hash text;

-- 3. Add delivered_at timestamp to galleries
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 4. Ensure slug column exists and has a unique index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'galleries_slug_unique') THEN
    CREATE UNIQUE INDEX galleries_slug_unique ON galleries(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- 5. Create RPC function to increment gallery view count
CREATE OR REPLACE FUNCTION increment_gallery_views(gallery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE galleries
  SET view_count = view_count + 1
  WHERE id = gallery_id;
END;
$$;

-- 6. Allow anon access to galleries by slug (for public gallery pages)
-- Drop existing anon policies if they exist
DROP POLICY IF EXISTS "anon_view_galleries_by_slug" ON galleries;
DROP POLICY IF EXISTS "anon_view_gallery_photos" ON photos;
DROP POLICY IF EXISTS "anon_view_photographer_branding" ON photographers;
DROP POLICY IF EXISTS "anon_update_photo_favorites" ON photos;

-- Allow anonymous users to view galleries (for public gallery page)
CREATE POLICY "anon_view_galleries_by_slug" ON galleries
  FOR SELECT
  TO anon
  USING (status IN ('delivered', 'ready') AND slug IS NOT NULL);

-- Allow anonymous users to view photos in delivered galleries
CREATE POLICY "anon_view_gallery_photos" ON photos
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM galleries g
      WHERE g.id = photos.gallery_id
      AND g.status IN ('delivered', 'ready')
    )
  );

-- Allow anonymous users to read photographer branding info (limited fields handled in query)
CREATE POLICY "anon_view_photographer_branding" ON photographers
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to toggle favorites on delivered gallery photos
CREATE POLICY "anon_update_photo_favorites" ON photos
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM galleries g
      WHERE g.id = photos.gallery_id
      AND g.status = 'delivered'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM galleries g
      WHERE g.id = photos.gallery_id
      AND g.status = 'delivered'
    )
  );

-- 7. Grant execute on the increment function to anon
GRANT EXECUTE ON FUNCTION increment_gallery_views(uuid) TO anon;

-- 8. Auto-generate slug on gallery insert if not provided
CREATE OR REPLACE FUNCTION generate_gallery_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM galleries WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gallery_auto_slug ON galleries;
CREATE TRIGGER gallery_auto_slug
  BEFORE INSERT OR UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION generate_gallery_slug();
