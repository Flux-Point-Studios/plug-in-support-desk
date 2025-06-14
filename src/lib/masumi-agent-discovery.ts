// Masumi Agent Discovery and Usage Service
// This service discovers existing agents on Masumi Preprod and facilitates their usage

import type { LucidEvolution } from '@lucid-evolution/lucid';
import { buildMasumiPaymentTx, checkSufficientBalance, waitForTxConfirmation } from './masumi-transaction-builder';

// Use proxy endpoint to avoid CORS issues
const PROXY_URL = '/api/masumi-proxy';
const AGENT_PROXY_URL = '/api/agent-proxy';

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
  paymentIdentifier?: string; // The payment address from Masumi
  lovelaceAmount?: string; // The amount to pay
  jobIdentifier?: string; // Alternative name for job_id
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
 * Helper function to make requests through the agent proxy
 */
async function proxyAgentRequest(targetUrl: string, method: string = 'GET', data?: any): Promise<any> {
  try {
    const response = await fetch(AGENT_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUrl,
        method,
        data
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown proxy error' }));
      throw new Error(errorData.message || errorData.error || `Proxy request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error: any) {
    console.error('Proxy request failed:', error);
    throw new Error(`Agent communication failed: ${error.message}`);
  }
}

/**
 * Discover active agents on Masumi Preprod network
 */
export async function discoverAgents(limit = 50): Promise<MasumiAgent[]> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: 'registry-entry',
        network: 'Preprod',
        limit
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to fetch agents: ${response.status} ${response.statusText} - ${errorData.error || errorData.message || ''}`);
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
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: `payment-information?agentIdentifier=${agentIdentifier}`
      })
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to get agent details: ${response.status} ${response.statusText} - ${errorData.error || errorData.message || ''}`);
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
    // Clean up the URL to avoid double slashes
    const cleanUrl = `${apiBaseUrl}/availability`.replace(/([^:]\/)\/+/g, "$1");
    
    const result = await proxyAgentRequest(cleanUrl, 'GET');
    return true; // If no error thrown, agent is available
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
    const cleanUrl = `${apiBaseUrl}/input_schema`.replace(/([^:]\/)\/+/g, "$1");
    console.log('Fetching agent input schema from:', cleanUrl);
    const schema = await proxyAgentRequest(cleanUrl, 'GET');
    console.log('Agent input schema:', schema);
    return schema;
  } catch (error: any) {
    console.error('Failed to get agent input schema:', error);
    console.warn('Using default schema with website_description field for Research Agent compatibility');
    // Return schema that works with Research Agent
    return {
      input_data: [
        { 
          id: 'website_description', 
          type: 'string',
          name: 'Website Description',
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
    const cleanUrl = `${apiBaseUrl}/start_job`.replace(/([^:]\/)\/+/g, "$1");
    
    const jobData = {
      input_data: inputData,
      identifier_from_purchaser: `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    };

    console.log('Starting agent job at:', cleanUrl);
    console.log('Job data:', JSON.stringify(jobData, null, 2));

    const response = await proxyAgentRequest(cleanUrl, 'POST', jobData);
    console.log('Job started successfully:', response);
    return response;
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
 * Complete payment for agent job (integrates with connected wallet)
 */
export async function completePayment(
  agent: MasumiAgent,
  paymentId: string,
  inputData: Record<string, string>,
  options?: {
    apiKey?: string;
    useWallet?: boolean;
    onProgress?: (message: string) => void;
    lucid?: LucidEvolution;
    paymentIdentifier?: string; // From start_job response
    lovelaceAmount?: string; // From start_job response
  }
): Promise<{ success: boolean; txHash?: string; receipt?: any }> {
  const { apiKey, useWallet = true, onProgress, lucid, paymentIdentifier, lovelaceAmount } = options || {};

  // Try wallet payment first if requested and lucid is available
  if (useWallet && lucid && paymentIdentifier && lovelaceAmount) {
    try {
      onProgress?.('Checking wallet balance...');
      
      const amount = BigInt(lovelaceAmount);
      
      // Check balance
      const balanceCheck = await checkSufficientBalance(lucid, amount);
      
      if (!balanceCheck.sufficient) {
        const adaRequired = Number(balanceCheck.required) / 1_000_000;
        const adaAvailable = Number(balanceCheck.available) / 1_000_000;
        throw new Error(`Insufficient balance. Need: ${adaRequired} ADA, have: ${adaAvailable} ADA`);
      }

      onProgress?.('Building transaction...');
      
      // Build and submit the transaction
      const txHash = await buildMasumiPaymentTx(lucid, paymentIdentifier, amount, {
        agentId: agent.agentIdentifier,
        paymentId,
        inputHash: hashInputData(inputData),
        timestamp: new Date().toISOString()
      });

      onProgress?.(`Transaction submitted: ${txHash}`);
      
      // Wait for confirmation
      onProgress?.('Waiting for confirmation...');
      const confirmed = await waitForTxConfirmation(lucid, txHash);
      
      if (confirmed) {
        onProgress?.('Transaction confirmed on-chain!');
      }
      
      return {
        success: true,
        txHash,
        receipt: {
          agentId: agent.agentIdentifier,
          paymentIdentifier,
          lovelaceAmount,
          timestamp: new Date().toISOString(),
          network: 'Preprod',
          txHash
        }
      };
      
    } catch (walletError: any) {
      console.error('Wallet payment failed:', walletError);
      onProgress?.(`Wallet payment failed: ${walletError.message}`);
      
      // Fall back to API key method if available
      if (!apiKey) {
        throw walletError;
      }
    }
  }

  // Fallback to simulation if missing required params
  if (useWallet && !lucid) {
    onProgress?.('Note: Real transactions require Lucid Evolution. Using simulation.');
  } else if (useWallet && (!paymentIdentifier || !lovelaceAmount)) {
    onProgress?.('Note: Missing payment identifier or amount from agent. Using simulation.');
  }

  if (useWallet && typeof window !== 'undefined' && window.cardano) {
    const simulatedTxHash = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      success: true,
      txHash: simulatedTxHash,
      receipt: {
        agentId: agent.agentIdentifier,
        amount: agent.AgentPricing.FixedPricing?.Amounts?.[0] || { unit: '', amount: '1000000' },
        timestamp: new Date().toISOString(),
        network: 'Preprod',
        simulated: true
      }
    };
  }

  // API key payment method (original implementation)
  if (!apiKey) {
    console.warn('No payment method available - simulation only');
    return {
      success: true,
      txHash: `sim_nopay_${Date.now()}`,
      receipt: {
        agentId: agent.agentIdentifier,
        simulated: true,
        message: 'Payment bypassed - no wallet or API key'
      }
    };
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

    // Note: This would also need to use a proxy for payment API
    const response = await fetch(`https://api.masumi.network/api/v1/purchase`, {
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

    const result = await response.json();
    return {
      success: true,
      txHash: result.data?.txHash || 'api_payment',
      receipt: result.data
    };
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
      const cleanUrl = `${apiBaseUrl}/status?job_id=${jobId}`.replace(/([^:]\/)\/+/g, "$1");
      const status: JobStatusResponse = await proxyAgentRequest(cleanUrl, 'GET');

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
  options?: {
    apiKey?: string;
    useWallet?: boolean;
    onProgress?: (message: string) => void;
    lucid?: LucidEvolution;
  }
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

    // 5. Complete payment (with wallet support)
    const paymentResult = await completePayment(agent, jobResponse.payment_id, inputData, {
      ...options,
      paymentIdentifier: jobResponse.paymentIdentifier,
      lovelaceAmount: jobResponse.lovelaceAmount
    });
    
    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

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