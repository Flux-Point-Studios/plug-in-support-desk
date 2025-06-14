# Masumi Agent Wrapper for Flux Point Studios

This service implements the Masumi MIP-003 Agentic Service API standard and routes requests to Flux Point Studios AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the service:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

4. **Test the endpoints:**
   ```bash
   # Check availability
   curl http://localhost:8000/availability
   
   # View input schema
   curl http://localhost:8000/input_schema
   ```

## MIP-003 Endpoints

- `GET /` - API documentation
- `GET /input_schema` - Expected input format
- `GET /output_schema` - Output format
- `GET /availability` - Check if agent is available
- `POST /start_job` - Start a new job (with optional payment)
- `GET /status?job_id=xxx` - Check job status

## Testing Without Payment

If `MASUMI_API_KEY` is not set, the service runs in test mode and processes requests immediately without payment.

## Registering with Masumi

After starting the service, register it with Masumi to get an `AGENT_IDENTIFIER`:

```bash
curl -X POST "http://localhost:3001/api/v1/registry/" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_ADMIN_KEY" \
  -d '{
    "network": "Preprod",
    "name": "AI Support Agent",
    "description": "Intelligent support agent powered by Flux Point Studios",
    "Tags": ["support", "AI", "customer-service"],
    "apiBaseUrl": "http://localhost:8000",
    "AgentPricing": {
      "pricingType": "Fixed",
      "Pricing": [{ "unit": "", "amount": "1000000" }]
    },
    "sellingWalletVkey": "YOUR_SELLING_WALLET_VKEY"
  }'
```

Add the returned `agentIdentifier` to your `.env` file. 

# Agent Wrapper Scripts

This directory contains scripts for registering and managing AI agents with the Masumi network.

## Prerequisites

1. **Masumi Services Running**:
   - Registry Service on port 3000
   - Payment Service on port 3001
   - PostgreSQL database

2. **Environment Variables**:
   - Copy `.env.example` to `.env`
   - Set your admin key and other required values

3. **Funded Wallets**:
   - Ensure your Selling wallet has test ADA (Preprod)
   - Use the Cardano testnet faucet to get funds

## Available Scripts

### Registration Scripts

#### `register-agent-simple.sh`
Registers an AI agent with Masumi using the configuration in `register-payload.json`.

```bash
./register-agent-simple.sh
```

#### `register-agent.ps1` (PowerShell)
Same as above but for PowerShell users:

```powershell
./register-agent.ps1
```

### Status Check Scripts

#### `check-registration-status.sh`
Checks if your agent registration has been confirmed on-chain:

```bash
./check-registration-status.sh
```

#### `registration-summary.sh`
Provides a complete summary of your agent registration:

```bash
./registration-summary.sh
```

### Utility Scripts

#### `create-agent-api-key.sh`
Creates a new API key with limited permissions for your agent:

```bash
./create-agent-api-key.sh
```

## Registration Flow

1. **Configure Agent**: Edit `register-payload.json` with your agent details
2. **Register**: Run `./register-agent-simple.sh`
3. **Wait**: Registration takes 1-5 minutes to confirm on-chain
4. **Check Status**: Run `./check-registration-status.sh`
5. **Get Identifier**: Once confirmed, find your `agentIdentifier` in `agent-identifier.txt`

## Important Files

- `register-payload.json` - Agent configuration for registration
- `registration-response.json` - Response from registration request
- `agent-identifier.txt` - Your on-chain agent identifier (created after confirmation)

## API Endpoints

- **Registration**: `POST http://localhost:3001/api/v1/registry/`
- **Query Registry**: `POST http://localhost:3000/api/v1/registry-entry`
- **Payment Info**: `GET http://localhost:3000/api/v1/payment-information`

See [MASUMI_API_ENDPOINTS.md](../docs/MASUMI_API_ENDPOINTS.md) for complete API documentation.

## Troubleshooting

- **"Can not POST /registry/"**: Make sure to use the full path `/api/v1/registry/`
- **401 Unauthorized**: Check your API key in `.env`
- **Agent not found**: Wait a few minutes for blockchain confirmation
- **Scripts not executable**: Run `chmod +x *.sh` in Git Bash 