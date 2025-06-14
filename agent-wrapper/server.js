require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for jobs (in production, use a database)
const jobs = new Map();

// Configuration
const MASUMI_PAYMENT_URL = process.env.MASUMI_PAYMENT_URL || 'http://localhost:3001';
const MASUMI_API_KEY = process.env.MASUMI_API_KEY;
const FLUX_POINT_API_URL = process.env.FLUX_POINT_API_URL || 'https://api.fluxpointstudios.com/chat';
const FLUX_POINT_API_KEY = process.env.FLUX_POINT_API_KEY;
const AGENT_IDENTIFIER = process.env.AGENT_IDENTIFIER; // Will be set after registration
const AGENT_PRICE = process.env.AGENT_PRICE || '1000000'; // 1 ADA in lovelace

// MIP-003 Endpoints

// GET /input_schema - Describes expected inputs
app.get('/input_schema', (req, res) => {
  res.json({
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
});

// GET /output_schema - Describes output format
app.get('/output_schema', (req, res) => {
  res.json({
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
});

// GET /availability - Returns if agent is available
app.get('/availability', (req, res) => {
  res.json({
    status: 'available',
    message: 'Agent is ready to accept requests',
    price: {
      amount: AGENT_PRICE,
      unit: 'lovelace' // Native ADA unit
    }
  });
});

// POST /start_job - Initiates a job with payment
app.post('/start_job', async (req, res) => {
  try {
    const { identifier_from_purchaser, input_data } = req.body;
    
    if (!input_data?.message) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing required field: input_data.message'
      });
    }

    // Generate job ID
    const jobId = uuidv4();
    
    // Create payment request with Masumi
    let paymentId = null;
    if (MASUMI_API_KEY) {
      try {
        const paymentResponse = await axios.post(
          `${MASUMI_PAYMENT_URL}/api/v1/payment/`,
          {
            network: 'Preprod',
            amount: AGENT_PRICE,
            currency: '', // Empty string for ADA
            agentIdentifier: AGENT_IDENTIFIER,
            purchaserIdentifier: identifier_from_purchaser,
            metadata: {
              jobId,
              service: 'AI Support Agent'
            }
          },
          {
            headers: {
              'token': MASUMI_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        paymentId = paymentResponse.data.data.id;
      } catch (error) {
        console.error('Failed to create payment:', error.response?.data || error.message);
        // Continue without payment for testing
      }
    }
    
    // Store job information
    jobs.set(jobId, {
      id: jobId,
      identifier_from_purchaser,
      input_data,
      payment_id: paymentId,
      status: paymentId ? 'awaiting_payment' : 'processing',
      created_at: new Date().toISOString(),
      result: null
    });

    // If no payment required (testing mode), process immediately
    if (!paymentId) {
      setTimeout(() => processJob(jobId), 100);
    }

    res.json({
      status: 'success',
      job_id: jobId,
      payment_id: paymentId
    });

  } catch (error) {
    console.error('Error in /start_job:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to start job'
    });
  }
});

// GET /status - Checks job status
app.get('/status', async (req, res) => {
  const { job_id } = req.query;
  
  if (!job_id) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing job_id parameter'
    });
  }

  const job = jobs.get(job_id);
  if (!job) {
    return res.status(404).json({
      status: 'error',
      error: 'Job not found'
    });
  }

  // Check payment status if payment required
  if (job.payment_id && job.status === 'awaiting_payment') {
    try {
      const paymentStatus = await checkPaymentStatus(job.payment_id);
      if (paymentStatus === 'paid') {
        job.status = 'processing';
        // Start processing the job
        processJob(job_id);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  }

  res.json({
    job_id: job.id,
    status: job.status,
    result: job.result,
    created_at: job.created_at,
    completed_at: job.completed_at
  });
});

// Helper function to check payment status
async function checkPaymentStatus(paymentId) {
  if (!MASUMI_API_KEY) return 'paid'; // Skip in test mode
  
  try {
    const response = await axios.get(
      `${MASUMI_PAYMENT_URL}/api/v1/payment/${paymentId}`,
      {
        headers: { 'token': MASUMI_API_KEY }
      }
    );
    
    return response.data.data.status;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return 'unknown';
  }
}

// Helper function to process job
async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // Call Flux Point Studios API
    const response = await axios.post(
      FLUX_POINT_API_URL,
      {
        message: job.input_data.message,
        session_id: job.input_data.context?.sessionId || jobId
      },
      {
        headers: {
          'api-key': FLUX_POINT_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update job with result
    job.status = 'completed';
    job.result = {
      response: response.data.response,
      metadata: {
        confidence: 0.95,
        sources: ['Flux Point Studios AI']
      }
    };
    job.completed_at = new Date().toISOString();

    // If payment was made, update payment with result hash
    if (job.payment_id && MASUMI_API_KEY) {
      try {
        const resultHash = require('crypto')
          .createHash('sha256')
          .update(JSON.stringify({
            input: job.input_data,
            output: job.result
          }))
          .digest('hex');

        await axios.patch(
          `${MASUMI_PAYMENT_URL}/api/v1/payment/${job.payment_id}`,
          { resultHash },
          {
            headers: {
              'token': MASUMI_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('Failed to update payment with result:', error);
      }
    }

  } catch (error) {
    console.error('Error processing job:', error);
    job.status = 'failed';
    job.error = 'Failed to process request';
    job.completed_at = new Date().toISOString();
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
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
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Masumi Agent Wrapper running on http://localhost:${PORT}`);
  console.log(`📝 Documentation: http://localhost:${PORT}/`);
  if (!MASUMI_API_KEY) {
    console.log('⚠️  No MASUMI_API_KEY set - running in test mode without payments');
  }
  if (!FLUX_POINT_API_KEY) {
    console.log('❌ No FLUX_POINT_API_KEY set - agent calls will fail');
  }
}); 