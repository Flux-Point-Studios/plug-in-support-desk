export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { job_id } = req.query;
  
  if (!job_id) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing job_id parameter'
    });
  }
  
  // For testing, always return completed status
  return res.json({
    job_id,
    status: 'completed',
    message: 'Job processed immediately in serverless mode',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  });
} 