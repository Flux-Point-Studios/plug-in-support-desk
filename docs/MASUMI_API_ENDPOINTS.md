# Masumi API Endpoints Reference

This document clarifies the correct API endpoints for Masumi services based on testing and official documentation.

## Service URLs

| Service | Port | Base URL | Documentation |
|---------|------|----------|---------------|
| **Payment Service** | 3001 | `http://localhost:3001/api/v1` | http://localhost:3001/docs |
| **Registry Service** | 3000 | `http://localhost:3000/api/v1` | http://localhost:3000/docs |

## Key Endpoints

### 1. Agent Registration (CREATE)
- **Service**: Payment Service
- **Endpoint**: `POST /api/v1/registry/`
- **Authentication**: Requires API key with `+PAY` scope
- **Purpose**: Register a new agent on the Masumi network

```bash
curl -X POST "http://localhost:3001/api/v1/registry/" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_API_KEY" \
  -d @register-payload.json
```

### 2. Query Registry (READ)
- **Service**: Registry Service
- **Endpoint**: `POST /api/v1/registry-entry`
- **Authentication**: Requires API key with `+user` scope
- **Purpose**: Search for existing agents in the registry

```bash
curl -X POST "http://localhost:3000/api/v1/registry-entry" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_API_KEY" \
  -d '{
    "network": "Preprod",
    "limit": 10,
    "filter": {
      "name": "Agent Name"
    }
  }'
```

### 3. Payment Information
- **Service**: Registry Service
- **Endpoint**: `GET /api/v1/payment-information`
- **Authentication**: Requires API key with `+user` scope
- **Purpose**: Get payment details for a specific agent

```bash
curl -X GET "http://localhost:3000/api/v1/payment-information?agentIdentifier=YOUR_AGENT_ID" \
  -H "token: YOUR_API_KEY"
```

## Registration Payload Structure

The correct payload structure for agent registration:

```json
{
  "network": "Preprod",
  "name": "Agent Name",
  "description": "Agent description",
  "Tags": ["tag1", "tag2"],
  "ExampleOutputs": [],
  "Author": {
    "name": "Author Name",
    "email": "email@example.com"
  },
  "Legal": {
    "terms": "https://example.com/terms",
    "privacy": "https://example.com/privacy"
  },
  "apiBaseUrl": "http://localhost:8000",
  "Capability": {
    "name": "Capability Name",
    "version": "1.0.0"
  },
  "AgentPricing": {
    "pricingType": "Fixed",
    "Pricing": [
      {
        "unit": "",        // Empty string for ADA on Preprod
        "amount": "1000000" // Amount in lovelace (1 ADA = 1,000,000 lovelace)
      }
    ]
  },
  "sellingWalletVkey": "YOUR_SELLING_WALLET_VKEY",
  "paymentContractAddress": "OPTIONAL_CONTRACT_ADDRESS"
}
```

## Common Mistakes to Avoid

1. **Wrong Service**: Don't use Registry Service for registration - it's read-only
2. **Missing API prefix**: Always include `/api/v1` in the URL path
3. **Wrong field names**: Use exact field names (e.g., `Tags` not `tags`, `AgentPricing` not `pricing`)
4. **Network parameter**: Include in JSON body, not as query parameter
5. **Authentication**: Use `token:` header, not `Authorization:`

## Registration Flow

1. **Submit Registration** → Payment Service returns `state: "RegistrationRequested"`
2. **Wait for Blockchain** → Transaction needs to be mined (1-5 minutes on Preprod)
3. **Check Status** → Query Registry Service to confirm `agentIdentifier` appears
4. **Save Identifier** → Store the `agentIdentifier` for future use

## Testing Tools

Scripts in `agent-wrapper/`:
- `register-agent-simple.sh` - Register an agent
- `check-registration-status.sh` - Check if registration is confirmed
- `registration-summary.sh` - Get complete registration details 