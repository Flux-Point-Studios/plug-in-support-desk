// Sentiment demonstration utilities
import { 
  sentimentScenarios, 
  generateSentiment, 
  SentimentSimulator,
  type ServiceLevel 
} from './sentiment-simulator';

export interface DemoConfig {
  scenario: keyof typeof sentimentScenarios;
  duration: number; // in seconds
  interval: number; // in milliseconds
  serviceLevelDistribution?: {
    basic: number;
    premium: number;
    enterprise: number;
  };
}

export class SentimentDemo {
  private simulator: SentimentSimulator;
  private demoTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    this.simulator = new SentimentSimulator();
  }
  
  // Run a complete demo showcasing all features
  async runFullDemo(onUpdate?: (message: string) => void) {
    const log = (msg: string) => {
      console.log(msg);
      onUpdate?.(msg);
    };
    
    log('🎭 Starting AI HelpDesk Sentiment Demo');
    log('=====================================\n');
    
    // Demo 1: Balanced scenario
    log('📊 Demo 1: Balanced Customer Sentiment');
    log('Simulating mixed customer interactions...');
    await this.runScenario('balanced', 10, 1000);
    
    await this.delay(2000);
    
    // Demo 2: Crisis scenario
    log('\n😠 Demo 2: Customer Service Crisis');
    log('Simulating predominantly negative feedback...');
    await this.runScenario('veryNegative', 10, 800);
    
    await this.delay(2000);
    
    // Demo 3: Success scenario
    log('\n😊 Demo 3: Excellent Service Recovery');
    log('Simulating positive customer satisfaction...');
    await this.runScenario('positive', 10, 1200);
    
    log('\n✅ Demo Complete!');
    log('Check the Live Sentiment gauge and Chat History for results.');
  }
  
  // Run a specific scenario
  async runScenario(
    scenario: keyof typeof sentimentScenarios,
    durationSeconds: number,
    intervalMs: number
  ): Promise<void> {
    return new Promise((resolve) => {
      this.simulator.start(scenario, intervalMs);
      
      this.demoTimeout = setTimeout(() => {
        this.simulator.stop();
        resolve();
      }, durationSeconds * 1000);
    });
  }
  
  // Generate sample data for different service levels
  generateServiceLevelData(count: number = 100): {
    basic: number[];
    premium: number[];
    enterprise: number[];
  } {
    const data = {
      basic: [] as number[],
      premium: [] as number[],
      enterprise: [] as number[]
    };
    
    for (let i = 0; i < count; i++) {
      // Basic tier - more negative sentiment
      const basicSentiment = generateSentiment('veryNegative', 'basic');
      data.basic.push(basicSentiment.score);
      
      // Premium tier - balanced sentiment
      const premiumSentiment = generateSentiment('balanced', 'premium');
      data.premium.push(premiumSentiment.score);
      
      // Enterprise tier - positive sentiment
      const enterpriseSentiment = generateSentiment('positive', 'enterprise');
      data.enterprise.push(enterpriseSentiment.score);
    }
    
    return data;
  }
  
  // Calculate statistics for demo data
  calculateStats(scores: number[]): {
    average: number;
    min: number;
    max: number;
    positive: number;
    neutral: number;
    negative: number;
  } {
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    
    const positive = scores.filter(s => s >= 0.7).length;
    const neutral = scores.filter(s => s >= 0.4 && s < 0.7).length;
    const negative = scores.filter(s => s < 0.4).length;
    
    return {
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      positive: Math.round((positive / scores.length) * 100),
      neutral: Math.round((neutral / scores.length) * 100),
      negative: Math.round((negative / scores.length) * 100)
    };
  }
  
  // Print service level comparison
  printServiceLevelComparison() {
    console.log('\n📊 Service Level Sentiment Comparison');
    console.log('=====================================');
    
    const data = this.generateServiceLevelData(100);
    
    const levels: ServiceLevel[] = ['basic', 'premium', 'enterprise'];
    levels.forEach(level => {
      const stats = this.calculateStats(data[level]);
      console.log(`\n${level.toUpperCase()} Tier:`);
      console.log(`  Average Score: ${stats.average * 100}%`);
      console.log(`  Range: ${stats.min * 100}% - ${stats.max * 100}%`);
      console.log(`  Distribution:`);
      console.log(`    Positive: ${stats.positive}%`);
      console.log(`    Neutral: ${stats.neutral}%`);
      console.log(`    Negative: ${stats.negative}%`);
    });
  }
  
  // Cleanup
  stop() {
    this.simulator.stop();
    if (this.demoTimeout) {
      clearTimeout(this.demoTimeout);
      this.demoTimeout = null;
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance for easy access
export const sentimentDemo = new SentimentDemo();

// Browser-friendly exports
if (typeof window !== 'undefined') {
  (window as any).sentimentDemo = sentimentDemo;
} 