-- Add neural LUT training fields to style_profiles
-- These support the GPU-based 3D LUT style transfer pipeline

ALTER TABLE style_profiles
  ADD COLUMN IF NOT EXISTS model_key TEXT,
  ADD COLUMN IF NOT EXISTS model_filename TEXT,
  ADD COLUMN IF NOT EXISTS training_method TEXT DEFAULT 'reference',
  ADD COLUMN IF NOT EXISTS training_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS training_error TEXT,
  ADD COLUMN IF NOT EXISTS training_time_s FLOAT,
  ADD COLUMN IF NOT EXISTS pairs_used INTEGER;

-- Backfill: sync training_status from existing status column
UPDATE style_profiles SET training_status = status WHERE training_status IS NULL OR training_status = 'pending';

-- Backfill: sync model_key from existing model_weights_key
UPDATE style_profiles SET model_key = model_weights_key WHERE model_key IS NULL AND model_weights_key IS NOT NULL;
