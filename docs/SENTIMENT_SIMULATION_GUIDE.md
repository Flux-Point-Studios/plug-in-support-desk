# Sentiment Simulation & AI Integration Guide

## Overview

The Support Portal includes both real AI integration and a sophisticated sentiment simulation system. You can toggle between:

1. **Real AI Mode** (Default) - Uses the same Flux Point Studios API as the agent creation page
2. **Simulation Mode** - For testing sentiment patterns without API calls

This dual-mode system is useful for:

- Production support with real AI responses
- Testing sentiment tracking without consuming API credits
- Demonstrating the platform's analytics capabilities
- Training support teams on handling various customer moods

## Features

### 1. Real AI Integration

When **"Use Real AI"** is enabled:
- Chat messages are sent to the Flux Point Studios API endpoint
- Uses the same authentication and parameters as agent creation
- Includes conversation context (last 5 messages)
- Service level affects AI response style:
  - **Basic**: Concise, helpful responses
  - **Premium**: Detailed, personalized support
  - **Enterprise**: White-glove service with proactive suggestions
- Automatic sentiment analysis of user messages
- Fallback error handling if API is unavailable

### 2. Real-Time Sentiment Tracking

The **Live Sentiment** gauge displays:
- **Current Satisfaction Score** (0-100%)
- **Trend Indicator** (↑ improving, ↓ declining, - stable)
- **Sentiment Label** (Positive, Neutral, Negative)
- **Data Points Count** - number of sentiment measurements
- **Visual Gauge** with color coding:
  - 🟢 Green (70%+) - Positive sentiment
  - 🟡 Yellow (40-69%) - Neutral sentiment
  - 🔴 Red (<40%) - Negative sentiment

### 3. Sentiment Simulation Controls

Located at the top-right of the Support Portal:

- **Use Real AI Toggle**: Switch between real API and simulation
- **Scenario Selector** (Simulation mode only): Choose from three pre-configured scenarios
  - **Balanced Sentiment**: Mixed feedback (40% positive, 30% neutral, 30% negative)
  - **Very Negative Sentiment**: Predominantly negative (50% very negative, 30% negative, 20% neutral)
  - **Positive Sentiment**: Mostly positive (40% excellent, 40% very positive, 20% good)
  
- **Start/Stop Button**: Control the simulation flow (disabled in Real AI mode)

### 4. Service Level Selection

Each chat session can be assigned a service level:
- **Basic** (50% of simulated interactions)
- **Premium** (30% of simulated interactions)
- **Enterprise** (20% of simulated interactions)

This affects the sentiment distribution and simulates real-world tiered support scenarios.

### 5. Interactive Chat Rating

- **Thumbs Up** 👍 - Mark AI response as helpful (adds positive sentiment)
- **Thumbs Down** 👎 - Mark AI response as unhelpful (adds negative sentiment)
- Ratings immediately affect the Live Sentiment gauge
- Visual feedback shows which messages have been rated
- Works in both Real AI and Simulation modes

### 6. Chat Session Management

- **Close Session** (X button) - End current chat and start fresh
- Closed sessions appear in **Chat History** with:
  - Session ID and timestamp
  - Message count
  - Overall sentiment score
  - Service level badge
  - Duration

### 7. Analytics Overview

Real-time metrics update as you interact:
- **Today's Conversations** - Total session count
- **Resolution Rate** - Percentage of sessions with positive outcomes
- **Average Response Time** - Simulated at 0.8s
- **Active Agents** - Number of available support agents

## How Sentiment is Calculated

### Aggregate Sentiment
- Uses a 5-minute rolling window
- Averages all sentiment data points within the window
- Calculates trend by comparing first half vs second half of data

### Message Sentiment
- User ratings (thumbs up/down) directly impact sentiment
- Thumbs up = 0.9 score (90% positive)
- Thumbs down = 0.1 score (10% positive)
- Unrated messages don't affect sentiment

### Session Sentiment
- Calculated when session closes
- Average of all rated messages in the session
- Displayed in Chat History

## Testing Guide

### Quick Start
1. Navigate to Support Portal
2. Select a sentiment scenario from the dropdown
3. Click "Start" to begin simulation
4. Interact with the chat and use thumbs buttons
5. Watch the Live Sentiment gauge update in real-time

### Automated Testing

Use the provided test script (`scripts/test-sentiment.js`):

```javascript
// In browser console:
window.sentimentTests.runAllTests()
```

This will:
- Test all three sentiment scenarios
- Simulate chat interactions
- Test thumbs up/down functionality
- Change service levels
- Manage chat sessions

### Manual Testing Scenarios

#### Scenario 1: Customer Escalation
1. Start with "Balanced Sentiment"
2. Send frustrated messages
3. Rate responses with thumbs down
4. Watch sentiment decline
5. Switch to "Very Negative Sentiment"
6. Observe trend indicator showing decline

#### Scenario 2: Service Recovery
1. Start with "Very Negative Sentiment"
2. Send appreciative messages
3. Rate responses with thumbs up
4. Watch sentiment improve
5. Switch to "Positive Sentiment"
6. Observe trend indicator showing improvement

#### Scenario 3: Service Level Comparison
1. Set service level to "Basic"
2. Run simulation for 1 minute
3. Close session and check sentiment
4. Repeat with "Premium" and "Enterprise"
5. Compare sentiment scores in Chat History

## Best Practices

1. **Realistic Testing**: Use varied message types and ratings
2. **Time Windows**: Allow 5+ minutes for trend analysis
3. **Multiple Sessions**: Test with at least 3-5 sessions for meaningful analytics
4. **Service Levels**: Test all three levels to see distribution patterns
5. **Edge Cases**: Test rapid rating changes and session switching

## Troubleshooting

### Sentiment Not Updating
- Ensure simulation is started (not stopped)
- Check browser console for errors
- Verify at least one data point exists

### Trend Not Showing
- Need minimum 2 data points in 5-minute window
- Wait for more sentiment data to accumulate

### Chat History Empty
- Sessions only appear after closing (X button)
- Active sessions don't show in history

### Resolution Rate Shows 0%
- Need at least one closed session
- Sessions must have 70%+ sentiment to count as resolved

## API Configuration

### Environment Variables

To use the Real AI mode, ensure these environment variables are set:

```env
VITE_AGENT_API_URL=https://api.fluxpointstudios.com/chat
VITE_AGENT_API_KEY=your_api_key_here
```

### API Request Format

The chat service sends requests in the same format as agent creation:

```typescript
{
  message: string,    // User message with context
  session_id: string  // User email or wallet address
}
```

### Headers

```typescript
{
  'Content-Type': 'application/json',
  'api-key': YOUR_API_KEY  // Note: 'api-key' not 'Authorization'
}
```

### Response Handling

The system expects responses in one of these formats:
- `{ reply: string }`
- `{ response: string }`
- `{ message: string }`
- `{ content: string }`

## Future Enhancements

- Export sentiment data to CSV
- Historical sentiment charts
- Sentiment-based routing
- Custom scenario creation
- Multi-language sentiment analysis
- Integration with real customer feedback systems 