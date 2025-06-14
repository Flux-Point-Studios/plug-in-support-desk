-- Create agents table for storing AI agent configurations
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  masumi_identifier TEXT UNIQUE,
  api_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_masumi_identifier ON public.agents(masumi_identifier);
CREATE INDEX idx_agents_status ON public.agents(status);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own agents" ON public.agents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agents" ON public.agents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents" ON public.agents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents" ON public.agents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 