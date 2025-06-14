# Masumi Environment Variables Setup (Local Docker)

This document outlines the environment variables needed for Masumi integration using the local Docker setup.

## Prerequisites

First, ensure Masumi services are running:

```bash
# Check if Docker services are running
docker compose ps

# If not running, start them:
cd masumi-services
docker compose up -d
```

## Required Environment Variables

Add these to your `.env` file:

```env
# Masumi Local Configuration
VITE_MASUMI_PAYMENT_URL=http://localhost:3001
VITE_MASUMI_REGISTRY_URL=http://localhost:3000
VITE_MASUMI_API_KEY=your_pay_scoped_api_key
VITE_MASUMI_VKEY=your_selling_wallet_vkey
VITE_MASUMI_NETWORK=Preprod

# Admin wallet for special features
VITE_ADMIN_WALLET_ADDRESS=your_cardano_wallet_address
```

## Getting Your API Credentials

### Quick Setup (Recommended)

Use our automated script to get both credentials:

```powershell
# Windows
.\scripts\setup-masumi-credentials.ps1

# Linux/Mac
./scripts/setup-masumi-credentials.sh
```

### Manual Setup via Admin Dashboard

1. **Access the Local Admin Dashboard**:
   - URL: http://localhost:3001/admin
   - Login with your ADMIN_KEY (from `masumi-services/.env`)

2. **Get Selling Wallet VKey**:
   - Navigate to `Wallets → Selling`
   - Copy the "Public vkey" value

3. **Generate PAY-scoped API Key**:
   - Navigate to `API Keys → New Key`
   - Set Permission = `ReadAndPay`
   - Keep networkLimit = `Preprod`
   - Click Create

### Manual Setup via REST API

```bash
# Get Selling Wallet VKey
curl -X GET "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1" \
  -H "token: YOUR_ADMIN_KEY"

# Generate PAY-scoped API Key
curl -X POST "http://localhost:3001/api/v1/api-key" \
  -H "Content-Type: application/json" \
  -H "token: YOUR_ADMIN_KEY" \
  -d '{
    "permission": "ReadAndPay",
    "usageLimited": false,
    "networkLimit": ["Preprod"]
  }'
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Registry API | http://localhost:3000 | Agent registration |
| Registry Docs | http://localhost:3000/docs | API documentation |
| Payment API | http://localhost:3001 | Payments & API keys |
| Payment Docs | http://localhost:3001/docs | API documentation |
| Admin Dashboard | http://localhost:3001/admin | Web interface |

## Testing Your Setup

1. **Check if services are healthy**:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3001/health
   ```

2. **Verify API key works**:
   ```bash
   curl -H "token: YOUR_PAY_API_KEY" \
     http://localhost:3000/registry
   ```

3. **Check wallet info**:
   ```bash
   curl -H "token: YOUR_ADMIN_KEY" \
     "http://localhost:3001/api/v1/wallet?walletType=Selling&id=1"
   ```

## Common Issues

### Can't access dashboard
- Make sure Docker services are running: `docker compose ps`
- Check logs: `docker compose logs payment`
- Verify ports 3000/3001 aren't already in use

### "401 Unauthorized"
- Wrong API key or insufficient permissions
- Admin operations require ADMIN key, not PAY key

### "403 Forbidden"
- Make sure to use `token:` header, not `Authorization:`
- Example: `-H "token: YOUR_KEY"`

### Services not starting
- Check Docker Desktop is running
- Ensure you're in the `masumi-services` directory
- Try: `docker compose down -v && docker compose up -d`

## Funding Your Wallet (Preprod)

For testnet deployment, you need test ADA:
1. Get your wallet address from the dashboard or API
2. Use the [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
3. Request test ADA (minimum 10 ADA recommended)

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to version control
- The PAY key has limited permissions but keep it secure
- The VKey is public information (safe to expose)
- The ADMIN key should never be exposed

## Next Steps

After setting up environment variables:
1. Test agent creation from the Dashboard
2. Verify agent gets registered with Masumi
3. Check that the payment flow works correctly

For more details, see:
- [Masumi Docker Setup Guide](./MASUMI_DOCKER_SETUP.md)
- [Masumi Credentials Guide](./MASUMI_CREDENTIALS_GUIDE.md) 