import { supabase } from '@/integrations/supabase/client';
import { registerAgent, waitForRegistration } from './masumi';

export interface Agent {
  id: string;
  name: string;
  description: string;
  bio?: string;
  masumi_id?: string;
  api_url?: string;
  status: 'pending' | 'registered' | 'failed';
  created_at: string;
  user_id: string;
  doc_urls?: string[];
}

export interface CreateAgentParams {
  name: string;
  description: string;
  bio?: string;
  documents?: File[];
}

/**
 * Upload documents to Supabase Storage
 */
async function uploadDocuments(files: File[], userId: string): Promise<string[]> {
  const urls: string[] = [];
  
  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('agent-docs')
      .upload(fileName, file);
    
    if (error) {
      console.error('Failed to upload file:', error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('agent-docs')
      .getPublicUrl(fileName);
    
    urls.push(publicUrl);
  }
  
  return urls;
}

/**
 * Create a new AI agent
 */
export async function createAgent({
  name,
  description,
  bio,
  documents = []
}: CreateAgentParams): Promise<Agent> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  try {
    // 1. Upload documents if provided
    let docUrls: string[] = [];
    if (documents.length > 0) {
      docUrls = await uploadDocuments(documents, user.id);
    }
    
    // 2. Create agent record in Supabase (with type workaround)
    const { data: agent, error: insertError } = await (supabase as any)
      .from('agents')
      .insert({
        name,
        description,
        bio,
        user_id: user.id,
        status: 'pending',
        doc_urls: docUrls
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    if (!agent) throw new Error('Failed to create agent');
    
    // 3. Deploy crew service (placeholder - in production this would deploy actual service)
    const apiUrl = `https://api.example.com/agents/${agent.id}`;
    
    // 4. Register with Masumi
    try {
      const masumiId = await registerAgent({
        name,
        description: bio || description,
        apiUrl
      });
      
      // 5. Wait for registration to complete
      const registered = await waitForRegistration(masumiId);
      
      // 6. Update agent with Masumi ID and status
      const { data: updatedAgent, error: updateError } = await (supabase as any)
        .from('agents')
        .update({
          masumi_id: masumiId,
          api_url: apiUrl,
          status: registered ? 'registered' : 'failed'
        })
        .eq('id', agent.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedAgent as Agent;
    } catch (masumiError) {
      // Update agent status to failed if Masumi registration fails
      await (supabase as any)
        .from('agents')
        .update({ status: 'failed' })
        .eq('id', agent.id);
      
      throw masumiError;
    }
  } catch (error: any) {
    console.error('Failed to create agent:', error);
    throw new Error(`Agent creation failed: ${error.message}`);
  }
}

/**
 * Get all agents for the current user
 */
export async function getUserAgents(): Promise<Agent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data, error } = await (supabase as any)
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []) as Agent[];
}

/**
 * Get a single agent by ID
 */
export async function getAgent(id: string): Promise<Agent | null> {
  const { data, error } = await (supabase as any)
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data as Agent;
}

/**
 * Delete an agent
 */
export async function deleteAgent(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('agents')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
} 