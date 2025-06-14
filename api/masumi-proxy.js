export default async function handler(req, res) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, token');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const MASUMI_REGISTRY_URL = 'https://registry.masumi.network';
  const PUBLIC_REGISTRY_TOKEN = 'public-test-key-masumi-registry-c23f3d21';

  try {
    const { endpoint, ...requestData } = req.body || {};
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Construct the full URL
    const targetUrl = `${MASUMI_REGISTRY_URL}/api/v1/${endpoint}`;
    
    // Prepare the request options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'token': PUBLIC_REGISTRY_TOKEN
      }
    };

    // Add body for POST requests
    if (req.method === 'POST' && Object.keys(requestData).length > 0) {
      fetchOptions.body = JSON.stringify(requestData);
    }

    // Make the request to Masumi registry
    const response = await fetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Masumi API error: ${response.status} ${response.statusText}`, errorText);
      return res.status(response.status).json({ 
        error: `Masumi API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Masumi proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
} 