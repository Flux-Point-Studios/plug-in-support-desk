export default async function handler(req, res) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { targetUrl, method = 'GET', data } = req.body || {};
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'targetUrl parameter is required' });
    }

    // Clean up the URL to avoid double slashes
    const cleanUrl = targetUrl.replace(/([^:]\/)\/+/g, "$1");
    
    console.log(`Proxying ${method} request to: ${cleanUrl}`);
    
    // Prepare the request options
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Masumi-Support-Bot/1.0'
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    };

    // Add body for POST requests
    if (method === 'POST' && data) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Make the request to the agent
    const response = await fetch(cleanUrl, fetchOptions);
    
    if (!response.ok) {
      console.error(`Agent API error: ${response.status} ${response.statusText}`);
      
      // Handle specific error cases
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Agent endpoint not found',
          message: 'The agent may be offline or the endpoint has changed'
        });
      }
      
      if (response.status >= 500) {
        return res.status(502).json({ 
          error: 'Agent server error',
          message: 'The agent is experiencing technical difficulties'
        });
      }
      
      const errorText = await response.text().catch(() => 'Unknown error');
      return res.status(response.status).json({ 
        error: `Agent API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // Try to parse as JSON, fallback to text
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    res.status(200).json({ 
      success: true, 
      data: responseData,
      status: response.status,
      statusText: response.statusText
    });

  } catch (error) {
    console.error('Agent proxy error:', error);
    
    // Handle different types of errors
    if (error.name === 'TimeoutError') {
      return res.status(504).json({ 
        error: 'Agent timeout', 
        message: 'The agent took too long to respond'
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Agent unavailable', 
        message: 'Could not connect to the agent service'
      });
    }
    
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
} 