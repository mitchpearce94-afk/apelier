-- Track images edited per billing period
-- This counter persists even when photos are deleted/rejected
ALTER TABLE photographers
  ADD COLUMN IF NOT EXISTS images_edited_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMPTZ DEFAULT date_trunc('month', NOW()),
  ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month');

-- Create a function to increment the counter (called by the AI engine after processing)
CREATE OR REPLACE FUNCTION increment_images_edited(photographer_uuid UUID, count INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  -- Reset counter if we're past the billing period end
  UPDATE photographers
  SET
    images_edited_count = CASE
      WHEN billing_period_end <= NOW() THEN count
      ELSE images_edited_count + count
    END,
    billing_period_start = CASE
      WHEN billing_period_end <= NOW() THEN date_trunc('month', NOW())
      ELSE billing_period_start
    END,
    billing_period_end = CASE
      WHEN billing_period_end <= NOW() THEN date_trunc('month', NOW()) + INTERVAL '1 month'
      ELSE billing_period_end
    END
  WHERE id = photographer_uuid;
END;
$$ LANGUAGE plpgsql;
