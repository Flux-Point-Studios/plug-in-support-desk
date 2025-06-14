// Sentiment simulation system for testing real-time updates

export type ServiceLevel = 'basic' | 'premium' | 'enterprise';
export type SentimentType = 'positive' | 'negative' | 'neutral';
export type ChatSentiment = 1 | -1 | 0; // thumbs up, thumbs down, neutral

export interface SentimentData {
  score: number; // 0-1
  label: string;
  level: ServiceLevel;
  timestamp: Date;
  chatId?: string;
  userRating?: ChatSentiment;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sentiment?: ChatSentiment;
  serviceLevel?: ServiceLevel;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
  overallSentiment: number;
  serviceLevel: ServiceLevel;
  isActive: boolean;
}

// Sentiment test scenarios
export const sentimentScenarios = {
  balanced: {
    name: 'Balanced Sentiment',
    description: 'Mix of positive, negative, and neutral interactions',
    data: [
      { score: 0.7, label: 'Positive', weight: 40 },
      { score: 0.4, label: 'Neutral', weight: 30 },
      { score: 0.2, label: 'Negative', weight: 30 }
    ]
  },
  veryNegative: {
    name: 'Very Negative Sentiment',
    description: 'Predominantly negative customer interactions',
    data: [
      { score: 0.1, label: 'Very Negative', weight: 50 },
      { score: 0.3, label: 'Negative', weight: 30 },
      { score: 0.5, label: 'Neutral', weight: 20 }
    ]
  },
  positive: {
    name: 'Positive Sentiment',
    description: 'Mostly positive customer satisfaction',
    data: [
      { score: 0.9, label: 'Excellent', weight: 40 },
      { score: 0.8, label: 'Very Positive', weight: 40 },
      { score: 0.6, label: 'Good', weight: 20 }
    ]
  }
};

// Service level distributions
const serviceLevelDistribution = {
  basic: 0.5,
  premium: 0.3,
  enterprise: 0.2
};

// Generate random sentiment based on scenario
export function generateSentiment(
  scenario: keyof typeof sentimentScenarios,
  serviceLevel?: ServiceLevel
): SentimentData {
  const scenarioData = sentimentScenarios[scenario].data;
  
  // Calculate weighted random selection
  const totalWeight = scenarioData.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selectedData = scenarioData[0];
  for (const data of scenarioData) {
    random -= data.weight;
    if (random <= 0) {
      selectedData = data;
      break;
    }
  }
  
  // Add some variation to the score
  const variation = (Math.random() - 0.5) * 0.1;
  const finalScore = Math.max(0, Math.min(1, selectedData.score + variation));
  
  // Determine service level if not provided
  if (!serviceLevel) {
    const levelRandom = Math.random();
    if (levelRandom < serviceLevelDistribution.basic) {
      serviceLevel = 'basic';
    } else if (levelRandom < serviceLevelDistribution.basic + serviceLevelDistribution.premium) {
      serviceLevel = 'premium';
    } else {
      serviceLevel = 'enterprise';
    }
  }
  
  return {
    score: finalScore,
    label: selectedData.label,
    level: serviceLevel,
    timestamp: new Date()
  };
}

// Simulate a stream of sentiment data
export class SentimentSimulator {
  private interval: NodeJS.Timeout | null = null;
  private callbacks: ((data: SentimentData) => void)[] = [];
  
  subscribe(callback: (data: SentimentData) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  start(scenario: keyof typeof sentimentScenarios, intervalMs: number = 2000) {
    this.stop();
    
    this.interval = setInterval(() => {
      const sentiment = generateSentiment(scenario);
      this.callbacks.forEach(cb => cb(sentiment));
    }, intervalMs);
    
    // Send initial data immediately
    const initialSentiment = generateSentiment(scenario);
    this.callbacks.forEach(cb => cb(initialSentiment));
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  // Generate a batch of historical data
  generateBatch(
    scenario: keyof typeof sentimentScenarios,
    count: number,
    timeRangeMinutes: number = 60
  ): SentimentData[] {
    const data: SentimentData[] = [];
    const now = Date.now();
    const timeStep = (timeRangeMinutes * 60 * 1000) / count;
    
    for (let i = 0; i < count; i++) {
      const sentiment = generateSentiment(scenario);
      sentiment.timestamp = new Date(now - (count - i) * timeStep);
      data.push(sentiment);
    }
    
    return data;
  }
}

// Calculate aggregate sentiment from multiple data points
export function calculateAggregateSentiment(
  data: SentimentData[],
  windowMinutes: number = 5
): { average: number; trend: 'up' | 'down' | 'stable' } {
  if (data.length === 0) return { average: 0.5, trend: 'stable' };
  
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  // Filter data within window
  const recentData = data.filter(d => 
    now - d.timestamp.getTime() <= windowMs
  );
  
  if (recentData.length === 0) return { average: 0.5, trend: 'stable' };
  
  // Calculate average
  const average = recentData.reduce((sum, d) => sum + d.score, 0) / recentData.length;
  
  // Calculate trend (compare first half with second half)
  const midPoint = Math.floor(recentData.length / 2);
  const firstHalf = recentData.slice(0, midPoint);
  const secondHalf = recentData.slice(midPoint);
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.score, 0) / firstHalf.length || 0;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.score, 0) / secondHalf.length || 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  const trendThreshold = 0.05;
  
  if (secondAvg - firstAvg > trendThreshold) trend = 'up';
  else if (firstAvg - secondAvg > trendThreshold) trend = 'down';
  
  return { average, trend };
}

// Generate realistic chat responses based on sentiment
export function generateChatResponse(userMessage: string, sentiment: SentimentType): string {
  const responses = {
    positive: [
      "I'm happy to help you with that! Based on our documentation, here's what I recommend...",
      "Great question! I have the perfect solution for you...",
      "Absolutely! Let me guide you through this step by step...",
      "I understand completely. Here's exactly what you need to do..."
    ],
    neutral: [
      "I can help you with that. Let me look into this for you...",
      "I understand your question. Here's what I found...",
      "Based on your description, here are some options...",
      "Let me provide you with the relevant information..."
    ],
    negative: [
      "I apologize for the confusion. Let me try to clarify...",
      "I understand your frustration. Let me help resolve this issue...",
      "I'm sorry you're experiencing this problem. Here's what we can do...",
      "I see the issue you're facing. Let me escalate this for immediate attention..."
    ]
  };
  
  const responseSet = responses[sentiment];
  return responseSet[Math.floor(Math.random() * responseSet.length)];
} 