-- Add extra profile fields to photographers table
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS abn TEXT;
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email_new_lead": true,
  "email_booking_confirmed": true,
  "email_payment_received": true,
  "email_gallery_viewed": true,
  "email_contract_signed": true,
  "auto_followup_days": 3,
  "auto_reminder_unpaid": true
}';
