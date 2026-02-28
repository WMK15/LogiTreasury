-- ============================================================
-- LogiTreasury: Supabase Schema Migration
-- ArcLogistics Treasury for Encode x Arc Hackathon
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ TABLES ============

-- Companies: Logistics companies using the platform
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bank_balance_usd NUMERIC(18, 2) NOT NULL DEFAULT 0,
  onchain_address TEXT NOT NULL,
  total_yield_earned NUMERIC(18, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions: All treasury operations
CREATE TYPE transaction_type AS ENUM ('FX_SWAP', 'TREASURY_SWEEP', 'SETTLEMENT');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  amount NUMERIC(18, 6) NOT NULL,
  fiat_value_usd NUMERIC(18, 2) NOT NULL,
  tx_hash TEXT,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Trail: Tax and compliance records for each transaction
CREATE TYPE compliance_status AS ENUM ('COMPLIANT', 'REVIEW_REQUIRED', 'FLAGGED', 'EXEMPT');

CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  tax_basis_usd NUMERIC(18, 6) NOT NULL DEFAULT 0,
  tax_rate_applied NUMERIC(8, 4) NOT NULL DEFAULT 0,
  total_tax_withheld NUMERIC(18, 6) NOT NULL DEFAULT 0,
  ai_reasoning_summary TEXT,
  compliance_status compliance_status NOT NULL DEFAULT 'COMPLIANT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset Balances: Current holdings per company
CREATE TYPE asset_type AS ENUM ('USDC', 'EURC', 'USYC');

CREATE TABLE asset_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asset_type asset_type NOT NULL,
  amount NUMERIC(18, 6) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, asset_type)
);

-- ============ INDEXES ============

CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_audit_trail_tx ON audit_trail(tx_id);
CREATE INDEX idx_audit_trail_compliance ON audit_trail(compliance_status);
CREATE INDEX idx_asset_balances_company ON asset_balances(company_id);

-- ============ ROW LEVEL SECURITY ============

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_balances ENABLE ROW LEVEL SECURITY;

-- Allow public read for hackathon demo (restrict in production)
CREATE POLICY "Allow public read on companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public insert on companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on companies" ON companies FOR UPDATE USING (true);

CREATE POLICY "Allow public read on transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on transactions" ON transactions FOR UPDATE USING (true);

CREATE POLICY "Allow public read on audit_trail" ON audit_trail FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_trail" ON audit_trail FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on asset_balances" ON asset_balances FOR SELECT USING (true);
CREATE POLICY "Allow public insert on asset_balances" ON asset_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on asset_balances" ON asset_balances FOR UPDATE USING (true);

-- ============ UPDATED_AT TRIGGER ============

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
