// Chat service for Support Portal - uses same AI endpoint as agent configuration
import { getSessionId } from './ai-service';

// HARDCODED FOR HACKATHON
const AGENT_API_URL = 'https://api.fluxpointstudios.com/chat';
const AGENT_API_KEY = '16dc5e5e6671ae253eded051fab30876ca44d23c8089af7a07679528ed21eee2';

export interface ChatResponse {
  reply: string;
  timestamp: Date;
  sentiment?: number; // 0-1 score from AI if available
}

/**
 * Send a message to the AI chat service and get a response
 */
export async function sendChatMessage(
  message: string,
  context?: {
    serviceLevel?: 'basic' | 'premium' | 'enterprise';
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<ChatResponse> {
  if (!AGENT_API_KEY) {
    throw new Error('AGENT_API_KEY environment variable not set');
  }

  const sessionId = await getSessionId();
  
  // Build context-aware prompt
  let fullMessage = message;
  
  // Add service level context
  if (context?.serviceLevel) {
    const levelContext = {
      basic: 'Provide helpful but concise support.',
      premium: 'Provide detailed, personalized support with extra care.',
      enterprise: 'Provide white-glove support with maximum attention to detail and proactive suggestions.'
    };
    
    fullMessage = `[Service Level: ${context.serviceLevel.toUpperCase()} - ${levelContext[context.serviceLevel]}]\n\n${message}`;
  }
  
  // Add conversation history if available
  if (context?.previousMessages && context.previousMessages.length > 0) {
    const history = context.previousMessages
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
    
    fullMessage = `Previous conversation:\n${history}\n\nUser: ${message}`;
  }

  try {
    const response = await fetch(AGENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AGENT_API_KEY,
      },
      body: JSON.stringify({
        message: fullMessage,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Chat API Error:', error);
      throw new Error(`Chat API error: ${error.message || error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract response content
    const content = data.reply || data.response || data.message || data.content;
    
    if (!content) {
      console.error('Unexpected chat response format:', data);
      throw new Error('No response from AI');
    }

    // Extract sentiment if provided by AI
    let sentiment: number | undefined;
    if (data.sentiment !== undefined) {
      sentiment = typeof data.sentiment === 'number' ? data.sentiment : undefined;
    }

    return {
      reply: typeof content === 'string' ? content : JSON.stringify(content),
      timestamp: new Date(),
      sentiment
    };
  } catch (error: any) {
    console.error('Chat service error:', error);
    
    // Fallback to a helpful error message
    return {
      reply: "I apologize, but I'm having trouble connecting to the support service right now. Please try again in a moment, or submit a support ticket if the issue persists.",
      timestamp: new Date(),
      sentiment: 0.3 // Low sentiment for error state
    };
  }
}

/**
 * Analyze the sentiment of a message (can be used for user messages)
 */
export function analyzeMessageSentiment(message: string): number {
  const lowercaseMessage = message.toLowerCase();
  
  // Positive indicators
  const positiveWords = ['thank', 'great', 'excellent', 'perfect', 'awesome', 'helpful', 'amazing', 'good', 'love', 'appreciate'];
  const negativeWords = ['problem', 'issue', 'error', 'broken', 'fail', 'bad', 'terrible', 'awful', 'hate', 'frustrated', 'angry'];
  
  let score = 0.5; // Start neutral
  
  // Check for positive words
  positiveWords.forEach(word => {
    if (lowercaseMessage.includes(word)) score += 0.1;
  });
  
  // Check for negative words
  negativeWords.forEach(word => {
    if (lowercaseMessage.includes(word)) score -= 0.1;
  });
  
  // Check for punctuation indicators
  if (message.includes('!') && score > 0.5) score += 0.05; // Excitement
  if (message.includes('!!!')) score -= 0.1; // Frustration
  if (message.includes('?!')) score -= 0.05; // Confusion/frustration
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
} 