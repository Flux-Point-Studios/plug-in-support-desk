const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// In-memory storage (Note: This will reset between invocations in serverless)
// For production, use a database like Supabase
const jobs = new Map();

// Configuration from environment variables
const MASUMI_PAYMENT_URL = process.env.MASUMI_PAYMENT_URL || 'http://localhost:3001';
const MASUMI_API_KEY = process.env.MASUMI_API_KEY;
const FLUX_POINT_API_URL = process.env.FLUX_POINT_API_URL || 'https://api.fluxpointstudios.com/chat';
const FLUX_POINT_API_KEY = process.env.FLUX_POINT_API_KEY;
const AGENT_IDENTIFIER = process.env.AGENT_IDENTIFIER;
const AGENT_PRICE = process.env.AGENT_PRICE || '1000000';

// CORS middleware
const corsMiddleware = cors({
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  credentials: true
});

// Helper to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, corsMiddleware);

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

        const jobId = uuidv4();
        
        // For serverless, we'll process immediately and return
        // In production, use a database to persist job state
        const response = await processJobImmediate(input_data);
        
        return res.json({
          status: 'success',
          job_id: jobId,
          result: response // Return result immediately for serverless
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

// Process job immediately for serverless
async function processJobImmediate(input_data) {
  try {
    const response = await axios.post(
      FLUX_POINT_API_URL,
      {
        message: input_data.message,
        session_id: input_data.context?.sessionId || uuidv4()
      },
      {
        headers: {
          'api-key': FLUX_POINT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      response: response.data.response,
      metadata: {
        confidence: 0.95,
        sources: ['Flux Point Studios AI']
      }
    };
  } catch (error) {
    console.error('Error processing request:', error);
    throw error;
  }
} 