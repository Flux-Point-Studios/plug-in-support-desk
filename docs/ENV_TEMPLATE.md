# Environment Variables Template

Copy these variables to your `.env` file and fill in the values:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Flux Point Studios AI Service
VITE_AGENT_API_URL=https://api.fluxpointstudios.com/chat
VITE_AGENT_API_KEY=your_flux_point_api_key

# Masumi Network Configuration
VITE_MASUMI_PAYMENT_URL=http://localhost:3001
VITE_MASUMI_REGISTRY_URL=http://localhost:3000
VITE_MASUMI_API_KEY=your_masumi_pay_api_key
VITE_MASUMI_VKEY=your_selling_wallet_vkey
VITE_MASUMI_NETWORK=Preprod

# Admin Wallet Configuration (for admin features)
VITE_ADMIN_WALLET_ADDRESS=your_admin_wallet_address

# Development Settings
NODE_ENV=development

# Production URLs (when deploying)
# VITE_APP_URL=https://yourdomain.com
```

## Getting the Values

### Supabase
1. Create a project at https://supabase.com
2. Copy the URL and anon key from Project Settings > API

### Stripe
1. Get keys from https://dashboard.stripe.com/test/apikeys
2. Create webhook endpoint pointing to `/api/stripe/webhook`
3. Copy the webhook signing secret

### Flux Point Studios AI
1. Contact Flux Point Studios for API access
2. Get your API key from their dashboard

### Masumi Network
1. Follow the [Masumi Docker Setup Guide](./MASUMI_DOCKER_SETUP.md)
2. Get both required credentials using the setup script:
   ```bash
   # Windows
   .\scripts\setup-masumi-credentials.ps1
   
   # Linux/Mac
   ./scripts/setup-masumi-credentials.sh
   ```
   
   Or manually:
   - **API Key**: Create via POST to `/api/v1/api-key` with `permission: "ReadAndPay"`
   - **VKEY**: Fetch via GET to `/api/v1/wallet?walletType=Selling&id=1`
   
   Note: Always use `token:` header (not `Authorization:`) for authentication

### Admin Wallet
1. Use any Cardano wallet address you control
2. This wallet will have admin privileges in the system 