# Cardano Wallet Integration Guide

This document explains the Cardano wallet integration using Lucid Evolution that has been added to the AI HelpDesk Portal.

## Features

### 1. Wallet Authentication
- Users can connect their Cardano wallet as an alternative to email/password login
- Supports multiple wallet extensions: Nami, Eternl, Flint, Yoroi, Lace, GeroWallet, Typhon
- Wallet connection persists across sessions

### 2. Admin Privileges
When the specific admin wallet address connects, it grants:
- **Unlimited access** to all platform features
- **No subscription required** to create AI agents
- **Admin badge** displayed in the UI
- **Bypass payment requirements**

Admin wallet address:
```
addr1q9s6m9d8yedfcf53yhq5j5zsg0s58wpzamwexrxpfelgz2wgk0s9l9fqc93tyc8zu4z7hp9dlska2kew9trdg8nscjcq3sk5s3
```

## Implementation Details

### Components Added

1. **WalletContext** (`src/contexts/WalletContext.tsx`)
   - Manages wallet connection state
   - Handles Lucid Evolution initialization
   - Checks for admin wallet address
   - Persists connection in localStorage

2. **WalletConnect** (`src/components/WalletConnect.tsx`)
   - UI component for wallet connection
   - Auto-detects available wallet extensions
   - Shows admin badge when admin wallet is connected
   - Supports different button styles

3. **TypeScript Declarations** (`src/types/cardano.d.ts`)
   - Type definitions for window.cardano object
   - Support for multiple wallet extensions

### Integration Points

1. **Login/Signup Page**
   - Wallet connection added as "OR" option
   - Full-width button styling in auth forms

2. **Dashboard**
   - Shows admin badge in header
   - Displays admin notice with privileges
   - Wallet address shown in header when connected

## Configuration

Add these environment variables to your `.env` file:

```env
# Blockfrost API Configuration
VITE_BLOCKFROST_API_KEY=your_blockfrost_api_key
VITE_CARDANO_NETWORK=Mainnet

# Admin Wallet Address
VITE_ADMIN_WALLET_ADDRESS=addr1q9s6m9d8yedfcf53yhq5j5zsg0s58wpzamwexrxpfelgz2wgk0s9l9fqc93tyc8zu4z7hp9dlska2kew9trdg8nscjcq3sk5s3
```

## How It Works

1. **User clicks "Connect Wallet"**
   - Available wallet extensions are detected
   - User selects their wallet (Eternl, Nami, etc.)
   - User approves the connection request

2. **Wallet Connected**
   - Wallet connection is established
   - Admin privileges are automatically granted
   - User is automatically redirected to the Dashboard
   - Connection state is persisted in localStorage

3. **Dashboard Access**
   - Dashboard is protected - requires wallet connection
   - Users without wallet connection are redirected to home
   - Admin badge shows in the header
   - Full access to create and manage AI agents

4. **Disconnection**
   - User can disconnect from the dropdown menu
   - Automatically redirects back to the home page
   - Clears stored connection state

## Security Considerations

1. **Admin Privileges**: Currently all connected wallets get admin access - in production, verify against actual wallet addresses
2. **Address Verification**: Implement proper address decoding to verify specific admin wallets
3. **Blockfrost Key**: Should be stored securely in environment variables
4. **Session Persistence**: Uses localStorage - consider more secure options for production

## Testing

1. Install a Cardano wallet extension (e.g., Eternl, Nami)
2. Click "Connect Wallet" in the login section
3. Approve the connection request in your wallet
4. Verify automatic redirect to the Dashboard
5. Check that the admin badge appears in the header
6. Test creating an AI agent
7. Test disconnect - should redirect back to home page

## Future Enhancements

1. **Multi-sig admin wallets**: Support for multiple admin addresses
2. **Role-based access**: Different permission levels based on NFT holdings
3. **On-chain subscription**: Handle subscriptions via smart contracts
4. **Wallet-based authentication**: Replace traditional auth completely 