// Chat service for Support Portal - uses same AI endpoint as agent configuration
import { getSessionId } from './ai-service';

// HARDCODED FOR HACKATHON
const AGENT_API_URL = 'https://api.fluxpointstudios.com/chat';
const AGENT_API_KEY = '6c3bb3eedc9441978bbc44af20f0b82d';

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
  const sessionId = await getSessionId();
  
  // STUBBED RESPONSE - SpectrumLink Support Bot
  // Generate intelligent responses based on the user's query about SpectrumLink services
  
  const lowercaseMessage = message.toLowerCase();
  let reply = '';
  let sentiment = 0.7; // Default positive sentiment
  
  // Check for specific topics and provide relevant information
  if (lowercaseMessage.includes('plan') || lowercaseMessage.includes('pricing') || lowercaseMessage.includes('cost')) {
    reply = `I'd be happy to help you understand our SpectrumLink service plans!\n\n📱 **Phone Plans:**\n• **Basic Talk & Text** - $20/mo: Unlimited voice & SMS (no data)\n• **Essential Phone** - $45/mo: 10 GB high-speed data + unlimited talk/text\n• **Unlimited Plus** - $70/mo: Unlimited data with 50 GB priority & 100 GB hotspot\n\n📡 **Data-Only Plans:**\n• **DataConnect 10 GB** - $25/mo: 10 GB pooled data for hotspots\n• **DataConnect Unlimited** - $55/mo: Unlimited data with 30 GB priority\n\n🔧 **IoT Plans:**\n• **IoT Flex** - $5/mo + $0.40/MB: Pay-as-you-go for smart devices\n\nWhich type of plan interests you most?`;
    sentiment = 0.8;
  } else if (lowercaseMessage.includes('device') || lowercaseMessage.includes('phone') || lowercaseMessage.includes('hotspot')) {
    reply = `Let me tell you about our SpectrumLink devices!\n\n📱 **Smartphones:**\n• **Volt One** - Our flagship with 5G, eSIM, and Wi-Fi 6E\n• **Volt One Pro** - Premium model with mmWave 5G and 120Hz display\n• **Volt One Lite** - Budget-friendly with 4G LTE\n\n📶 **Hotspots:**\n• **AirWave 300** - 4G LTE hotspot with 10-hour battery\n• **AirWave 600 5G** - Latest 5G speeds with Wi-Fi 6\n\n🚗 **IoT/M2M:**\n• **DriveSense V2** - Smart car diagnostics and tracking\n• **LinkEdge R500** - Rugged router for enterprise connectivity\n\nAll devices come with a 24-36 month warranty. Which device type would you like to know more about?`;
    sentiment = 0.8;
  } else if (lowercaseMessage.includes('activate') || lowercaseMessage.includes('setup') || lowercaseMessage.includes('sim')) {
    reply = `I'll guide you through device activation!\n\n**Quick Activation Steps:**\n1. 📱 Insert your SpectrumLink SIM card (or activate eSIM)\n2. ☎️ Dial *228 to push initial settings\n3. ✅ Verify IMS registration in Settings > About > SIM status\n4. 📲 Run the SpectrumLink Device Health app for final setup\n\n**Helpful Tips:**\n• Default APN: slcore.lte (auto-configured)\n• Enterprise customers use: slcorp.apn\n• VoLTE is enabled by default for HD voice\n\nNeed help with a specific activation issue? Just let me know!`;
    sentiment = 0.75;
  } else if (lowercaseMessage.includes('support') || lowercaseMessage.includes('help') || lowercaseMessage.includes('hours')) {
    reply = `Welcome to SpectrumLink Support! Here's how we can help:\n\n🕐 **Support Hours:**\n• **Self-Service Portal**: 24/7 online\n• **Phone & Chat (Tier 1)**: Mon-Fri 6 AM - 9 PM Central\n• **Enterprise/IoT Support**: 24/7 availability\n• **Engineering (Tier 3)**: Mon-Fri 8 AM - 6 PM Central\n\n📞 **Contact Options:**\n• Toll-free: 1-888-SLS-CARE\n• Email: support@spectrumlink.com\n• Chat: Available now!\n• Enterprise API webhooks for automation\n\nHow can I assist you today?`;
    sentiment = 0.8;
  } else if (lowercaseMessage.includes('data') || lowercaseMessage.includes('usage')) {
    reply = `To check your data usage:\n\n📊 **Quick Check Methods:**\n• Dial *3282# from your device\n• Open the MySpectrumLink app dashboard\n• Log into the web portal at spectrumlink.com\n\n⚡ **Important Usage Info:**\n• Data counters reset at midnight UTC on your bill cycle day\n• After priority data limits, speeds may be reduced during network congestion\n• Hotspot/tethering usage counts toward your total data\n\nWould you like help understanding your specific plan's data allowances?`;
    sentiment = 0.75;
  } else if (lowercaseMessage.includes('international') || lowercaseMessage.includes('roaming')) {
    reply = `Yes, we offer international roaming!\n\n🌍 **International Coverage:**\n• **Canada & Mexico**: FREE roaming on Essential & Unlimited Plus plans\n• **Other Countries**: $10/day roaming passes available\n• **Coverage**: Partnerships in EU and APAC regions\n\n✈️ **Travel Tips:**\n• Enable roaming before departure in MySpectrumLink app\n• Consider suspending service for extended trips ($5/mo to retain number)\n• Check specific country coverage at spectrumlink.com/roaming\n\nPlanning a trip? I can help you prepare your service!`;
    sentiment = 0.8;
  } else if (lowercaseMessage.includes('problem') || lowercaseMessage.includes('issue') || lowercaseMessage.includes('not working')) {
    reply = `I'm sorry you're experiencing issues. Let me help troubleshoot!\n\n🔧 **Common Quick Fixes:**\n• **No Service**: Toggle airplane mode on/off, or dial *228 to update\n• **Slow Speeds**: Check if you've exceeded priority data limits\n• **Can't Make Calls**: Verify VoLTE is enabled in settings\n\n⚠️ **Known Issues We're Working On:**\n• VoLTE drops in Dallas area (fix coming July 2025)\n• AirWave 300 battery indicator bug (update to fw 2.2.2)\n• Hotspot usage tracking after 80GB (under investigation)\n\nFor immediate assistance with critical issues, call 1-888-SLS-CARE. What specific problem are you facing?`;
    sentiment = 0.6;
  } else {
    // Default response for general queries
    reply = `Thank you for contacting SpectrumLink Support! I'm here to help with:\n\n• 📱 Device setup and activation\n• 💰 Plan information and pricing\n• 🔧 Technical troubleshooting\n• 📊 Data usage and account management\n• 🌍 International roaming options\n• 🏢 Enterprise and IoT solutions\n\nWhat can I help you with today? Feel free to ask about any of our services!`;
    sentiment = 0.75;
  }
  
  // Adjust response based on service level
  if (context?.serviceLevel === 'enterprise') {
    reply += '\n\n🏢 *As an Enterprise customer, you have access to 24/7 priority support and dedicated account management.*';
    sentiment = Math.min(sentiment + 0.05, 1);
  } else if (context?.serviceLevel === 'premium') {
    reply += '\n\n⭐ *As a Premium customer, you receive priority service and extended support.*';
    sentiment = Math.min(sentiment + 0.05, 1);
  }
  
  return {
    reply,
    timestamp: new Date(),
    sentiment
  };
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