-- Add contract_template column to photographers table
-- Each photographer has ONE contract template (simple, no template library)
-- Also add signing_token to contracts for public signing links

-- Store the photographer's contract template directly on their profile
ALTER TABLE photographers ADD COLUMN IF NOT EXISTS contract_template TEXT;

-- Add signing token and expiry to contracts for public signing URLs
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signing_token UUID DEFAULT uuid_generate_v4();
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Unique index on signing token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_signing_token ON contracts(signing_token);

-- RLS: Allow public (anon) to read contracts by signing_token for the signing page
-- This is needed because the client won't be authenticated
CREATE POLICY "contracts_public_read_by_token" ON contracts
  FOR SELECT
  TO anon
  USING (signing_token IS NOT NULL);

-- Allow anon to update signature_data and status (for signing)
CREATE POLICY "contracts_public_sign" ON contracts
  FOR UPDATE
  TO anon
  USING (signing_token IS NOT NULL AND status != 'signed')
  WITH CHECK (signing_token IS NOT NULL);
