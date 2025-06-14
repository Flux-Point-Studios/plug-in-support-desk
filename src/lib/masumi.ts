// Using native fetch instead of axios

// Masumi configuration from environment variables
const MASUMI_PAYMENT_URL = import.meta.env.VITE_MASUMI_PAYMENT_URL || 'https://payment.masumi.network';
const MASUMI_API_KEY = import.meta.env.VITE_MASUMI_API_KEY;
const MASUMI_VKEY = import.meta.env.VITE_MASUMI_VKEY;
const MASUMI_NETWORK = import.meta.env.VITE_MASUMI_NETWORK || 'Preprod';

interface RegisterAgentParams {
  name: string;
  description: string;
  apiUrl: string;
  tags?: string[];
  author?: {
    name: string;
    contact: string;
  };
}

interface MasumiRegistryResponse {
  data: {
    agentIdentifier: string;
    state: string;
    createdAt: string;
  };
}

/**
 * Register an AI agent with Masumi Registry
 */
export async function registerAgent({
  name,
  description,
  apiUrl,
  tags = ['support', 'ai', 'helpdesk'],
  author = { name: 'Support Bot Builder', contact: 'support@example.com' }
}: RegisterAgentParams): Promise<string> {
  if (!MASUMI_API_KEY) {
    throw new Error('MASUMI_API_KEY environment variable not set');
  }

  if (!MASUMI_VKEY) {
    throw new Error('MASUMI_VKEY environment variable not set');
  }

  const payload = {
    network: MASUMI_NETWORK,
    name,
    description,
    Tags: tags,
    ExampleOutputs: [],
    Author: {
      name: author.name,
      email: author.contact
    },
    Legal: {
      terms: 'https://example.com/terms',
      privacy: 'https://example.com/privacy'
    },
    apiBaseUrl: apiUrl,
    Capability: { 
      name: 'HelpDesk', 
      version: '1.0.0' 
    },
    AgentPricing: {
      pricingType: 'Fixed',
      Pricing: [{ 
        unit: '', // Empty string for ADA on testnet
        amount: '1000000' // 1 ADA
      }]
    },
    sellingWalletVkey: MASUMI_VKEY
  };

  try {
    const response = await fetch(
      `${MASUMI_PAYMENT_URL}/api/v1/registry/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': MASUMI_API_KEY
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
    }

    const data: MasumiRegistryResponse = await response.json();
    return data.data.agentIdentifier;
  } catch (error: any) {
    console.error('Failed to register agent with Masumi:', error);
    throw new Error(`Masumi registration failed: ${error.message}`);
  }
}

/**
 * Check the registration status of an agent
 */
export async function checkAgentStatus(agentIdentifier: string): Promise<string> {
  if (!MASUMI_API_KEY) {
    throw new Error('MASUMI_API_KEY environment variable not set');
  }

  try {
    const response = await fetch(
      `${MASUMI_PAYMENT_URL}/registry/${agentIdentifier}?network=${MASUMI_NETWORK}`,
      {
        headers: {
          'token': MASUMI_API_KEY
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.data.state; // 'RegistrationRequested', 'Registered', etc.
  } catch (error: any) {
    console.error('Failed to check agent status:', error);
    throw new Error(`Status check failed: ${error.message}`);
  }
}

/**
 * Poll for agent registration completion
 */
export async function waitForRegistration(
  agentIdentifier: string, 
  maxAttempts = 20, 
  delayMs = 3000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await checkAgentStatus(agentIdentifier);
      
      if (status === 'Registered') {
        return true;
      }
      
      if (status === 'Failed' || status === 'Rejected') {
        throw new Error(`Registration failed with status: ${status}`);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === maxAttempts - 1) throw error;
    }
  }
  
  return false;
} 