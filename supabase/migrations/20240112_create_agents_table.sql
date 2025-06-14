-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  bio TEXT,
  masumi_id TEXT,
  api_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'failed')),
  doc_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX idx_agents_user_id ON public.agents(user_id);

-- Create index on status for filtering
CREATE INDEX idx_agents_status ON public.agents(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own agents
CREATE POLICY "Users can view own agents" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to create their own agents
CREATE POLICY "Users can create own agents" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own agents
CREATE POLICY "Users can update own agents" ON public.agents
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own agents
CREATE POLICY "Users can delete own agents" ON public.agents
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for agent documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-docs', 'agent-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for document uploads
CREATE POLICY "Users can upload agent docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agent-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for viewing documents
CREATE POLICY "Anyone can view agent docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'agent-docs');

-- Create policy for deleting documents
CREATE POLICY "Users can delete own agent docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agent-docs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 