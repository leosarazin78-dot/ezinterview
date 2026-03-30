-- Exécuter ce SQL dans Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Table des plans de préparation
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT,
  job_data JSONB,
  company_info JSONB,
  profile JSONB,
  matches JSONB,
  interview_steps JSONB,
  interview_date DATE,
  next_interlocutor TEXT,
  plan_data JSONB NOT NULL,
  completed_days JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour chercher les plans d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);

-- Row Level Security : chaque utilisateur ne voit que ses plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
  ON plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON plans FOR DELETE
  USING (auth.uid() = user_id);

-- Activer le provider Google dans Authentication → Providers → Google
-- Activer le provider Email dans Authentication → Providers → Email