-- Add signature_image column to photographers table
-- Stores the photographer's signature as base64 data URL
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS signature_image TEXT;
