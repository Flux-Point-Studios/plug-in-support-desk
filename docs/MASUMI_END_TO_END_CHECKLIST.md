# Deploying an AI Agent on Masumi (Preprod Testnet) – Comprehensive Checklist & Playbook

## 1. Preprod Setup: Prerequisites & Existing Components

Before proceeding to deployment, ensure you have all **prerequisites and initial components in place** from previous steps:

* **Blockfrost API Key (Preprod)** – You should have a Blockfrost API key for Cardano’s Preprod network (e.g. obtained by creating a project for *Cardano Preprod* on blockfrost.io). This will allow the Masumi services to interact with the blockchain without running a full node.
* **Masumi Services Docker Stack** – The Masumi “node” (Payment Service + Registry Service + Postgres DB) should be set up, preferably via the provided Docker Compose quickstart. If not already done, clone the Masumi quickstart repository and copy the `.env.example` to `.env` for configuration. You’ll need Docker and Docker Compose installed.
* **Configured `.env` for Masumi Node** – In the `.env` for the Docker stack, you should have set at minimum:

  * `ADMIN_KEY` – an admin API token (at least 15 characters) for the Masumi node.
  * `ENCRYPTION_KEY` – a 32‐hex-character secret for encrypting wallet secrets in the DB (you can generate one with `openssl rand -hex 16`).
  * `BLOCKFROST_API_KEY_PREPROD` – your Blockfrost Preprod API key.
  * (Any database connection settings needed, if not using defaults.)
  * Leave wallet mnemonics blank for now if you want the node to generate new wallets on first launch (or provide your own seed phrases if reusing wallets; more on this in Step 3 below).
* **Masumi Payment Service & Registry Service Running** – After configuring the env file, you should start the Docker Compose stack. Run `docker compose up -d` (ensuring Docker is running). This will launch:

  * **Postgres** (database) on port 5432.
  * **Registry Service** on port 3000 (OpenAPI docs at **`http://localhost:3000/docs`**).
  * **Payment Service** on port 3001 (OpenAPI docs at **`http://localhost:3001/docs`** and an Admin web UI at **`http://localhost:3001/admin`**).
* **Crew/Agent Service Created** – You should have your AI agent (CrewAI or other framework) code set up and running behind a REST API that implements Masumi’s Agentic Service API (MIP-003). If you followed the CrewAI quickstart:

  * You cloned the CrewAI Masumi template and set up a Python virtual environment.
  * You ensured the agent exposes endpoints like `/start_job`, `/status`, `/availability`, etc. via FastAPI (the template’s `main.py` handles this).
  * The agent can be started with `python main.py api` to listen (default on port 8000). Verify the agent’s docs at **`http://localhost:8000/docs`** and test basic endpoints (e.g. GET `/input_schema`, GET `/availability`) to confirm it’s running.
* **Supabase & Frontend (if applicable)** – For your private UI, ensure you have a Supabase instance set up (for example, for agent metadata or user management) and a Vite-built frontend ready. At minimum:

  * Supabase project credentials (URL and anon/public API key) should be integrated into your frontend (usually via environment variables like `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
  * If using Supabase Auth (e.g. Google OAuth), configure the provider in Supabase (e.g. supply Google Client ID/Secret and correct redirect URL).
  * The frontend should be configured to communicate with your agent’s API (and not the public Masumi Explorer). For example, if your agent API runs on a server, update the base URLs in your frontend to point to that (consider CORS settings if calling from the browser).

**Verification:** At this stage, *before* registering or transacting, you should confirm that:

* The Masumi Payment Service API is reachable. For example, a GET request to `/api/v1/health` on the Payment Service should return a JSON `{"status":"ok"}` if the server is up.
* The Masumi Registry Service API is reachable (check `http://localhost:3000/api/v1/health` similarly).
* The Payment Service’s **Admin UI** (`localhost:3001/admin`) loads. On first run, the Payment Service automatically seeds an admin API key (from `ADMIN_KEY`) and typically **auto-generates** a set of wallets for each supported network (Preprod and Mainnet). In the Admin UI under “Contracts”, you should see a **Preprod contract** section with a *Purchasing Wallet* and *Selling Wallet* already created (IDs and addresses listed). If the wallets did **not** auto-create or the admin key wasn’t seeded, a common fix is to restart the containers in order – Postgres → Registry → Payment – giving each a few seconds to initialize. (Ensure `ADMIN_KEY` meets length requirements and was in env before launching.)

> **Note:** Masumi strongly recommends doing all development and testing on **Preprod** (the Cardano testnet environment) before even considering Mainnet. Preprod uses **test ADA (tADA)** which has no real value and can be freely obtained, allowing full end-to-end tests with zero risk. This guide focuses on Preprod setup; any references to ADA mean *test* ADA on Preprod.

## 2. Masumi Node Configuration – Payment & Registry Services

Now we detail the **Masumi Node** components and how to configure them for a production-ready Preprod deployment:

* **Payment Service** – This is the on-chain transaction manager for agent payments. Running your own Payment Service instance is **required** to sell or purchase services. Key points:

  * It manages blockchain **wallets** (see Step 3) and handles creating payment transactions (locking funds in the escrow contract, releasing funds on completion, handling refunds, etc.).
  * It provides a REST API (under `http://localhost:3001/api/v1/...`) for operations like creating payment requests, checking payment status, etc., and an easy-to-use **Admin Dashboard** for managing wallets and configuration.
  * It batches transactions by default – instead of submitting each on-chain transaction immediately, it groups them to run every few minutes (4 minutes by default, configurable via `BATCH_PAYMENT_INTERVAL` in the env). This improves performance and reduces fees, but means that certain actions (like finalizing payments) may not appear on-chain instantaneously. Keep this in mind during testing (you can adjust the interval in `.env` if needed).
  * **API Access:** The Payment Service uses token-based auth. The `ADMIN_KEY` you set is essentially an all-powerful API key for this service. For production usage, **do NOT expose the admin key** in client-side code. Instead, use it server-side or create scoped API keys with only needed permissions (via the `/api/v1/api-key` endpoint). For example, you might generate a key that only allows creating/checking payments and use that in your agent backend (we’ll do this after registering the agent).
* **Registry Service** – This service indexes on-chain registry data (agent listings, identities, etc.) for easy querying. It is essentially a read-only service; it does **not** hold private keys or create transactions. Its main purpose is to let agents or UIs discover agents and their details via a simple API (rather than directly scraping the blockchain).

  * Running your own Registry Service is **optional** – Masumi provides a hosted registry API as a service (with an API key and credit system) if you choose not to run the component locally. However, the Docker setup includes it for local usage.
  * The Registry API also requires an API key (`token` header) for requests. The admin key from `.env` is initially loaded into the registry DB as well. Again, best practice is to use the admin key only to create a secondary API key with limited scope for your application’s read needs.
* **PostgreSQL Database** – The database stores all Masumi node state (wallet keys encrypted, pending payments, agent registry entries cache, API keys, etc.). In the Docker setup, Postgres runs with default credentials (check `.env.example` for `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc., or see the compose file). Ensure the DB is running and reachable by the services. On first launch, the Payment Service will auto-migrate the schema and generate initial data (like creating the default wallets and admin key entry).

**Configuration Steps Recap:**

1. **Clone & Configure**: *(Already done)* Cloned `masumi-services-dev-quickstart` and copied `.env.example` to `.env`. Entered the `ADMIN_KEY`, `ENCRYPTION_KEY`, Blockfrost key, etc.. Double-check these values are correct and present.
2. **Launch Services**: Started the services via Docker Compose. Verify all three containers (postgres, registry-service, payment-service) are healthy. If not:

   * Use `docker compose logs payment-service` (and registry) to see if any errors (e.g. Blockfrost misconfigured, missing env, etc.). Common issues include forgetting to set the Blockfrost key or using an admin key that’s too short (which might cause the service to refuse start).
   * If wallets failed to generate (no addresses in admin UI), bring down the stack and try starting one container at a time with delays (sometimes needed on slower machines).
3. **Access Admin UI**: Open `http://localhost:3001/admin`. You should see the **Masumi Admin Dashboard**. Under **“Contracts”** → **Preprod**, you’ll find:

   * **Purchasing Wallet** – used to pay for other agents’ services (when your agent is a buyer).
   * **Selling Wallet** – used to receive payments for your agent’s services (when your agent is a seller).
   * **Collection Wallet** – initially none; this is optional for gathering revenue (we’ll discuss in Step 3, but not needed on testnet).
     Each wallet shows an **Address** (starts with `addr_test...` on Preprod) and you have options to *Copy* the address, *Top up*, *Export* seed, etc.
4. **Admin API Key**: Note that the Admin UI is accessible without a password because it’s assumed to be local. However, any API calls (like via curl or from your agent code) must include the `token: <YOUR_ADMIN_KEY>` header to authenticate. We will generate a safer key for the agent soon, but you can test using the admin key for now in a controlled environment.

At this point, **all Masumi services should be running and configured for Preprod**. The system is essentially in a “ready but idle” state – wallets exist but are empty, no agent is registered in the network yet, and no payments have been made. Next, we will fund the wallets with tADA and integrate the agent.

## 3. Wallet Management on Preprod (Using tADA)

Masumi uses three types of wallets for an Agentic Service:

* **Selling Wallet** – Holds funds you **earn** from others when your agent is hired. It’s also the wallet that will lock funds in the smart contract when *your agent* is the seller of a service (others pay into an escrow where your selling wallet is the beneficiary).
* **Purchasing Wallet** – Holds funds you use to **pay** others when your agent wants to purchase another agent’s service. It’s the source of funds when your agent acts as a client (for agent-to-agent payments).
* **Collection Wallet** – (Optional) A separate wallet *you control* where you can periodically sweep profits from the Selling wallet, or top-up the Purchasing wallet. This wallet’s keys are not held by the Masumi node – only the address is configured – so it’s safer for storing larger balances. In practice, on **Preprod** you can ignore the collection wallet (you can simply leave `COLLECTION_WALLET_PREPROD_ADDRESS` empty). For Mainnet, configuring a collection wallet is strongly recommended for security (so the hot wallets don’t accumulate too much value).

**Funding the Testnet Wallets:** On Preprod, ADA has no real value and can be obtained from a faucet freely. Here’s how to fund your wallets with **Test ADA (tADA)**:

1. **Copy Wallet Addresses:** In the Admin Dashboard, under Preprod Contract, find the **Purchasing Wallet**. Click **“Copy”** to copy its address to clipboard. Do the same for the **Selling Wallet** address.
2. **Use the Cardano Faucet:** Open the Cardano Testnet Faucet page (Masumi’s docs link to it, or go to the official Cardano Preprod faucet site). On the faucet page:

   * Select **“Preprod Testnet”** as the network environment.
   * Paste your **Purchasing Wallet** address into the form and request funds.
   * Repeat the process for the **Selling Wallet** address.
     The faucet will send a fixed amount of tADA to each (often 10000 tADA per request).
3. **Verify Deposits:** Back in the Masumi Admin UI, after a minute or two, you should see the wallet balances update. For example, you might see **10,000 Test-ADA** in the Purchasing Wallet after the faucet transaction confirms. Likewise, ensure the Selling Wallet shows a balance (do one wallet at a time if the faucet only allows a single request per hour, or use multiple faucets).

   * You can also verify on Cardano’s explorer (Preprod network) by searching the wallet addresses, or check the Payment Service API: a GET to `/api/v1/wallets?network=Preprod` would list wallet balances.
4. **Persisting Wallet Keys:** By default, the wallets generated by the Payment Service are ephemeral (in-memory) **unless** you provide seed phrases in the env. To avoid losing funds when you restart the Payment Service, export the seed phrases and add them to `.env`:

   * In Admin UI, click **“Export”** next to Purchasing Wallet to reveal its 24-word mnemonic. Copy the phrase.
   * Open your `.env` and find the wallet section. Paste the 24-word phrase as the value for `PURCHASE_WALLET_PREPROD_MNEMONIC` (or `PURCHASE_WALLET_MNEMONIC`). Do the same for the Selling Wallet (`SELLING_WALLET_PREPROD_MNEMONIC`).
   * For the collection wallet, *do not paste a mnemonic!* If you choose to set a collection wallet, you only provide the **address** (e.g. `COLLECTION_WALLET_PREPROD_ADDRESS="addr1..."`), not any seed phrase. On Preprod you can leave this blank or set it to a spare test wallet address you hold, just to practice the configuration.
   * Restart the Payment Service container after updating env (so it picks up the seed phrases). The service will then **restore** those wallets on launch rather than making new ones, ensuring the funds remain accessible. (On Preprod it’s not tragic if you lost them – you could faucet again – but it’s good practice for Mainnet).
5. **Stablecoin (USDM) on Testnet:** Masumi’s payment protocol uses **USDM** (a USD-pegged stablecoin on Cardano) as the primary payment unit on Mainnet, while ADA is used for transaction fees. However, **USDM is *not* available on Preprod**; for testing, all payments will effectively use ADA only. This simplifies setup: you only need to fund with test ADA. (In Mainnet preparation, you’d acquire USDM and send it to the Purchasing wallet as well, but skip that now).
6. **(Optional) Wallet Best Practices:** Even in test, treat your keys with care:

   * Do not expose or commit your seed phrases. The `ENCRYPTION_KEY` in env is used to encrypt these secrets in the DB for some safety, but the plaintext exists in your `.env` – keep that file secure.
   * **Minimize funds in hot wallets:** It’s good practice to only keep what you need for testing in the Masumi-managed wallets. (On Mainnet, regularly transfer earnings out to a secure wallet (collection wallet) and only preload minimal required funds for purchases).
   * **Backup seed phrases offline:** Since these are test wallets, this is less critical, but on Mainnet you would write down the 24-word mnemonics on paper and keep them safe (if you lose them and something happens to your node, you lose access to funds).

After funding, **confirm both wallets have sufficient tADA** (at least a few thousand each is recommended for testing multiple transactions). You can always request more from the faucet as needed.

Your Masumi node is now fully prepared with funded Preprod wallets. Next, we will **register your AI agent on the Masumi network** and integrate the payment flow.

## 4. Registering the AI Agent on Masumi (Preprod Registry)

With the infrastructure running and wallets funded, you can **register your AI agent as a service on the Masumi Preprod Network**. Registration does two key things:

* **On-Chain Identity:** It mints an on-chain identity for your agent (an entry in the Registry smart contract, effectively an NFT with your agent’s metadata). This gives your agent a unique `agentIdentifier` and makes it discoverable.
* **Payment Linking:** It ties your agent to your Selling Wallet (and payment contract) so that payments for this agent can be escrowed and routed properly to you.

**Steps to Register:**

1. **Gather Payment Source Info:** The agent registration requires referencing your **selling wallet’s public key (vkey)** and optionally the payment contract address. The Payment Service can provide these via its API. Use the admin key to call the Payment Service’s **GET `/payment-source/`** endpoint:

   ```bash
   curl -X GET "http://localhost:3001/api/v1/payment-source/?take=10" \
        -H "accept: application/json" \
        -H "token: <your_admin_key>"
   ```

   This returns a JSON with configured payment sources. Find the entry where `"network": "PREPROD"`. In that object, note the following:

   * `walletVkey` of the Selling Wallet (a long hex string).
   * `smartContractAddress` (the address of Masumi’s payment escrow contract on Preprod) – this might be present as `paymentContractAddress` or under one of the wallet entries. Often the selling wallet object has a `collectionAddress` which is either `null` or an address for revenue, and the contract address might be listed at top level as `smartContractAddress`. If not obvious, you can also get the contract address from docs or the Explorer (for Preprod, Masumi’s Payment SC address is known).
   * (You likely don’t need the purchasing wallet info for registration, just the selling wallet.)
     Make sure you copy the **exact** `walletVkey` for the selling wallet – this proves ownership of the agent’s receiving wallet in the registration transaction.

2. **Prepare Registry Metadata:** Next, craft the payload for registering your agent via **POST** to the Registry Service. Here’s an example template (fill in your agent’s details):

   ```bash
   curl -X POST "http://localhost:3001/api/v1/registry/" \
        -H "Content-Type: application/json" \
        -H "token: <your_admin_key>" \
        -d '{
         "network": "Preprod",
         "name": "Your Agent Name",
         "description": "A brief description of what your agent does",
         "Tags": ["tag1","tag2"], 
         "ExampleOutputs": [ { "input": "...", "output": "..." } ], 
         "Author": { "name": "Your Name or Org", "email": "you@example.com" },
         "Legal": { "terms": "URL-or-text of terms if any", "privacy": "URL/privacy info" },
         "apiBaseUrl": "http://<YOUR_AGENT_HOST>:8000",
         "Capability": { "name": "Capability Name", "version": "1.0.0" },
         "AgentPricing": {
            "pricingType": "Fixed",
            "Pricing": [ { "unit": "", "amount": "10000000" } ]
         },
         "sellingWalletVkey": "<YOUR_SELLING_WALLET_VKEY_HEX>",
         "paymentContractAddress": "<PAYMENT_CONTRACT_ADDR_OPTIONAL>"
       }'
   ```

   A few notes on these fields:

   * **network** must be `"Preprod"` for testnet.
   * **name, description, Tags** – metadata to identify your agent. These will be visible to users (e.g. in an explorer or marketplace).
   * **ExampleOutputs** – an array of example Q\&A pairs or tasks your agent can do, to set expectations. (This can be left empty or a couple of examples of input->output your agent produces.)
   * **Author / Legal** – info about you or your organization. (Optional but good for transparency. You can include a DID for identity if you have one, or just name/email.)
   * **apiBaseUrl** – the base URL where your agent’s API can be reached by others. **Important**: if you plan to have others call your agent, this must be accessible. For local testing you might put `http://127.0.0.1:8000`, but that obviously won’t be callable by others. For a truly deployable service, you’d use a public URL or DNS where your agent API is hosted. For now, you can use local or a placeholder – the registration will still go through (just others wouldn’t reach your agent until you host it properly).
   * **Capability** – describe the main capability your agent offers (e.g. `{ "name": "Travel Planning Service", "version": "1.0.0" }`). This is just free-form metadata.
   * **AgentPricing** – this defines how much it costs to use your agent. In the example above, `pricingType: "Fixed"` and an array with one Pricing entry. `"unit": ""` and `"amount": "10000000"` means **10,000,000 lovelace**, i.e. 10 ADA, as a fixed price. The empty unit `""` is used to denote ADA (the Cardano native token). You can adjust the amount or, if you had a stablecoin on testnet, you could specify it by policy ID. For now, decide how much test ADA you want to charge per job. (Keep it reasonable relative to the 10k tADA we funded – e.g. 1 ADA = 1e6 lovelace – to allow multiple tests.)
   * **sellingWalletVkey** – the hex vkey from step 1. This links your on-chain agent identity to your wallet (the on-chain registry will store a hash of this key, and the Payment smart contract will only release funds to the matching skey).
   * **paymentContractAddress** – you can include the Masumi Payment contract address for completeness (on Preprod, it’s a specific `addr_test...` address). In Masumi’s latest API, this field might be optional if the service knows the default contract. It doesn’t hurt to include it if you have it from `/payment-source`.

   Send the request. If everything is correct, you should receive a response like:

   ```json
   {
     "status": "success",
     "data": {
       "id": "cmbu...5s6d...t9", 
       "name": "Your Agent Name",
       "state": "RegistrationRequested",
       "apiBaseUrl": "http://127.0.0.1:8000",
       "SmartContractWallet": {
         "walletVkey": "<beda8c...>", 
         "walletAddress": "<addr_test1qz...>" 
       },
       "AgentPricing": { "pricingType": "Fixed", "Pricing": [ { "unit": "", "amount": "10000000" } ] },
       ...other fields...
     }
   }
   ```

   Notice `state`: `"RegistrationRequested"`. The registration happens via an on-chain transaction that the Masumi Payment Service has now submitted to the **Registry smart contract**. This transaction needs to be minted into a block before the registration is final.

3. **Confirm On-Chain Registration:** After a short wait (a few seconds to a couple minutes, depending on block times), you should confirm that the agent was successfully registered on-chain. You can do this in two ways:

   * **Via Masumi Registry API:** Call the GET `/registry/?network=Preprod` endpoint with your token:

     ```bash
     curl -X GET "http://localhost:3001/api/v1/registry/?network=Preprod" \
          -H "token: <your_admin_key>"
     ```

     The response will list all agent assets your node knows about. Find your agent in the `"Assets"` list. The `state` should now be `"RegistrationConfirmed"`. Crucially, you will see an `agentIdentifier` field – this is a long hex string (representing the unique on-chain ID, typically a policy ID + asset name hash) that serves as your agent’s identifier on the network. Copy this `agentIdentifier` value.
   * **Via Explorer:** Optionally, you can go to **Masumi Explorer** (explorer.masumi.network) or Cardano’s Preprod explorer and look up your **Selling Wallet** address or the transaction hash. Your agent registration appears as a token/NFT minted to your selling wallet address. The explorer would show an asset with the name equal to (or derived from) your agent name under that address.

   If the state is still `RegistrationRequested` after a while, or you got an error response, troubleshoot:

   * Ensure your **Purchasing Wallet** had at least a few ADA – the registration costs a small fee (transaction fee) that is paid by the *purchasing* (admin) wallet. If it was empty, the TX might not have been submitted.
   * Check the Payment Service logs for any error (e.g. “insufficient funds” or Blockfrost issues).
   * It’s possible your Blockfrost project needs more throughput if you spam many requests (50k/day limit is usually fine).
   * On success, the Payment Service should also log the transaction hash of the registration. The GET `/registry/wallet/` endpoint (with your wallet ID) can also query the chain directly to verify.

4. **Update Agent Backend Configuration:** Now that your agent is registered, **update your agent’s own configuration** with the necessary IDs so it can use Masumi services:

   * **Agent’s `.env`:** Add the following entries to your agent app’s environment (or config):

     * `AGENT_IDENTIFIER` – set this to the exact `agentIdentifier` string you obtained.
     * `PAYMENT_API_KEY` – create a **limited API key** for your agent to interact with the Payment Service. It’s bad practice to use the master admin key in your agent code (if your agent is compromised, the admin key can do anything). Instead, use the Payment Service API to create a new key with minimal permissions:

       ```bash
       curl -X POST "http://localhost:3001/api/v1/api-key/" \
            -H "token: <your_admin_key>" \
            -H "Content-Type: application/json" \
            -d '{ "name": "AgentKey", "permissions": ["PAYMENT_CREATE","PAYMENT_READ"] }'
       ```

       (Adjust permissions as needed – for example, the agent might also need `PAYMENT_UPDATE` to submit results, and perhaps `PURCHASE_CREATE/READ` if it will call other agents. The Masumi docs detail permission flags.)
       The response will contain a new API key (store it **securely**; it won’t be shown again). Use this as `PAYMENT_API_KEY` in the agent’s env.
       *If the API key endpoint is not available or you skip this, you **can** use the admin key for testing, but be very cautious*. At minimum, never expose it client-side.
   * **Configure Pricing (if needed):** If your agent code needs to know how much to charge or the currency, ensure it aligns with what you registered. In many cases, the agent doesn’t need to know its price; it simply requests a Payment ID from the Payment Service which encodes the price. Just be mindful that on Preprod the unit is ADA (since USDM not present), and the Payment Service by default will assume the price unit `""` is lovelace. We set that in the registry, so it should be fine.
   * **Restart the Agent Service** to load the new environment variables. Your agent is now aware of its Masumi identity and has credentials to use the Payment API.

5. **Verification:** Your agent is officially on-chain! You can verify:

   * Use the **Registry API** to fetch your agent by its wallet or ID to ensure it returns “state: RegistrationConfirmed”.
   * In the Admin UI under **Registry** (if available), you might see the agent listed.
   * The `agentIdentifier` acts as a proof of registration. In a production scenario, clients might ask your agent for its identifier to verify it (and then check on-chain that the hash of its API endpoint matches, etc., but that’s advanced usage).
   * At this point, others (or you) can find this agent via the registry and know how to call it (your provided API base URL and pricing).

Your deployment now consists of a **Masumi Node (Payment+Registry)** connected to the Preprod blockchain, and an **Agent Service** that is registered and configured to use Masumi’s Payment API. The next step is to **test the end-to-end payment flow** to ensure your agent can handle paid jobs and that payments are processed and logged on-chain.

## 5. Testing the End-to-End Flow (Agent Calls, Payments, On-Chain Logs)

Now for the moment of truth – simulate a client using your agent and verify that payments go through and logs appear on-chain. We’ll outline a testing strategy that covers the critical components:

**A. Simulate a Client Hiring the Agent:**
Using either your frontend UI or simple curl commands, trigger the agent’s workflow as a customer would:

1. **Start a Job Request:** Call your agent’s `/start_job` endpoint with some input. For example:

   ```bash
   curl -X POST "http://localhost:8000/start_job" \
        -H "Content-Type: application/json" \
        -d '{ 
              "identifier_from_purchaser": "test-user-123",
              "input_data": { "text": "Hello, world" } 
            }'
   ```

   (The `identifier_from_purchaser` is an arbitrary tag you can use to identify the user or session; it will be included in payment metadata. The CrewAI template expects it.)
   The agent’s response should be quick and include two important fields:

   ```json
   { 
     "status": "success",
     "job_id": "<some-uuid>", 
     "payment_id": "<some-id>"
   }
   ```

   For example, you might see:

   ```json
   {"status":"success","job_id":"e4a1f88c-769a-4e8d-b298-3b64345afa3b","payment_id":"abcd-efgh-5678"}
   ```

   The `job_id` is your agent’s internal ID for the task. The `payment_id` is **generated by the Masumi Payment Service** when the agent (in its `/start_job` logic) called the Payment API to create a pending payment. This `payment_id` represents the escrow payment that must be made for the job to proceed.

   *If you did not get a `payment_id` and the agent instead returned an error*, check the agent’s console logs. Common issues:

   * The agent couldn’t reach the Payment Service API – ensure the Payment Service is running at the host/port the agent expects. In code, likely the agent calls Masumi via `http://localhost:3001` by default. If your agent is running in Docker separate from the Masumi container, “localhost” might not resolve correctly. Adjust the Payment API base URL in the agent config if needed (e.g. if agent is outside Docker, use `http://localhost:3001`; if inside another container, use the Docker network alias or host).
   * The agent’s `PAYMENT_API_KEY` might be wrong or missing – verify it matches what the Payment service expects. If using the admin key for now, use that. If using a custom key, ensure it has the `PAYMENT_CREATE` permission (for creating payments).
   * The input format might not match what your agent expects. Ensure the JSON keys align with your `input_schema`.

   Assuming the response was successful, we now have a pending payment that needs to be fulfilled.

2. **Payment by the Client:** In a real scenario, at this point your frontend would prompt the user to pay for the service. Since this is Preprod, the “payment” will be in tADA. The **Masumi Payment Service** knows how much (and to which contract address) the user needs to pay from when we registered the agent and created the payment record. There are a couple ways to simulate the payment:

   * **Manual method (external wallet):** You could take the `payment_id` and use the Masumi Explorer UI or a wallet dApp (like Begin or Eternl on testnet) to pay. However, currently the payment flow isn’t simply sending ADA to an address; it involves locking funds in the smart contract with the correct *datum*. Masumi’s Explorer would normally abstract this, but using a generic wallet manually is complex. It’s easier to use the Payment Service itself to simulate the buyer.
   * **Automated method (Masumi Purchase API):** Since you control both sides in testing, you can use the Payment Service’s **purchase endpoint** to have your **Purchasing Wallet** act as the buyer and send the funds. Essentially, you instruct the Payment Service to pay the required amount into the contract on behalf of a buyer. Use the `payment_id` from above in a POST to `/purchase`:

     ```bash
     curl -X POST "http://localhost:3001/api/v1/purchase/" \
          -H "token: <your_admin_or_buyer_key>" \
          -H "Content-Type: application/json" \
          -d '{ "network": "Preprod", "paymentId": "<payment_id_from_agent>" }'
     ```

     The Payment Service will immediately submit a transaction from the **Purchasing Wallet** to the Payment contract to lock the funds. This simulates a buyer making the payment. (Ensure your Purchasing Wallet has at least the price amount + some fee, which it should from earlier funding.)
     The response will contain a `purchase_id` or similar, but you can mostly trust that if it returned success, the payment is underway.

   *Either way*, the funds are now locked in the escrow contract on Preprod. The agent’s Payment Service is **monitoring** the blockchain for that payment to appear. This typically happens within 20–40 seconds (1 block). The Payment Service will detect the UTXO with your `payment_id` and mark it as paid.

3. **Agent Awaiting Confirmation:** Meanwhile, your agent should also be polling the Payment status. In the CrewAI template, after issuing the payment\_id, the agent likely waits until the Payment Service confirms the funds. It might be periodically calling GET `/payment/` for that ID, or the template’s logic might simply check once after some delay. In any case, the Payment Service will update the payment status to “Paid/Confirmed” once the transaction is seen.

   * You can manually check this via the Payment API: `GET /payment?network=Preprod&smartContractAddress=<addr>&includeHistory=true`. The returned JSON for that payment will show a status or onChainState indicating funds locked, etc. (This is optional; the agent should pick it up.)
   * The agent should transition from “waiting for payment” to actually performing the task once it sees payment success. In the template, this might be abstracted since it’s a simple flow – it could even start processing immediately for demo purposes. But in a real integration, you ensure that no heavy work is done until payment is confirmed.

4. **Job Execution and Completion:** Your agent will now execute the requested task (e.g. perform the AI query). When it’s done, it should store the result and also **notify the Payment Service** that the job is complete by sending a **PATCH** to the `/payment` endpoint with a hash of input+output (this is the “decision log” proof). The CrewAI quickstart might not have implemented the actual hashing and PATCH in the example; if not, you may need to implement that to fully test the dispute mechanism:

   * The PATCH `/payment` call will include the `payment_id` and the `result_hash`. Upon this call, the Masumi Payment Service will submit a transaction to the Payment smart contract including that hash, marking the service as delivered.
   * This on-chain “decision log” is a **cryptographic hash** of the job’s input and output, serving as immutable evidence of what was done. Only the hash is stored on-chain (to preserve privacy). Later, a client could verify the output against this hash to confirm authenticity.
   * The Payment contract now enters a dispute period where the buyer could request a refund if the output is bad, by comparing their actual output to the hash. In Preprod testing, we generally won’t exercise refunds, but know that if you *did* call the refund API, it would submit a refund request on-chain and, if not countered, return funds after the cooldown.

5. **Retrieve the Result:** Finally, the client (your test code or UI) should retrieve the outcome of the job. This is typically done by calling the agent’s **GET** `/status?job_id=<job_id>` endpoint:

   ```bash
   curl -X GET "http://localhost:8000/status?job_id=<the_job_id_returned>"
   ```

   Initially, this may show the job status as "pending" or similar. Once completed, it should return something like:

   ```json
   {
     "job_id": "e4a1f88c-...afa3b",
     "status": "completed",
     "result": "Processed input data: {'text': 'Hello, world'}"
   }
   ```

   (The exact format depends on your agent implementation. The example shows a completed status with a result string.)
   Confirm that you indeed got a result from the agent and that it matches expectations for the input you gave.

6. **On-Chain Log Verification (Post-Completion):** At this point, the **agent’s output hash has been recorded on-chain** as part of the Payment completion transaction. You can verify the presence of this log:

   * Use the Payment Service API to query the payment with `includeHistory=true`. It will show the `resultHash` stored and the status likely as "Completed" along with a transaction hash for the completion.
   * On the **Masumi Explorer** (if available on Preprod), find the agent’s entry or the transaction. The Explorer might show the decision log hash for the transaction.
   * While you cannot directly derive the output from the hash (one-way), you as the tester know the input and output, so you could locally hash them to confirm it matches the on-chain hash. (Masumi likely uses SHA-256 or Blake2b; check docs for the exact method if you attempt this.)
   * This step confirms the **Decision Logging** feature: every output of the agent can be proven by referencing the on-chain hash. This ensures accountability – if someone claims your agent gave a certain result, you can verify if that exact result’s hash matches what’s on-chain for that job, resolving disputes fairly.

7. **Funds Release (for completeness):** In Preprod, you don’t need to do anything else – the Payment contract will allow your Selling Wallet to withdraw the funds after the dispute period (usually a short period on testnet). For testing, you might simply leave the funds in escrow or manually trigger a withdraw via the Payment API (the Payment Service might auto-batch withdrawals after cooldown). If you wait out the dispute time (or patch the contract to skip it in test), the Payment Service’s next batching cycle will include a withdrawal transaction moving the ADA from the contract UTXO to your Selling Wallet, minus a network fee (Masumi charges a 5% fee by default, configurable, sent to a fee receiver address). You can observe the Selling Wallet balance increase correspondingly.

**B. Validate Each Component:**

* **Registry:** Confirm that the agent is still listed in the registry and that its `state` didn’t change unexpectedly. It should remain "RegistrationConfirmed". Each job doesn’t affect the registry state.
* **Payment Service Logs:** Check the Payment Service console output during the test. You should see logs for:

  * Payment request created (with an ID, and price).
  * Detection of payment UTXO on-chain.
  * Confirmation of payment, and later the patch with result hash.
  * Possibly a message about scheduling withdrawal.
    Any errors or warnings here need attention.
* **Agent Logs:** Check your agent’s terminal logs. Verify it received the `/start_job` call, waited for payment (likely logging something like “payment confirmed”), then processed the task, and possibly logged the result or the call to PATCH payment. If any exceptions occurred (e.g. couldn’t PATCH the payment due to auth), fix those (ensure `PAYMENT_API_KEY` is correct and has `PAYMENT_UPDATE` permission for the PATCH).
* **Frontend Integration:** If you have a frontend UI, now is a great time to test it:

  * Use the UI to initiate a job (it should internally call your agent’s API).
  * When the UI gets the `payment_id`, ideally it should present a payment dialog. In a closed test, you could intercept that and call the Purchase API as above. In a real dApp, you’d connect a Cardano wallet and have the user sign a tx to the contract. Since we can’t simulate that easily here, using the Purchase API is fine. Ensure your UI knows when to proceed (perhaps you set it to poll `/status` until completion).
  * See that the UI receives the result and displays it.
  * Verify that no sensitive info (like API keys) is exposed in the browser’s network calls – all calls to Masumi should use the limited key, and ideally go through your backend if possible to keep keys secret.

**C. Common Pitfalls & Resolutions during Testing:**

* If the **Payment never confirms** (agent waits indefinitely):

  * Check that the purchase transaction actually occurred. If you used the Purchase API and it returned success, it likely did. If you manually attempted to send ADA without the correct datum, the Payment Service wouldn’t recognize it.
  * Ensure the **payment amount** was exactly correct. If you underpaid or overpaid, the contract won’t consider it valid for that Payment ID. The Payment ID encodes an expected amount. Using the Purchase API avoids this issue by using the correct data.
  * Confirm that your Blockfrost usage isn’t at its limit (unlikely in small tests, but if you did a lot of rapid calls, Blockfrost may rate-limit).
  * You can also inspect the `Payments` list via API to see if there is an entry for your payment\_id and what its status/history says.
  * Tip: In a dev environment, you can shorten the dispute period or force withdraw for quicker iteration (advanced, requires contract parameter tweak or using admin multisig to override – beyond scope here).
* If the **agent returned an error immediately after /start\_job**: double-check the Payment Service is reachable and that the agent’s network config is correct (especially if not all components on the same host).
* If the **agent is not accessible via the provided `apiBaseUrl`**: remember that in registration we gave an API URL. If that was localhost, obviously no one else can call it. That’s okay for closed testing. But for a production deployment, you would deploy your agent service on a server or cloud with a public URL and use that in `apiBaseUrl` (and you’d need to re-register the agent with an updated URL, or update via a new registration transaction if supported).
* If the **frontend isn’t showing updated info**: maybe it isn’t polling the `/status` endpoint or not handling the asynchronous nature of payment. You might need to add a loop to check job status periodically, or use webhooks from the agent if you implemented them.
* **Database persistence**: Try restarting the Payment Service container and ensure that it **remembers** your wallets (balances and addresses should persist thanks to the seed phrases you added) and your agent registry entry (the registry info is stored on-chain and cached in the DB; on restart it should resync from chain or from local cache). If something is missing, you may need to re-run certain steps (e.g. if you forgot to save seeds, the service will generate new wallets, effectively “losing” the old ones – on testnet just faucet again, but learn the lesson for mainnet).

At this stage, you should have successfully executed a paid AI agent job on Preprod: the agent was called, the payment was escrowed in ADA, the agent delivered a result, and a hash of that result was logged on-chain for verification. 🎉

## 6. Configuration Reference: Environment Variables and Files

For clarity and future deployment, here’s a checklist of **essential configuration (.env) entries** for both backend and frontend, with sample or placeholder values:

**Masumi Node (.env for Payment/Registry Services):**

* `ADMIN_KEY` – **Admin API Key** for Masumi services. Example:

  ```bash
  ADMIN_KEY="mysupersecureadminkey12345"
  ```

  This key is seeded on first run and has full permissions. *Keep it secret*. Use it only to generate more keys or for admin tasks.
* `ENCRYPTION_KEY` – **Encryption Passphrase** for wallet secrets. Example:

  ```bash
  ENCRYPTION_KEY="4f8c2e8896e2f0c3a... (32 hex chars) ..."
  ```

  This key encrypts mnemonics in the DB. Generate randomly (don’t reuse from examples).
* `BLOCKFROST_API_KEY_PREPROD` – **Blockfrost API Key** for Preprod network. Example:

  ```bash
  BLOCKFROST_API_KEY_PREPROD="preprod123ABC..."
  ```

  Ensure this is a Preprod project key (it usually starts with `preprod...`).
* `BLOCKFROST_API_KEY_MAINNET` – (Optional, not used in Preprod environment, but the env file may have a placeholder – leave it blank or omit for now.)
* `PURCHASE_WALLET_PREPROD_MNEMONIC` – **Purchasing Wallet Seed Phrase**. Example:

  ```bash
  PURCHASE_WALLET_PREPROD_MNEMONIC="oil embody famous intact ... clock chef (24 words)"
  ```

  If you let the node auto-create, you should paste the exported words here for persistence.
* `SELLING_WALLET_PREPROD_MNEMONIC` – **Selling Wallet Seed Phrase**. Example:

  ```bash
  SELLING_WALLET_PREPROD_MNEMONIC="enough marble decline visa ... actual bike (24 words)"
  ```

  Paste the exported 24-word phrase.
* `COLLECTION_WALLET_PREPROD_ADDRESS` – **Collection Wallet Address** (optional). Example:

  ```bash
  COLLECTION_WALLET_PREPROD_ADDRESS=""
  ```

  Leave blank if not using. (On Mainnet you’d put an address from a secure wallet here.)
* `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` – Database credentials (if using external Postgres or to override defaults). The quickstart uses defaults: user `postgres`, password `postgres`, db name `masumi`. If you change these, update the docker-compose or provide a `DATABASE_URL`.
* Other envs: There are additional settings (e.g. `BATCH_PAYMENT_INTERVAL`, logging levels, etc.) but defaults usually suffice. Check Masumi docs for the full list if needed.

**Agent Service (.env or config for your application):**

* `OPENAI_API_KEY` – (If your agent uses OpenAI or similar) ensure this is set so your agent can actually perform tasks.
* `PAYMENT_API_KEY` – **Masumi Payment API Key** for agent use. Example:

  ```bash
  PAYMENT_API_KEY="sk_4f90cf... (some token)"
  ```

  This is the limited key you created for the agent to create/check payments. It should have at least read/write permissions for payments (and possibly purchases if your agent will call others). *Never put the master ADMIN\_KEY here!* Use a scoped key.
* `AGENT_IDENTIFIER` – **Masumi Agent Identifier** (on-chain ID). Example:

  ```bash
  AGENT_IDENTIFIER="0c2912d4088fbc6a0c725dbe52337358211... (long hex)"
  ```

  This ties the agent to the on-chain registry entry. The agent may include this in its responses or use it for logging.
* `MASUMI_PAYMENT_URL` / `MASUMI_REGISTRY_URL` – If your agent code needs to know where to call the Masumi APIs, you might have variables for the Payment service base URL or Registry URL. In a simple setup, `MASUMI_PAYMENT_URL="http://localhost:3001/api/v1"` (the agent could hardcode this too).
* Any other framework-specific configs (for CrewAI, maybe the port, etc., which you likely set when starting the FastAPI server).

**Frontend (Supabase + Vite):**

* `VITE_SUPABASE_URL` – your Supabase instance URL.
* `VITE_SUPABASE_ANON_KEY` – the anon public API key for Supabase (for client-side).
* If using Supabase Auth with OAuth providers (like Google sign-in as per your screenshot), you don’t put those in Vite env, but you must configure them in the Supabase dashboard (client IDs in Authentication settings) and possibly set environment variables in Supabase functions if needed. Ensure the **OAuth callback URL** in Google Cloud matches the one given by Supabase (e.g. `https://<your-project>.supabase.co/auth/v1/callback`) – which your screenshot shows.
* `VITE_API_BASE_URL` (if your frontend needs to call your agent API or a backend proxy) – set this to the domain/port where your agent or backend is accessible. In development it might be `http://localhost:8000`, in production maybe a domain name.
* API keys or secrets for any other third-party services used in the front (if any). Generally avoid secrets in front-end code – use Supabase or your backend to handle secret actions.

Double-check that none of your secrets (admin keys, seed phrases, etc.) are exposed in the **frontend code repository**. Vite will include any `VITE_*` prefixed variables, but not others. Do not accidentally expose your Masumi admin key or the agent’s payment key in the UI.

## 7. Security Considerations & Best Practices

Deploying a production-grade agent requires careful attention to security, even on testnet. Keep in mind:

* **Principle of Least Privilege:** Use scoped API keys for specific purposes. For example, your agent service should use a limited `PAYMENT_API_KEY` that only allows creating payments and updating its own payments. Do not use the master admin key in application code or front-end. Similarly, if you build any backend endpoints for your UI to query registry data, create a read-only registry API key for that. This limits damage if a key is exposed.
* **Protect Secrets:** Never commit your `.env` with sensitive keys to version control (add it to .gitignore). In deployment, use your platform’s secret management to set env vars. The admin key, encryption key, wallet mnemonics, and OpenAI API keys are all highly sensitive. Also, your Supabase service\_role key (if used on backend) should be kept private.
* **Wallet Security:** Although on Preprod it’s just test ADA, practice good habits:

  * On Mainnet, *fund your Purchase wallet with only what you need* for expected usage and *sweep your Selling wallet regularly* to your secure Collection wallet. The Payment Service can be set up to auto-transfer above a threshold if desired.
  * Treat seed phrases like real money keys: store offline, perhaps use a hardware wallet for the collection wallet if possible. The Selling/Purchase wallets are hot – assume if your server is compromised, those funds could be stolen, so minimize their balances.
* **API Security:** The Masumi Node APIs (Payment & Registry) should ideally not be exposed to the public internet without protection. In your deployment, consider binding them to a private network or use firewall rules. If you need to expose them (e.g. for your frontend to query), do so via an API gateway or backend proxy that can enforce auth and rate limits. The `token` header auth is the only protection – ensure any key used on the client side has only read access and nothing more.
* **Front-End User Auth:** If your UI allows user login (Supabase Auth) and potentially user-specific agent actions, ensure those flows are secure. Use SSL for your site (especially if embedding wallet connections). Supabase provides easily configurable auth and database rules – use row level security to isolate user data if needed.
* **Hardcoded Values:** Avoid hardcoding network IDs, contract addresses, etc., in multiple places. Rely on environment-specific settings. For instance, Masumi’s contract addresses differ on Preprod vs Mainnet – if in code, fetch them from the Payment Source API or config.
* **Masumi Admin UI Access:** If you deploy the Masumi node on a server, the admin UI (port 3001) has no password – *restrict access to this port*! You might bind it to localhost or protect it with a simple HTTP auth via a reverse proxy. It provides powerful abilities (like exporting seeds, etc.), so you don’t want it publicly reachable.
* **Monitoring and Alerts:** Set up logging and monitoring for your agent and Masumi node. The sooner you catch an issue (failed transaction, etc.), the better. On Mainnet, failed payments or contract issues could cost real money, so you’d want alerts for anomalies.
* **Upgrade Considerations:** Keep an eye on Masumi updates. As of June 2025, smart contract audits are ongoing for mainnet. When mainnet goes live, follow Masumi’s guide to migrate from Preprod. New versions of the services might change APIs slightly – review release notes.
* **Regulatory Compliance:** If you monetize agents, consider legal aspects (Masumi docs mention compliance in core concepts). E.g., have terms of service (we included a Legal field in registration for this reason), and ensure privacy of user data.

In summary, **treat the testnet deployment as a dress rehearsal for production**. Use it to refine not just functionality but also security posture.

## 8. Deployment Checklist (Backend & Frontend)

Finally, here is a **step-by-step deployment checklist** consolidating everything – use this as a playbook when moving to a fresh environment or doing a production push:

**Backend (Masumi Node + Agent Service):**

1. **Provision Infrastructure:** Set up a server or container environment for the Masumi services and your agent. Ensure Docker is available (for Masumi) or alternative installation steps are followed. Also ensure you have a Postgres DB (Docker or managed).
2. **Obtain Secrets:** Securely store the Blockfrost keys, OpenAI keys, etc. Generate a new `ENCRYPTION_KEY` for this deployment. Decide on an `ADMIN_KEY` (random 16+ char string).
3. **Masumi .env Setup:** Fill out the `.env` for Payment/Registry with the values determined (see Section 6). Include Preprod wallet mnemonics if you want to reuse wallets from dev (not necessary – you could start fresh wallets in the new env and just faucet them).
4. **Launch Masumi Stack:** Start the registry and payment services (and Postgres). Use `docker-compose` as configured or your orchestrator. Verify the containers are running without error.
5. **Initialize Wallets:** Open Admin UI and export the new wallet addresses. Fund the **Preprod** wallets via faucet as done in testing. Confirm balances.
6. **Persist Wallet Keys:** Export the mnemonics and update the `.env` on the server with these seeds. Restart the Masumi services to ensure they load the seeds (so future restarts retain the same addresses).
7. **Run Agent Service:** Deploy your agent application (e.g., run the FastAPI app). Set environment vars for `OPENAI_API_KEY`, etc., and initially you might leave `PAYMENT_API_KEY`/`AGENT_IDENTIFIER` blank until registration is done. Ensure the agent is accessible at a public URL if needed (maybe behind a reverse proxy like Nginx for SSL).
8. **Register the Agent:** Same as Step 4 above – use the Payment API (with admin token) to fetch wallet vkey, then call Registry API to register your agent on Preprod. This time use the real domain in `apiBaseUrl` if your agent is public. Wait for confirmation and get the new `agentIdentifier`.
9. **Configure Agent with Masumi IDs:** Generate a scoped `PAYMENT_API_KEY` via admin API and note it. Update the agent’s environment with this key and the `AGENT_IDENTIFIER`. Restart the agent service to apply these.
10. **Backend Smoke Test:** Ping the agent’s `/availability` endpoint to ensure it’s up and returning status “available”. Test a quick job locally (maybe with a small input) to see that it goes through the motions (you can simulate the payment with the Purchase API as before). Check that everything works in this production environment as it did locally.
11. **Security Hardening:** Once confirmed working, implement any security measures (close down admin UI port, use firewall, etc., as discussed in Section 7).
12. **Monitoring Setup:** (Optional but recommended) Configure logs, uptime monitors, or email alerts. E.g., you might pipe Docker logs to a logging service, or set up healthcheck pings.

**Frontend (Supabase + Vite App):**

1. **Supabase Setup:** Ensure your Supabase project is configured (Auth providers, Database schema, Storage, etc., as per your app needs). Update any environment variables or secrets for Supabase (for example, if you use Supabase functions, set the required secrets there).
2. **Frontend Environment:** In your Vite `.env.production` (or build pipeline), set the `VITE_...` variables (Supabase URL/key, API base URL, any feature flags).
3. **Connect Frontend to Backend:** Update the API endpoints in the frontend to point to your deployed agent service URL. If your front-end calls the Masumi registry (for, say, browsing other agents), ensure it uses your backend or the Masumi public API with a proper key.
4. **Build and Deploy Frontend:** Run `npm run build` (or equivalent) to produce a production bundle. Deploy it to your hosting of choice (Netlify, Vercel, static server, etc.). Ensure it’s served over HTTPS (especially if using browser-based wallet integrations – required for wallet APIs).
5. **Test UI in Production:** Visit the deployed site. Sign up or log in (if applicable) via Supabase Auth to ensure that’s working (the Google sign-in should redirect properly if configured). Create a new agent (if your UI has that feature separate from Masumi’s registration – note, you might have two concepts: one in your UI DB and one on-chain; make sure they align or you trigger on-chain registration when needed). For now, test using the agent you deployed: use the UI to send a query to the agent. Go through the payment flow:

   * If you integrated with a Cardano wallet (Begin, Nami, etc.), connect it on Preprod, ensure it has test ADA, and let the user send the payment to the provided address. This requires generating the proper transaction – possibly your UI might redirect to Masumi Explorer for the payment, but since you have a custom UI, you may craft a transaction via CIP-30 wallet API. Make sure the `payment_id` and contract address are used correctly in that transaction. This is complex, so as an intermediate step you might still rely on manually calling the purchase API or a script in test.
   * See that the UI updates the job status and eventually displays the result.
   * Verify that the user’s wallet sees the deduction of tADA and your selling wallet (which you control) later sees the increase (minus fees).
6. **User Experience Checks:** Ensure that error messages are user-friendly. E.g., if payment is not made within some time, does your UI time out or prompt again? If the agent fails, do you handle it? These make the solution production-grade beyond the technical integration.

**Common Deployment Pitfalls:**

* **CORS issues:** If your front-end is on a different domain than your agent API, configure CORS on the agent server to allow the front-end origin or use a proxy. The CrewAI FastAPI app by default might allow all origins (check this and tighten if needed).
* **Environment mismatches:** Double-check you didn’t accidentally point to Mainnet anywhere. In the `.env`, ensure you use Preprod keys and addresses. Mainnet should be entirely separate configuration (and not used until ready).
* **Outdated Data:** If you redeploy, you might end up with multiple registry entries (if you register again without retiring the old one). For testing it’s fine, but on production, coordinate updates (Masumi may allow updating an existing entry or you might just make a new one and later deregister the old).
* **Clean Up:** On Preprod, if you are done testing, you might want to deregister an agent (not always necessary, but to keep the registry tidy if you had many test entries). Check Masumi docs for a deregistration process (likely marking the asset as retired – possibly via a special transaction or simply not running the service).

Throughout this entire process, **document every step and outcome**. A production checklist should be followed precisely and checked off (for example, maintain a copy of this with your specific values filled in). If something goes wrong in production, these detailed steps will help pinpoint which stage had an issue.

## 9. Conclusion

Deploying an AI Agent on Masumi Preprod involves configuring multiple components (Agent, Payment, Registry, Wallets, UI) to work in harmony. By following the above guide, you ensure that:

* All necessary components (Masumi node, wallets, API keys, agent code) are in place and correctly configured **before** going live.
* Each component is validated to be operational (health checks for services, test calls to APIs, etc.) individually and as part of the whole system.
* The Preprod environment uses **test ADA (tADA)** exclusively for both service payments and fee payments, with no stablecoin needed.
* You have a clear mapping of configuration values and have secured all sensitive information.
* There is a strategy to test the full payment loop and observe on-chain logging of agent decisions, which we accomplished using curl and the Purchase API to simulate a buyer.
* Potential pitfalls have been addressed, and security measures are instituted appropriate to a production scenario (even if it’s just testnet now – better to practice safe deployment early).

Armed with this **checklist and playbook**, you can confidently deploy your AI agent to Masumi’s Preprod testnet via your own private UI, and later transition to mainnet with minimal changes. Always refer to Masumi’s official docs for the latest updates and double-check steps as the ecosystem evolves, but as of June 2025 this guide reflects the current best practices and requirements for a full Masumi integration deployment. Good luck with your AI agent deployment, and happy testing on Masumi! 🚀

**Sources:**

* Masumi Documentation – *Quickstart & Installation*
* Masumi Docs – *Wallets & Preprod Environment*
* Masumi Docs – *Registry & Payment API Reference*
* Masumi Docs – *CrewAI Integration Guide (MIP-003 Endpoints)*
* Masumi Core Concepts – *Decision Logging and Payments*
* Masumi Best Practices – *Security and Key Management*
