# 🚀 Quick Start Guide

Get the AI HelpDesk Portal running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Docker Desktop running
- [ ] Git installed
- [ ] Cardano wallet browser extension (Eternl recommended)

## Step 1: Clone and Install

```bash
git clone https://github.com/your-org/helpdesk-ai-portal
cd helpdesk-ai-portal
git submodule update --init --recursive
npm install
```

## Step 2: Get Required API Keys

1. **Blockfrost API Key** (for Masumi)
   - Go to [blockfrost.io](https://blockfrost.io/)
   - Sign up for free account
   - Create a Preprod project
   - Copy the API key

2. **Flux Point Studios API Key**
   - Contact Flux Point Studios
   - Get your API key for the AI service

## Step 3: Setup Masumi Services

### Windows:
```powershell
.\scripts\setup-masumi.ps1
```

### Mac/Linux:
```bash
./scripts/setup-masumi.sh
```

When prompted, add your Blockfrost API key to `masumi-services/.env`

## Step 4: Configure Environment

Create `.env` file in the root directory:

```env
# Supabase (we'll set these up next)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Flux Point AI
VITE_AGENT_API_URL=https://api.fluxpointstudios.com/chat
VITE_AGENT_API_KEY=your_flux_point_api_key

# Admin wallet (your Cardano wallet address)
VITE_ADMIN_WALLET_ADDRESS=addr1_your_wallet_address
```

## Step 5: Get Masumi Credentials

You need two values from Masumi: an API key and the selling wallet vkey.

### Windows:
```powershell
.\scripts\setup-masumi-credentials.ps1
```

### Mac/Linux:
```bash
./scripts/setup-masumi-credentials.sh
```

This will:
- Fetch the selling wallet verification key
- Generate a PAY-scoped API key 
- Add both `VITE_MASUMI_API_KEY` and `VITE_MASUMI_VKEY` to your `.env` file

## Step 6: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. In your project dashboard:
   - Go to Settings → API
   - Copy the Project URL and anon key to your `.env`
3. Run the database migrations:
   - Go to SQL Editor
   - Run each file in `supabase/migrations/` in order

## Step 7: Start the App

```bash
npm run dev
```

Visit http://localhost:8081

## 🎉 You're Ready!

1. Connect your Cardano wallet
2. Create your first AI agent
3. Upload some documentation
4. Watch as it gets registered on the Masumi network!

## Troubleshooting

### Docker not running?
Make sure Docker Desktop is started before running Masumi setup.

### Port conflicts?
If ports 3000/3001 are in use, edit `masumi-services/docker-compose.yml`

### Wallet not connecting?
- Make sure you're on Cardano Preprod network
- Try refreshing the page
- Check browser console for errors

## Need Help?

- Check the [full documentation](./README.md)
- Review [Masumi setup guide](./docs/MASUMI_DOCKER_SETUP.md)
- Read the [Sentiment Simulation Guide](./docs/SENTIMENT_SIMULATION_GUIDE.md)
- Open an issue on GitHub 