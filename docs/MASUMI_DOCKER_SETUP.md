# Masumi Docker-Compose Setup Guide

This guide walks through setting up the Masumi services (Registry + Payment) required for the AI Agent creation flow.

## Prerequisites

- Docker and Docker Compose installed
- Blockfrost API key for Cardano Preprod testnet
- Git with submodule support

## Quick Setup (Recommended)

The Masumi services are included as a git submodule. Use our automated scripts:

### Windows (PowerShell):
```powershell
.\scripts\setup-masumi.ps1
```

### Linux/Mac:
```bash
./scripts/setup-masumi.sh
```

This will automatically:
- Create `.env` with generated encryption and admin keys
- Start all Docker containers
- Wait for services to be healthy

## 2. Setup Masumi Credentials

After services are running, you need to get two values:
- **PAY-scoped API Key**: For agent registration
- **Selling Wallet VKey**: For receiving payments

### Quick Setup (Recommended):
```powershell
# Windows - Get both credentials at once
.\scripts\setup-masumi-credentials.ps1

# Linux/Mac - Get both credentials at once
./scripts/setup-masumi-credentials.sh
```

This script will:
- Fetch the Selling wallet verification key
- Generate a new PAY-scoped API key
- Display both values
- Offer to update your `.env` file automatically

### Alternative: Get credentials separately
```powershell
# Windows
.\scripts\get-masumi-vkey.ps1       # Get wallet vkey
.\scripts\generate-masumi-key.ps1   # Generate API key

# Linux/Mac
./scripts/get-masumi-vkey.sh        # Get wallet vkey
./scripts/generate-masumi-key.sh    # Generate API key
```

## Manual Setup

If you prefer to set up manually:

### Step 1: Initialize the submodule
```bash
git submodule update --init --recursive
cd masumi-services
```

### Step 2: Copy and configure environment
```bash
cp .env.example .env
```

### Step 3: Generate encryption key
```bash
openssl rand -hex 16
```
Copy the output and set it as `ENCRYPTION_KEY` in your `.env` file.

### Step 4: Configure required environment variables

Edit `.env` and set:

```env
# Encryption key (from step 3)
ENCRYPTION_KEY=your_generated_key_here

# Blockfrost API key for Preprod testnet
BLOCKFROST_API_KEY_PREPROD=your_blockfrost_key_here

# Admin key (minimum 15 characters)
ADMIN_KEY=your_secure_admin_key_here

# Port configuration (optional, if defaults conflict)
REGISTRY_PORT=3000
PAYMENT_PORT=3001
```

### Step 5: Start the Docker stack
```bash
docker compose up -d
```

This will start:
- PostgreSQL database
- Registry Service (port 3000)
- Payment Service (port 3001)

### Step 6: Verify services are running
- Registry docs: http://localhost:3000/docs
- Payment docs: http://localhost:3001/docs
- Admin UI: http://localhost:3001/admin

### Manual credential retrieval

If you prefer to use the Admin UI or REST API directly:

#### Option A: Admin UI
1. Open http://localhost:3001/admin
2. Login with your ADMIN_KEY
3. **Get VKey**: Go to Wallets → Selling → Copy the "Public vkey"
4. **Get API Key**: Go to API Keys → New Key → Choose Permission = ReadAndPay → Create

#### Option B: REST API

**Get Selling Wallet VKey:**
```bash
curl -X GET "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1" \
  -H "token: YOUR_ADMIN_KEY"
# Response includes: walletVkey and walletAddress
```

**Generate PAY-scoped API key:**
```bash
curl -X POST "http://localhost:3001/api/v1/api-key" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_ADMIN_KEY" \
  -d '{
    "permission": "ReadAndPay",
    "usageLimited": false,
    "networkLimit": ["Preprod"]
  }'
# Response includes: data.token
```

**Important Notes:**
- The `token:` header is required (not `Authorization:`)
- You need ADMIN permission to create new API keys
- PAY-scoped keys (ReadAndPay) can register agents but cannot create new keys/wallets

## 3. Environment Variables for Your Application

Add these to your application's `.env`:

```env
# Masumi Service URLs
VITE_MASUMI_PAYMENT_URL=http://localhost:3001
VITE_MASUMI_REGISTRY_URL=http://localhost:3000
VITE_MASUMI_NETWORK=Preprod

# Masumi Credentials (from step 2)
VITE_MASUMI_API_KEY=your_pay_scoped_api_key_here    # From generate-masumi-key script
VITE_MASUMI_VKEY=your_selling_wallet_vkey_here      # From get-masumi-vkey script

# Other required variables
VITE_ADMIN_WALLET_ADDRESS=your_cardano_wallet_address
```

**Where these values come from:**
- `VITE_MASUMI_API_KEY`: Created via `/api/v1/api-key` endpoint with ReadAndPay permission
- `VITE_MASUMI_VKEY`: Retrieved via `/api/v1/wallet?walletType=Selling&id=1`

## 4. Common Issues and Solutions

### Ports already in use
Edit `docker-compose.yml` and change `REGISTRY_PORT` and `PAYMENT_PORT` to available ports.

### Wallet shows PendingTransaction forever
- Check Blockfrost API key is correct
- Verify wallet is funded
- Ensure you're using Preprod network

### Authentication errors (401/403)
- Always use `token:` header (not `Authorization:`)
- Use PAY-scoped key for registry operations, not ADMIN key

### Services fail to start
Start containers in order:
```bash
docker compose up -d postgres
# Wait 10 seconds
docker compose up -d registry
# Wait 10 seconds
docker compose up -d payment
```

## 5. Integration with Agent Creation Flow

Your backend should:

1. Verify user's Stripe subscription
2. Generate agent configuration and spin up container
3. Register agent with Masumi:

```typescript
const response = await fetch(`${MASUMI_PAYMENT_URL}/api/v1/registry/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'token': MASUMI_PAY_API_KEY  // Must use 'token' header
  },
  body: JSON.stringify({
    name: agentName,
    api_url: agentApiUrl,
    pricing: {
      amount: 1000000,  // in lovelace
      currency: "ADA"
    },
    description: agentDescription,
    category: "AI_ASSISTANT"
  })
});

const data = await response.json();
const agentIdentifier = data.data.agentIdentifier;
```

4. Poll registry until state is 'Registered':

```typescript
const checkStatus = async (agentId: string) => {
  const response = await fetch(`${MASUMI_REGISTRY_URL}/registry/${agentId}`);
  const data = await response.json();
  return data.state === 'Registered';
};
```

5. Save agentIdentifier and container URL to database

## 6. Production Considerations

- Use proper secrets management for keys
- Set up monitoring for container health
- Configure proper CORS headers
- Use HTTPS for all endpoints
- Implement proper error handling and retries
- Set up automated backups for PostgreSQL

## 7. Useful Commands

### View logs
```bash
docker compose logs -f registry
docker compose logs -f payment
```

### Restart services
```bash
docker compose restart
```

### Stop everything
```bash
docker compose down
```

### Reset everything (WARNING: destroys data)
```bash
docker compose down -v
``` 