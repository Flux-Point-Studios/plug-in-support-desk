export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { identifier_from_purchaser, input_data } = req.body;
  
  if (!input_data?.message) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing required field: input_data.message'
    });
  }
  
  // Generate simple job ID
  const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // For testing, return a mock response immediately
  const mockResponse = {
    response: "Thank you for contacting AI Support. This is a test response. In production, this would provide actual AI-powered support.",
    metadata: {
      confidence: 0.95,
      sources: ['Flux Point Studios AI']
    }
  };
  
  return res.json({
    status: 'success',
    job_id: jobId,
    result: mockResponse
  });
} 