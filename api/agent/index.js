export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.json({
    name: 'AI Support Agent (Masumi Wrapper)',
    version: '1.0.0',
    endpoints: [
      'GET /api/agent/input_schema',
      'GET /api/agent/output_schema',
      'GET /api/agent/availability',
      'POST /api/agent/start_job',
      'GET /api/agent/status',
      'GET /api/agent/health'
    ],
    documentation: 'https://docs.masumi.network/technical-documentation/mip-3-agentic-service-standard'
  });
} 