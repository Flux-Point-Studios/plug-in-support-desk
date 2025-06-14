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
    if (data) {
      console.log('Request data:', JSON.stringify(data, null, 2));
    }
    
    // Prepare the request options
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Masumi-Support-Bot/1.0',
        'Accept': 'application/json'
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    };

    // Add body for POST requests
    if (method === 'POST' && data) {
      fetchOptions.body = JSON.stringify(data);
      console.log('Request body:', fetchOptions.body);
    }

    // Make the request to the agent
    const response = await fetch(cleanUrl, fetchOptions);
    
    if (!response.ok) {
      console.error(`Agent API error: ${response.status} ${response.statusText}`);
      
      // Try to get error details from response
      let errorDetails = '';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson);
          console.error('Error response JSON:', errorJson);
        } else {
          errorDetails = await response.text();
          console.error('Error response text:', errorDetails);
        }
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      // Handle specific error cases
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Agent endpoint not found',
          message: 'The agent may be offline or the endpoint has changed',
          details: errorDetails
        });
      }
      
      if (response.status === 400) {
        return res.status(400).json({ 
          error: 'Bad request to agent',
          message: 'The agent rejected the request. Check the input format.',
          details: errorDetails,
          debug: {
            url: cleanUrl,
            method: method,
            data: data
          }
        });
      }
      
      if (response.status >= 500) {
        return res.status(502).json({ 
          error: 'Agent server error',
          message: 'The agent is experiencing technical difficulties',
          details: errorDetails
        });
      }
      
      return res.status(response.status).json({ 
        error: `Agent API error: ${response.status} ${response.statusText}`,
        details: errorDetails
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
    
    console.log('Agent response:', typeof responseData === 'object' ? JSON.stringify(responseData).substring(0, 200) + '...' : responseData.substring(0, 200) + '...');
    
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
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 