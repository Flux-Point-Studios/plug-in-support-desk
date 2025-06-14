export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.json({
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message or question for the AI support agent'
      },
      context: {
        type: 'object',
        description: 'Optional context about the conversation',
        properties: {
          userId: { type: 'string' },
          sessionId: { type: 'string' },
          category: { type: 'string' }
        }
      }
    },
    required: ['message']
  });
} 