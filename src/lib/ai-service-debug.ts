// Debug utilities for AI Service integration
import { getSessionId } from './ai-service';

// HARDCODED FOR HACKATHON
const AGENT_API_URL = 'https://api.fluxpointstudios.com/chat';
const AGENT_API_KEY = '6c3bb3eedc9441978bbc44af20f0b82d';

/**
 * Test the API connection and log detailed information
 */
export async function testAPIConnection(): Promise<void> {
  console.log('=== AI Service Debug Info ===');
  console.log('API URL:', AGENT_API_URL);
  console.log('API Key:', AGENT_API_KEY ? `${AGENT_API_KEY.substring(0, 10)}...` : 'NOT SET');
  
  try {
    const sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // Test with a simple request
    const testRequest = {
      message: 'Test message: Respond with "API connection successful!"',
      session_id: sessionId,
    };
    
    console.log('Test Request Body:', JSON.stringify(testRequest, null, 2));
    
    const response = await fetch(AGENT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AGENT_API_KEY,
      },
      body: JSON.stringify(testRequest),
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response Body (raw):', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('Response Body (parsed):', responseData);
    } catch (e) {
      console.log('Response is not valid JSON');
    }
    
  } catch (error: any) {
    console.error('Debug test failed:', error);
  }
  
  console.log('=== End Debug Info ===');
}

// Export for use in ai-service.ts
export { getSessionId } from './ai-service'; 