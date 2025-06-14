# Flux Point Studios API Troubleshooting

## API Integration Updated (T Backend API)

The AI service has been updated to work with the T Backend API from [Flux Point Studios](https://api.fluxpointstudios.com/docs). Key changes based on their documentation:

### 1. Session ID Implementation
The API requires a `sessionId` parameter. The system now automatically:
- Uses the user's **email address** if logged in via Supabase
- Falls back to **wallet address** if connected via Cardano wallet
- Shows error if neither is available

### 2. Request Format
```json
{
  "message": "Your message here",
  "session_id": "user@example.com"
}
```

### 3. Authentication Header
The API key must be sent as:
- `api-key: YOUR_API_KEY`

## Debugging Steps

### 1. Check Environment Variables
Ensure your `.env` file has:
```env
VITE_AGENT_API_URL=https://api.fluxpointstudios.com/chat
VITE_AGENT_API_KEY=your_actual_api_key_here
```

### 2. Use Debug Button
In development mode, a "Debug API Connection" button appears below the AI Assistant section. Click it to see:
- Current API URL and key (masked)
- Session ID being used
- Full request/response details in console

### 3. Common Error Solutions

#### 403 Forbidden
- **Invalid API Key**: Check your API key is correct
- **Missing Session ID**: Ensure you're logged in or have wallet connected
- **Wrong Headers**: The API might expect different authentication format

#### 404 Not Found
- **Wrong Endpoint**: Verify the API URL is correct
- **Missing Path**: Some APIs need `/v1/chat` or similar paths

#### 500 Server Error
- **Invalid Request Format**: Check the API documentation for exact parameter names
- **Rate Limiting**: You might be hitting API rate limits

### 4. Response Format Handling
The service now handles multiple response formats:
- `data.response`
- `data.message`
- `data.content`
- `data.choices[0].message.content` (OpenAI format)

### 5. Testing Checklist
1. ✅ User is logged in (email) or wallet connected
2. ✅ API key is set in environment variables
3. ✅ Correct API URL is configured
4. ✅ Session ID is being captured (check console)
5. ✅ Request is properly formatted (use debug button)

### 6. Manual API Test
You can test the API directly:
```bash
curl -X POST https://api.fluxpointstudios.com/chat \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY" \
  -d '{
    "message": "Hello, please respond with: API working!",
    "session_id": "test@example.com"
  }'
```

## Getting an API Key

To get an API key for the T Backend API:
1. Visit [Flux Point Studios](https://fluxpointstudios.com)
2. Create an account or login
3. Navigate to API settings
4. Generate a new API key
5. Add it to your `.env` file as `VITE_AGENT_API_KEY`

## Need Help?

1. Check the [API documentation](https://api.fluxpointstudios.com/docs)
2. Use the debug button to inspect requests/responses
3. Check browser console for detailed error messages
4. Verify your API key has proper permissions
5. Test with the manual curl command to isolate issues 