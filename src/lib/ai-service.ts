// AI Service for generating agent configurations
import { supabase } from '@/integrations/supabase/client';

const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'https://api.fluxpointstudios.com/chat';
const AGENT_API_KEY = import.meta.env.VITE_AGENT_API_KEY;

export interface AgentSuggestions {
  name: string;
  bio: string;
  description: string;
}

export interface GenerateAgentConfigParams {
  businessPrompt: string;
}

/**
 * Get session ID from either email or wallet address
 */
export async function getSessionId(): Promise<string> {
  // First try to get from Supabase auth (email)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    return user.email;
  }
  
  // Fallback to wallet address from localStorage
  const walletAddress = localStorage.getItem('walletAddress');
  if (walletAddress) {
    // Handle simplified wallet addresses (e.g., "eternl_00cf4bd...7fb3b14a")
    // Extract just the wallet name part if it's in that format
    if (walletAddress.includes('_')) {
      const parts = walletAddress.split('_');
      // Use the full simplified address as session ID
      return walletAddress;
    }
    return walletAddress;
  }
  
  throw new Error('No session ID available. Please login with email or connect wallet.');
}

/**
 * Generate agent configuration suggestions based on business description
 */
export async function generateAgentConfig({ 
  businessPrompt 
}: GenerateAgentConfigParams): Promise<AgentSuggestions> {
  if (!AGENT_API_KEY) {
    throw new Error('AGENT_API_KEY environment variable not set');
  }

  const sessionId = await getSessionId();
  console.log('Using session ID for AI request:', sessionId);
  
  const systemPrompt = `You are an AI assistant helping to create customer support agents. Based on the user's business description, generate:
1. A concise, professional agent name (max 3 words)
2. A brief bio describing the agent's expertise (1 sentence, max 100 chars)
3. A detailed description of the agent's capabilities, personality, and communication style (2-3 paragraphs)

Format your response as JSON with keys: name, bio, description`;

  const userPrompt = `Create a customer support agent for this business: ${businessPrompt}`;

  try {
    // Using Flux Point Studios API format - based on their documentation
    const response = await fetch(AGENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AGENT_API_KEY, // Flux Point uses api-key header
      },
      body: JSON.stringify({
        message: `${systemPrompt}\n\n${userPrompt}`, // Combine system prompt with user prompt
        session_id: sessionId, // Use session_id (underscore) not sessionId
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error Response:', error);
      throw new Error(`AI API error: ${error.message || error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Handle Flux Point Studios response format
    const content = data.reply || data.response || data.message || data.content;

    if (!content) {
      console.error('Unexpected API response format:', data);
      throw new Error('No response from AI');
    }

    // Parse JSON response
    try {
      const suggestions = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Validate and sanitize
      return {
        name: (suggestions.name || 'Support Agent').slice(0, 50),
        bio: (suggestions.bio || 'Your helpful AI assistant').slice(0, 100),
        description: (suggestions.description || 'A professional support agent ready to help.').slice(0, 1000),
      };
    } catch (parseError) {
      // If JSON parsing fails, extract content manually
      console.warn('Failed to parse AI response as JSON, using fallback parsing');
      
      // Simple extraction logic as fallback
      const textContent = typeof content === 'string' ? content : JSON.stringify(content);
      const lines = textContent.split('\n').filter(line => line.trim());
      
      return {
        name: lines[0]?.replace(/^name:?\s*/i, '').slice(0, 50) || 'Support Agent',
        bio: lines[1]?.replace(/^bio:?\s*/i, '').slice(0, 100) || 'Your helpful AI assistant',
        description: lines.slice(2).join('\n').replace(/^description:?\s*/i, '').slice(0, 1000) || 'A professional support agent ready to help.',
      };
    }
  } catch (error: any) {
    console.error('Failed to generate agent config:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Generate a single field suggestion
 */
export async function regenerateField(
  field: keyof AgentSuggestions,
  businessPrompt: string,
  currentValues: Partial<AgentSuggestions>
): Promise<string> {
  if (!AGENT_API_KEY) {
    throw new Error('AGENT_API_KEY environment variable not set');
  }

  const sessionId = await getSessionId();

  const fieldPrompts = {
    name: 'Generate a new concise, professional agent name (max 3 words)',
    bio: 'Generate a new brief bio describing the agent\'s expertise (1 sentence, max 100 chars)',
    description: 'Generate a new detailed description of the agent\'s capabilities, personality, and communication style (2-3 paragraphs)',
  };

  const systemPrompt = `You are an AI assistant helping to create customer support agents. ${fieldPrompts[field]}. 
Current values for context:
- Name: ${currentValues.name || 'Not set'}
- Bio: ${currentValues.bio || 'Not set'}
Respond with only the requested ${field}, no additional text or formatting.`;

  const userPrompt = `Business: ${businessPrompt}`;

  try {
    const response = await fetch(AGENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AGENT_API_KEY,
      },
      body: JSON.stringify({
        message: `${systemPrompt}\n\n${userPrompt}`,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error Response:', error);
      throw new Error(`AI API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.reply || data.response || data.message || data.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract text content
    const textContent = typeof content === 'string' ? content.trim() : JSON.stringify(content);

    // Apply length limits
    const limits = { name: 50, bio: 100, description: 1000 };
    return textContent.slice(0, limits[field]);
  } catch (error: any) {
    console.error(`Failed to regenerate ${field}:`, error);
    throw new Error(`Failed to regenerate ${field}: ${error.message}`);
  }
} 