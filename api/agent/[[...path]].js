// Simple CORS headers function
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Configuration from environment variables
const AGENT_PRICE = process.env.AGENT_PRICE || '1000000';

// Simple UUID generator
function generateId() {
  return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const endpoint = path ? path.join('/') : '';

  // Route handling
  switch (`${req.method} /${endpoint}`) {
    case 'GET /':
      return res.json({
        name: 'AI Support Agent (Masumi Wrapper)',
        version: '1.0.0',
        endpoints: [
          'GET /input_schema',
          'GET /output_schema',
          'GET /availability',
          'POST /start_job',
          'GET /status',
          'GET /health'
        ],
        documentation: 'https://docs.masumi.network/technical-documentation/mip-3-agentic-service-standard'
      });

    case 'GET /health':
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });

    case 'GET /input_schema':
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

    case 'GET /output_schema':
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

    case 'GET /availability':
      return res.json({
        status: 'available',
        message: 'Agent is ready to accept requests',
        price: {
          amount: AGENT_PRICE,
          unit: 'lovelace'
        }
      });

    case 'POST /start_job':
      try {
        const { identifier_from_purchaser, input_data } = req.body;
        
        if (!input_data?.message) {
          return res.status(400).json({
            status: 'error',
            error: 'Missing required field: input_data.message'
          });
        }

        const jobId = generateId();
        
        // For now, return a mock response to test the registration
        // In production, this would call your actual AI service
        const mockResponse = {
          response: "This is a test response from the AI Support Agent. In production, this would connect to your actual AI service.",
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

      } catch (error) {
        console.error('Error in /start_job:', error);
        return res.status(500).json({
          status: 'error',
          error: 'Failed to start job'
        });
      }

    case 'GET /status':
      // For serverless immediate processing, always return completed
      const { job_id } = req.query;
      if (!job_id) {
        return res.status(400).json({
          status: 'error',
          error: 'Missing job_id parameter'
        });
      }
      return res.json({
        job_id,
        status: 'completed',
        message: 'Job processed immediately in serverless mode'
      });

    default:
      return res.status(404).json({
        status: 'error',
        error: `Endpoint not found: ${req.method} /${endpoint}`
      });
  }
} 