# AI Assistant Setup for Agent Creation

This document explains how to set up and use the AI assistant feature that helps users generate agent configurations based on their business description.

## Overview

The AI assistant helps users by:
- Generating professional agent names
- Creating concise agent bios
- Writing detailed agent descriptions
- Allowing regeneration of individual fields
- Supporting manual editing of all generated content

## Environment Variables

Add these to your `.env` file:

```env
# AI Service Configuration (Flux Point Studios API)
VITE_AGENT_API_URL=https://api.fluxpointstudios.com/chat
VITE_AGENT_API_KEY=your_flux_point_api_key

# Alternative: Use OpenAI API
# VITE_AGENT_API_URL=https://api.openai.com/v1/chat/completions
# VITE_AGENT_API_KEY=your_openai_api_key
```

## API Integration Details

The AI service is configured to work with the [Flux Point Studios API](https://api.fluxpointstudios.com/docs). Key features:

- **Session ID**: Automatically uses the user's email (if logged in) or wallet address (if connected)
- **Authentication**: Uses `api-key` header for authentication
- **Request Format**: Sends `message` and `session_id` parameters only
- **Response Format**: Reads AI response from `reply` field

## Features

### 1. Business Description Prompt
Users describe their business in a text area:
- Company type and industry
- Main products or services
- Target audience
- Support needs

### 2. One-Click Generation
The "Generate Agent Configuration" button creates:
- **Agent Name**: Concise, professional name (max 3 words)
- **Agent Bio**: Brief expertise description (max 100 chars)
- **Detailed Description**: Comprehensive agent personality and capabilities (2-3 paragraphs)

### 3. Field Regeneration
Each field has a "Regenerate" button that:
- Creates a new suggestion for that specific field
- Maintains context from other fields
- Uses slightly higher temperature for variety

### 4. Manual Editing
All generated content is fully editable:
- Users can modify any part of the suggestions
- Combine AI suggestions with manual input
- No restrictions on customization

## Implementation Details

### AI Service (`src/lib/ai-service.ts`)

```typescript
// Main generation function
generateAgentConfig({ businessPrompt }): Promise<AgentSuggestions>

// Individual field regeneration
regenerateField(field, businessPrompt, currentValues): Promise<string>
```

### UI Integration
- Business prompt textarea with placeholder examples
- Loading states with spinning icons
- Success/error toast notifications
- Regenerate buttons appear only when field has content

### API Configuration
- Supports OpenAI and compatible APIs
- Configurable model selection
- Temperature settings for creativity
- Token limits for cost control

## Usage Flow

1. **Describe Business**
   ```
   "We're an e-commerce platform specializing in sustainable 
   fashion. We need help with order tracking, returns, and 
   product recommendations."
   ```

2. **Click Generate**
   - AI processes the description
   - Generates all three fields
   - Populates form automatically

3. **Review & Edit**
   - Read generated suggestions
   - Click "Regenerate" for alternatives
   - Manually edit as needed

4. **Create Agent**
   - Form validates all fields
   - Proceeds with agent creation
   - Registers with Masumi

## Example Output

**Business Prompt:**
> "Online learning platform for coding bootcamps with live mentorship"

**Generated Name:**
> "EduTech Assistant"

**Generated Bio:**
> "Expert in course enrollment, technical setup, and learning path guidance"

**Generated Description:**
> "I'm your dedicated learning companion at CodeCamp Academy. With deep knowledge of our curriculum, enrollment processes, and technical requirements, I'm here to ensure your educational journey is smooth and successful.
> 
> I can help you choose the right bootcamp for your goals, troubleshoot technical issues with our learning platform, connect you with mentors, and provide guidance on assignments and projects. My communication style is friendly, encouraging, and patient – perfect for supporting learners at all levels.
> 
> Whether you're just starting your coding journey or looking to advance your skills, I'm available 24/7 to answer questions, provide resources, and keep you motivated throughout your learning experience."

## Customization Options

### Model Selection
Change the model in `ai-service.ts`:
```typescript
model: 'gpt-3.5-turbo', // or 'gpt-4', 'claude-3', etc.
```

### Temperature Settings
Adjust creativity levels:
- Generation: 0.7 (balanced)
- Regeneration: 0.8 (more variety)

### Token Limits
Control response length:
- Name/Bio: 100 tokens
- Description: 300-500 tokens

## Security Considerations

- API keys stored in environment variables
- Never expose keys to client
- Rate limiting recommended
- Monitor API usage costs

## Troubleshooting

### "No API Key" Error
- Check `VITE_AGENT_API_KEY` is set
- Restart dev server after adding env vars

### Poor Quality Suggestions
- Provide more detailed business description
- Try regenerating individual fields
- Adjust temperature settings

### API Errors
- Verify API endpoint URL
- Check API key permissions
- Monitor rate limits 