# Improved Cardano Wallet Integration with Lucid Evolution

This document outlines the improvements made to the Cardano wallet integration based on the Lucid Evolution best practices documentation.

## Key Improvements

### 1. Proper Lucid Evolution Setup
- Initialized Lucid with Blockfrost provider for mainnet/testnet support
- Proper TypeScript typing with `LucidEvolution` type
- Environment-based network configuration (Mainnet/Preprod/Preview)

### 2. Enhanced Wallet Detection
- Automatic detection of all major Cardano wallets:
  - Nami
  - Eternl (handles both `eternl` and legacy `ccvault` keys)
  - Flint
  - Yoroi
  - Lace
  - Typhon
- Wallet metadata (name, icon) retrieved from CIP-30 API
- Graceful handling of missing wallets with "Install Wallet" option

### 3. Improved Wallet Connection Flow
- Dropdown menu for selecting specific wallet when multiple are available
- Single wallet auto-selection when only one is installed
- Proper error handling and user feedback
- Connection state persisted in localStorage

### 4. Address and Payment Key Hash
- Full bech32 address retrieval
- Payment key hash extraction for backend identification
- Simplified hash generation (first 56 chars) for compatibility

### 5. Message Signing Support
- Implementation of `signMessage` function for authentication
- Converts CIP-8/CIP-30 signatures to JSON string format
- Ready for challenge/response authentication flow

### 6. Better User Experience
- Visual wallet icons in selection dropdown
- Connected wallet name displayed in UI
- Copy-to-clipboard functionality for addresses
- Loading states during connection
- Error messages for failed connections

## Environment Configuration

Add these variables to your `.env` file:

```env
# Admin wallet address (gets automatic admin privileges)
VITE_ADMIN_WALLET_ADDRESS=addr1q9s6m9d8yedfcf53yhq5j5zsg0s58wpzamwexrxpfelgz2wgk0s9l9fqc93tyc8zu4z7hp9dlska2kew9trdg8nscjcq3sk5s3

# Cardano network configuration
VITE_CARDANO_NETWORK=Mainnet
VITE_BLOCKFROST_URL=https://cardano-mainnet.blockfrost.io/api/v0
VITE_BLOCKFROST_API_KEY=mainnetBHWQIZCRQnPj9RANqjAEFWvDuSfn5vUw

# For testnet development:
# VITE_CARDANO_NETWORK=Preprod
# VITE_BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
# VITE_BLOCKFROST_API_KEY=preprodYourProjectIdHere
```

## Implementation Details

### WalletContext (`src/contexts/WalletContext.tsx`)
- Full Lucid Evolution integration with proper initialization
- Wallet detection and connection management
- Address and payment key hash retrieval
- Message signing for authentication
- Admin privilege checking

### WalletConnect Component (`src/components/WalletConnect.tsx`)
- Dynamic UI based on available wallets
- Dropdown for multi-wallet selection
- Connection status display
- Automatic navigation to dashboard on connection

### Dashboard Enhancements
- Display wallet address and payment key hash
- Copy-to-clipboard functionality
- Message signing demonstration
- Admin access notifications

## Security Considerations

1. **Private Keys**: Never leave the wallet extension - all signing happens in the browser
2. **Admin Access**: Currently simplified (any wallet gets admin) - implement proper backend verification
3. **Message Signing**: Use for authentication challenges, not for transaction authorization
4. **Network Matching**: Ensure wallet and app are on the same network (mainnet/testnet)

## Future Improvements

1. **Proper Payment Key Hash Extraction**: Use Cardano serialization libraries for accurate hash extraction
2. **Stake Key Support**: Use stake address for more stable user identification
3. **Backend Authentication**: Implement challenge/response flow with signature verification
4. **Multi-Account Support**: Handle wallet account switching gracefully
5. **Mobile Wallet Support**: Add WalletConnect or deep-link support for mobile users

## Common Issues and Solutions

### Module Loading Errors
The Vite configuration already includes necessary plugins:
- `vite-plugin-wasm` for WebAssembly support
- `vite-plugin-top-level-await` for async module loading

### TypeScript Errors
Some Lucid Evolution methods might have different signatures than expected. The current implementation uses workarounds where necessary.

### Wallet Not Detected
- Ensure wallet extension is installed and enabled
- Check after page load (1-second delay implemented)
- Some wallets inject slowly - provide manual refresh option

### Network Mismatch
Always ensure the wallet is on the same network as configured in the app (Mainnet vs Testnet). 