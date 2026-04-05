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
  duration INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plans"
  ON plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON plans FOR DELETE USING (auth.uid() = user_id);

-- Table des feedbacks beta
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  type TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  rating INTEGER,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT USING (auth.uid() = user_id);

-- Table des signalements d'erreurs
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  plan_id UUID,
  day_index INTEGER,
  item_index INTEGER,
  item_title TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT USING (auth.uid() = user_id);

-- Activer le provider Google dans Authentication → Providers → Google
-- Activer le provider Email dans Authentication → Providers → Email
