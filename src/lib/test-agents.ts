// Utility to test and identify working agents on Masumi network
import { discoverAgents, checkAgentAvailability, type MasumiAgent } from './masumi-agent-discovery';

interface AgentTestResult {
  agent: MasumiAgent;
  isAvailable: boolean;
  error?: string;
  responseTime?: number;
}

/**
 * Test all agents to find which ones are actually working
 */
export async function testAllAgents(): Promise<AgentTestResult[]> {
  try {
    console.log('🔍 Discovering agents on Masumi network...');
    const agents = await discoverAgents(20); // Test up to 20 agents
    
    console.log(`Found ${agents.length} agents, testing availability...`);
    
    const results: AgentTestResult[] = [];
    
    // Test agents in parallel (but with some delay to avoid overwhelming)
    const testPromises = agents.map(async (agent, index) => {
      // Add small delay to stagger requests
      await new Promise(resolve => setTimeout(resolve, index * 500));
      
      const startTime = Date.now();
      try {
        const isAvailable = await checkAgentAvailability(agent.apiBaseUrl);
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ ${agent.name}: Available (${responseTime}ms)`);
        
        return {
          agent,
          isAvailable: true,
          responseTime
        };
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        
        console.log(`❌ ${agent.name}: Unavailable - ${error.message} (${responseTime}ms)`);
        
        return {
          agent,
          isAvailable: false,
          error: error.message,
          responseTime
        };
      }
    });
    
    const testResults = await Promise.all(testPromises);
    
    // Sort by availability first, then by response time
    testResults.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return (a.responseTime || 999999) - (b.responseTime || 999999);
    });
    
    const availableCount = testResults.filter(r => r.isAvailable).length;
    console.log(`\n📊 Test Results: ${availableCount}/${testResults.length} agents available`);
    
    return testResults;
    
  } catch (error: any) {
    console.error('Failed to test agents:', error);
    throw new Error(`Agent testing failed: ${error.message}`);
  }
}

/**
 * Get the best working agent for testing
 */
export async function getBestWorkingAgent(): Promise<MasumiAgent | null> {
  try {
    const results = await testAllAgents();
    const workingAgents = results.filter(r => r.isAvailable);
    
    if (workingAgents.length === 0) {
      console.log('❌ No working agents found');
      return null;
    }
    
    // Return the fastest responding agent
    const best = workingAgents[0];
    console.log(`🚀 Best agent: ${best.agent.name} (${best.responseTime}ms response time)`);
    
    return best.agent;
    
  } catch (error: any) {
    console.error('Failed to find working agent:', error);
    return null;
  }
}

/**
 * Print a nice summary of agent test results
 */
export function printAgentTestSummary(results: AgentTestResult[]): void {
  console.log('\n=== MASUMI AGENT TEST SUMMARY ===');
  
  const available = results.filter(r => r.isAvailable);
  const unavailable = results.filter(r => !r.isAvailable);
  
  console.log(`\n✅ AVAILABLE AGENTS (${available.length}):`);
  available.forEach(result => {
    console.log(`  • ${result.agent.name} - ${result.responseTime}ms`);
    console.log(`    📍 ${result.agent.apiBaseUrl}`);
    console.log(`    💰 ${getPriceDisplay(result.agent)}`);
    console.log(`    🏷️  ${result.agent.Tags?.slice(0, 3).join(', ') || 'No tags'}`);
  });
  
  console.log(`\n❌ UNAVAILABLE AGENTS (${unavailable.length}):`);
  unavailable.forEach(result => {
    console.log(`  • ${result.agent.name} - ${result.error}`);
    console.log(`    📍 ${result.agent.apiBaseUrl}`);
  });
  
  if (available.length > 0) {
    console.log(`\n🎯 RECOMMENDATION: Use "${available[0].agent.name}" (fastest response)`);
  } else {
    console.log('\n⚠️  No agents are currently available. Try again later.');
  }
}

function getPriceDisplay(agent: MasumiAgent): string {
  const pricing = agent.AgentPricing?.FixedPricing?.Amounts?.[0];
  if (!pricing) return "Free";
  
  const amount = parseInt(pricing.amount);
  if (pricing.unit === 'lovelace' || pricing.unit === '') {
    return `${amount / 1000000} ADA`;
  }
  return `${amount} ${pricing.unit}`;
} 