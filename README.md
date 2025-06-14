````markdown
# 🛠️ AI-Agent Help-Desk Portal

A full-stack template that lets any SaaS or Web 3 project **sell, create, and operate custom AI tech-support agents** in minutes.  
Built with **Lovable.dev UI → Supabase Auth & DB → Stripe Billing → Masumi-backed AI micro-services**, all deployable to **Vercel** out-of-the-box.

📚 **[Quick Start Guide](./QUICKSTART.md)** - Get running in 5 minutes!

---

## ✨ Key Features

| Area | What You Get |
|------|--------------|
| **1 · Landing & Billing** | ⤷ Sign-Up / Login via Supabase Auth (Email + Google OAuth)<br>⤷ Stripe **Payment Links** for subscription checkout<br>⤷ One paid plan = **1 customizable AI support agent** |
| **2 · Agent Builder** | ⤷ Form to **name, describe, and brand** the agent<br>⤷ Drag-&-drop docs / PDFs → stored in Supabase Storage<br>⤷ Auto-generates the prompt-template that powers the agent |
| **3 · Help-Desk Console** | ⤷ **Real-time chat widget** with thumbs up/down rating<br>⤷ **Ticket form** → POST `/new_ticket` (name / email / issue)<br>⤷ **Live sentiment tracker** with real-time updates<br>⤷ **Chat history** with sentiment scores<br>⤷ **Sentiment simulation** for testing (3 scenarios) |
| **UI / UX** | ⤷ Tailwind CSS, Dark-Mode **default** (toggle in header)<br>⤷ Mobile-first, keyboard-accessible |
| **Ops** | ⤷ **Supabase**: Auth, `tickets` table, file storage<br>⤷ **Stripe**: webhooks → Supabase row `is_active = true`<br>⤷ **Vercel**: zero-config deploy (front-end + serverless API routes) |

---

## 🏗️ Stack & Architecture

```txt
┌─────────────────┐     AI Config      ┌──────────────────────┐
│   Vite + React  │ ──────────────────▶│ Flux Point Studios   │
│   (Frontend)    │                    │    AI Service        │
└────────┬────────┘                    └──────────────────────┘
         │                                        
         │ Supabase SDK                          
         ▼                                       
┌─────────────────┐     Register       ┌──────────────────────┐
│    Supabase     │ ──────────────────▶│   Masumi Network     │
│  (Auth/DB/Store)│                    │  Registry + Payment  │
└─────────────────┘                    └──────────────────────┘
         │                                        │
         │                                        │ On-chain
         ▼                                        ▼
┌─────────────────┐                    ┌──────────────────────┐
│     Stripe      │                    │  Cardano Blockchain  │
│   (Payments)    │                    │   (Agent Registry)   │
└─────────────────┘                    └──────────────────────┘
````

* **Vite + React 18** – Fast development with HMR
* **Tailwind CSS** – Modern styling with dark mode
* **Supabase** – Auth, PostgreSQL (`agents`, `tickets`), file storage
* **Stripe** – Subscription billing (optional with admin mode)
* **Flux Point Studios** – AI agent configuration service
* **Masumi Network** – Decentralized agent registry on Cardano

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Docker Desktop** (for Masumi services)
- **Git** with submodule support
- **Cardano Wallet** (Eternl, Nami, Yoroi, etc.)
- **Blockfrost API Key** (free tier at [blockfrost.io](https://blockfrost.io/))

## 🚀 Getting Started

### 1 · Clone & Install

```bash
git clone https://github.com/your-org/helpdesk-ai-portal
cd helpdesk-ai-portal
git submodule update --init --recursive  # Get Masumi services
npm install          # or pnpm / yarn
```

### 2 · Masumi Services Setup (Docker Compose)

The Masumi services are included as a git submodule. Set them up with our automated script:

**Windows (PowerShell):**
```powershell
.\scripts\setup-masumi.ps1
```

**Linux/Mac:**
```bash
./scripts/setup-masumi.sh
```

This script will:
- Create `.env` file with auto-generated keys
- Start Docker containers
- Wait for services to be healthy

**Important:** After running, update `masumi-services/.env` with your Blockfrost API key from [blockfrost.io](https://blockfrost.io/)

Generate a PAY-scoped API key:
```powershell
# Windows
.\scripts\generate-masumi-key.ps1

# Linux/Mac
./scripts/generate-masumi-key.sh
```

### 3 · Environment Variables

Create `.env` file (see [docs/ENV_TEMPLATE.md](docs/ENV_TEMPLATE.md) for full template):

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Flux Point AI Service
VITE_AGENT_API_URL=https://api.fluxpointstudios.com/chat
VITE_AGENT_API_KEY=your_api_key

# Masumi
VITE_MASUMI_PAYMENT_URL=http://localhost:3001
VITE_MASUMI_REGISTRY_URL=http://localhost:3000
VITE_MASUMI_API_KEY=your_pay_scoped_key
VITE_MASUMI_VKEY=your_selling_wallet_vkey
VITE_MASUMI_NETWORK=Preprod

# Admin
VITE_ADMIN_WALLET_ADDRESS=your_cardano_address
```

### 4 · Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. **Authentication** → Enable Email provider
3. **SQL Editor** → Run migrations:
   ```sql
   -- Run these in order:
   supabase/migrations/20240101000000_create_tickets_table.sql
   supabase/migrations/20240315000000_create_agents_table.sql
   supabase/migrations/20240315000001_create_storage_buckets.sql
   ```
4. Copy URL and anon key to `.env`

### 5 · Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Create a Product and Price for subscriptions
3. Add webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Copy keys to `.env`

### 6 · Run Development Server

```bash
npm run dev
```

Visit http://localhost:8081 (Vite's default port)

### 7 · Test the Flow

1. Connect a Cardano wallet (Eternl, Nami, etc.)
2. Create an AI agent:
   - Describe your business
   - Let AI generate suggestions
   - Upload documentation
   - Click "Create AI Agent"
3. Agent will be registered with Masumi network
4. Access the support portal to test your agent

---

## 📁 Project Structure

```
/app            Next.js pages & components
  ├─ /auth      sign-up / log-in flows
  ├─ /agent     builder UI
  └─ /helpdesk  chat + ticket dashboard

/api            Next.js edge functions (Stripe webhook, proxy)
/agent-backend  FastAPI + crew_definition.py (FAQ, Triage, Sentiment agents)
/sql            tickets table schema
/tailwind.config.ts
```

---

## 🧪 Testing Checklist

* [ ] Stripe test checkout completes and `is_active` flag flips in Supabase
* [ ] Uploading a PDF stores file in `agent-docs` bucket
* [ ] AI agent creation registers with Masumi network
* [ ] Ticket form inserts row → shows in Supabase dashboard
* [ ] Dark / Light toggle persists via `localStorage`
* [ ] **Sentiment Simulation**: Run `window.sentimentTests.runAllTests()` in console
* [ ] Chat thumbs up/down updates Live Sentiment gauge in real-time
* [ ] Closed chats appear in Chat History with sentiment scores

---

## 📦 Deployment

```bash
# Front-end
vercel --prod        # or push to GitHub + Vercel integration

# Agent back-end
fly deploy           # Dockerfile provided (or Render / Railway)
```

Add the deployed URLs to **Supabase → Auth → Site URL** *and* Google OAuth credentials.

---

## 🤝 Contributing

1. Fork → create feature branch → pull request.
2. Follow **Conventional Commits**.
3. Run `pnpm lint && pnpm test` before PR.

---

## 🛡️ License

MIT © 2025 Flux Point Studios, Inc.

---

> **Need help?** Pop into our Discord `#helpdesk-portal` channel or open an issue.  Happy hacking!

```
```
