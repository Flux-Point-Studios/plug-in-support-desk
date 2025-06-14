// Masumi Agent Discovery and Usage Service
// This service discovers existing agents on Masumi Preprod and facilitates their usage

const MASUMI_REGISTRY_URL = 'https://registry.masumi.network';
const MASUMI_PAYMENT_URL = 'https://api.masumi.network';
const PUBLIC_REGISTRY_TOKEN = 'public-test-key-masumi-registry-c23f3d21';

// Types based on Masumi API responses
export interface MasumiAgent {
  id: string;
  name: string;
  description: string;
  status: 'Online' | 'Offline';
  agentIdentifier: string;
  apiBaseUrl: string;
  Capability: {
    name: string;
    version: string;
  };
  AgentPricing: {
    pricingType: string;
    FixedPricing?: {
      Amounts: Array<{
        amount: string;
        unit: string;
      }>;
    };
  };
  PaymentIdentifier: Array<{
    paymentIdentifier: string;
    paymentType: string;
    sellerVKey: string;
  }>;
  Tags?: string[];
  authorName?: string;
  Legal?: {
    privacyPolicy?: string;
    terms?: string;
  };
}

export interface AgentInputSchema {
  input_data: Array<{
    id: string;
    type: string;
    name: string;
    data?: {
      description?: string;
      placeholder?: string;
    };
  }>;
}

export interface StartJobResponse {
  job_id: string;
  payment_id: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface PurchaseRequest {
  network: string;
  blockchainIdentifier: string;
  agentIdentifier: string;
  sellerVkey: string;
  paymentType: string;
  Amounts?: Array<{
    unit: string;
    amount: string;
  }>;
  identifierFromPurchaser: string;
  submitResultTime: string;
  unlockTime: string;
  externalDisputeUnlockTime: string;
  inputHash: string;
}

/**
 * Discover active agents on Masumi Preprod network
 */
export async function discoverAgents(limit = 50): Promise<MasumiAgent[]> {
  try {
    const response = await fetch(`${MASUMI_REGISTRY_URL}/api/v1/registry-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': PUBLIC_REGISTRY_TOKEN
      },
      body: JSON.stringify({
        network: 'Preprod',
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.entries || [];
  } catch (error: any) {
    console.error('Failed to discover agents:', error);
    throw new Error(`Agent discovery failed: ${error.message}`);
  }
}

/**
 * Find agents suitable for support/documentation tasks
 */
export async function findSupportAgents(): Promise<MasumiAgent[]> {
  const agents = await discoverAgents();
  
  // Filter for agents that seem suitable for support tasks
  return agents.filter(agent => {
    const supportKeywords = ['support', 'help', 'doc', 'faq', 'assist', 'customer', 'qa', 'question'];
    const agentText = `${agent.name} ${agent.description} ${agent.Capability?.name || ''} ${agent.Tags?.join(' ') || ''}`.toLowerCase();
    
    return agent.status === 'Online' && 
           supportKeywords.some(keyword => agentText.includes(keyword));
  });
}

/**
 * Get detailed information about a specific agent
 */
export async function getAgentDetails(agentIdentifier: string): Promise<MasumiAgent | null> {
  try {
    const response = await fetch(
      `${MASUMI_REGISTRY_URL}/api/v1/payment-information?agentIdentifier=${agentIdentifier}`,
      {
        headers: {
          'token': PUBLIC_REGISTRY_TOKEN
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get agent details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Failed to get agent details:', error);
    throw new Error(`Agent details retrieval failed: ${error.message}`);
  }
}

/**
 * Check if agent service is available
 */
export async function checkAgentAvailability(apiBaseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${apiBaseUrl}/availability`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Agent availability check failed:', error);
    return false;
  }
}

/**
 * Get agent's input schema
 */
export async function getAgentInputSchema(apiBaseUrl: string): Promise<AgentInputSchema> {
  try {
    const response = await fetch(`${apiBaseUrl}/input_schema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get input schema: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to get agent input schema:', error);
    // Return default schema for text-based queries
    return {
      input_data: [
        { 
          id: 'text', 
          type: 'string',
          name: 'Text Input',
          data: {
            description: 'Enter your query or question',
            placeholder: 'Type your message here...'
          }
        }
      ]
    };
  }
}

/**
 * Start a job with an agent
 */
export async function startAgentJob(
  apiBaseUrl: string, 
  inputData: Record<string, string>
): Promise<StartJobResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/start_job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_data: inputData,
        identifier_from_purchaser: `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to start job: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to start agent job:', error);
    throw new Error(`Job initiation failed: ${error.message}`);
  }
}

/**
 * Create a simple hash of input data for payment verification
 */
function hashInputData(inputData: Record<string, string>): string {
  const dataString = JSON.stringify(inputData);
  // Simple hash implementation (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate a unique identifier for purchases
 */
function generatePurchaseId(): string {
  return `purchase_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Complete payment for agent job (requires API key - placeholder for now)
 */
export async function completePayment(
  agent: MasumiAgent,
  paymentId: string,
  inputData: Record<string, string>,
  apiKey?: string
): Promise<boolean> {
  if (!apiKey) {
    console.warn('No payment API key provided - payment simulation only');
    // In a real implementation, you'd need a funded payment source
    // For now, we'll simulate payment completion
    return true;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const paymentRequest: PurchaseRequest = {
      network: 'Preprod',
      blockchainIdentifier: paymentId,
      agentIdentifier: agent.agentIdentifier,
      sellerVkey: agent.PaymentIdentifier[0]?.sellerVKey || '',
      paymentType: 'Web3CardanoV1',
      Amounts: agent.AgentPricing.FixedPricing?.Amounts || [{ unit: 'lovelace', amount: '1000000' }],
      identifierFromPurchaser: generatePurchaseId(),
      submitResultTime: (now + 900).toString(), // 15 minutes
      unlockTime: (now + 1800).toString(), // 30 minutes
      externalDisputeUnlockTime: (now + 3600).toString(), // 1 hour
      inputHash: hashInputData(inputData)
    };

    const response = await fetch(`${MASUMI_PAYMENT_URL}/api/v1/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': apiKey
      },
      body: JSON.stringify(paymentRequest)
    });

    if (!response.ok) {
      throw new Error(`Payment failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error: any) {
    console.error('Payment completion failed:', error);
    throw new Error(`Payment failed: ${error.message}`);
  }
}

/**
 * Poll for job completion and get result
 */
export async function pollJobResult(
  apiBaseUrl: string,
  jobId: string,
  maxAttempts = 30,
  delayMs = 2000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${apiBaseUrl}/status?job_id=${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }

      const status: JobStatusResponse = await response.json();

      if (status.status === 'completed') {
        return status.result || 'Job completed successfully';
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Job failed');
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error: any) {
      console.error(`Job polling attempt ${attempt + 1} failed:`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw new Error(`Job polling failed after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }

  throw new Error('Job did not complete within the expected time');
}

/**
 * Complete workflow: query an existing Masumi agent
 */
export async function queryMasumiAgent(
  agent: MasumiAgent,
  query: string,
  apiKey?: string
): Promise<string> {
  try {
    // 1. Check agent availability
    const isAvailable = await checkAgentAvailability(agent.apiBaseUrl);
    if (!isAvailable) {
      throw new Error('Agent is currently unavailable');
    }

    // 2. Get input schema
    const schema = await getAgentInputSchema(agent.apiBaseUrl);
    
    // 3. Prepare input data based on schema
    const inputData: Record<string, string> = {};
    schema.input_data.forEach(field => {
      // Map common field names to the query
      if (field.id === 'text' || field.id === 'website_description' || field.id === 'query' || field.id === 'message') {
        inputData[field.id] = query;
      } else {
        inputData[field.id] = query; // Default to query for all fields
      }
    });

    // 4. Start job
    const jobResponse = await startAgentJob(agent.apiBaseUrl, inputData);

    // 5. Complete payment (simulated if no API key)
    await completePayment(agent, jobResponse.payment_id, inputData, apiKey);

    // 6. Poll for result
    const result = await pollJobResult(agent.apiBaseUrl, jobResponse.job_id);

    return result;
  } catch (error: any) {
    console.error('Failed to query Masumi agent:', error);
    throw new Error(`Agent query failed: ${error.message}`);
  }
}

/**
 * Get the best available support agent
 */
export async function getBestSupportAgent(): Promise<MasumiAgent | null> {
  try {
    const supportAgents = await findSupportAgents();
    
    if (supportAgents.length === 0) {
      return null;
    }

    // Sort by preference (online status, then by capability relevance)
    const sortedAgents = supportAgents.sort((a, b) => {
      // Prefer online agents
      if (a.status === 'Online' && b.status !== 'Online') return -1;
      if (b.status === 'Online' && a.status !== 'Online') return 1;
      
      // Prefer agents with support-related capabilities
      const aSupport = a.Capability?.name?.toLowerCase().includes('support') || 
                      a.Capability?.name?.toLowerCase().includes('help') || 
                      a.Capability?.name?.toLowerCase().includes('assist');
      const bSupport = b.Capability?.name?.toLowerCase().includes('support') || 
                      b.Capability?.name?.toLowerCase().includes('help') || 
                      b.Capability?.name?.toLowerCase().includes('assist');
      
      if (aSupport && !bSupport) return -1;
      if (bSupport && !aSupport) return 1;
      
      return 0;
    });

    return sortedAgents[0];
  } catch (error: any) {
    console.error('Failed to get best support agent:', error);
    return null;
  }
} 