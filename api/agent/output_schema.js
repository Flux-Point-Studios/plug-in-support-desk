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
      response: {
        type: 'string',
        description: 'The AI agent response'
      },
      metadata: {
        type: 'object',
        properties: {
          confidence: { type: 'number' },
          sources: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  });
} 