import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletInfo {
  key: string;
  name: string;
  icon?: string;
}

interface WalletContextType {
  walletAddress: string | null;
  paymentKeyHash: string | null;
  isAdmin: boolean;
  isConnecting: boolean;
  availableWallets: WalletInfo[];
  connectedWallet: string | null;
  connectWallet: (walletKey: string) => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string | null>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Admin wallet address from environment variable
const ADMIN_WALLET_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS || "addr1q9s6m9d8yedfcf53yhq5j5zsg0s58wpzamwexrxpfelgz2wgk0s9l9fqc93tyc8zu4z7hp9dlska2kew9trdg8nscjcq3sk5s3";

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [paymentKeyHash, setPaymentKeyHash] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Detect available wallets
  useEffect(() => {
    const detectWallets = () => {
      const wallets: WalletInfo[] = [];
      
      if (typeof window !== 'undefined' && window.cardano) {
        // Check for various Cardano wallets
        const walletChecks = [
          { key: 'nami', name: 'Nami' },
          { key: 'eternl', name: 'Eternl' },
          { key: 'flint', name: 'Flint' },
          { key: 'yoroi', name: 'Yoroi' },
          { key: 'lace', name: 'Lace' },
          { key: 'typhon', name: 'Typhon' },
          { key: 'gerowallet', name: 'GeroWallet' },
          { key: 'ccvault', name: 'Eternl (CCVault)' }
        ];

        walletChecks.forEach(({ key, name }) => {
          const walletApi = window.cardano?.[key];
          if (walletApi && typeof walletApi.enable === 'function') {
            wallets.push({
              key,
              name: walletApi.name || name,
              icon: walletApi.icon
            });
          }
        });
      }

      setAvailableWallets(wallets);
    };

    // Check immediately and after delays for slow-loading extensions
    detectWallets();
    const timer1 = setTimeout(detectWallets, 1000);
    const timer2 = setTimeout(detectWallets, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const connectWallet = async (walletKey: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if wallet exists
      const walletApi = window.cardano?.[walletKey];
      if (!walletApi) {
        throw new Error(`Wallet ${walletKey} not found. Please ensure it's installed and enabled.`);
      }

      console.log(`Connecting to ${walletKey} wallet...`);

      // Enable the wallet
      const api = await walletApi.enable();
      if (!api) {
        throw new Error("Failed to connect to wallet. Please try again.");
      }

      // Get the used addresses
      const usedAddresses = await api.getUsedAddresses();
      if (!usedAddresses || usedAddresses.length === 0) {
        throw new Error("No addresses found in wallet");
      }

      // Get first address and convert from hex to bech32
      const addressHex = usedAddresses[0];
      
      // For now, use a simplified approach - we'll display the bech32 if available, otherwise hex
      let displayAddress = addressHex;
      try {
        // Try to get bech32 address if the wallet supports it
        const rewardAddresses = await api.getRewardAddresses();
        if (rewardAddresses && rewardAddresses.length > 0) {
          // Use a more readable format
          displayAddress = `addr1...${addressHex.slice(-20)}`;
        }
      } catch (e) {
        // Fallback to simplified hex display
        displayAddress = `${walletKey}_${addressHex.slice(0, 20)}...${addressHex.slice(-20)}`;
      }

      setWalletAddress(displayAddress);
      setPaymentKeyHash(addressHex.slice(0, 56)); // Simplified payment key hash
      
      // Check if this is the admin wallet
      const isAdminWallet = displayAddress === ADMIN_WALLET_ADDRESS || addressHex === ADMIN_WALLET_ADDRESS;
      setIsAdmin(isAdminWallet);
      
      // Store connection info
      setConnectedWallet(walletKey);
      localStorage.setItem('walletAddress', displayAddress);
      localStorage.setItem('walletAddressHex', addressHex);
      localStorage.setItem('connectedWallet', walletKey);
      localStorage.setItem('isAdmin', isAdminWallet.toString());
      localStorage.setItem('paymentKeyHash', addressHex.slice(0, 56));
      
      console.log(`Successfully connected to ${walletKey} wallet on Preprod network`);
      
      // Verify network (optional check)
      try {
        const networkId = await api.getNetworkId();
        if (networkId !== 0) { // 0 = Preprod, 1 = Mainnet
          console.warn(`Wallet is on network ${networkId}, expected Preprod (0)`);
          // Don't throw error, just warn
        }
      } catch (e) {
        // Network check not critical
      }
      
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
      
      // Clean up on error
      setWalletAddress(null);
      setPaymentKeyHash(null);
      setIsAdmin(false);
      setConnectedWallet(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setPaymentKeyHash(null);
    setIsAdmin(false);
    setConnectedWallet(null);
    setError(null);
    
    // Clear storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletAddressHex');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('paymentKeyHash');
    
    console.log("Wallet disconnected");
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!walletAddress || !connectedWallet) {
      setError("No wallet connected");
      return null;
    }

    try {
      const walletApi = window.cardano?.[connectedWallet];
      if (!walletApi) {
        throw new Error("Wallet not found");
      }

      const api = await walletApi.enable();
      const addressHex = localStorage.getItem('walletAddressHex');
      
      if (!addressHex) {
        throw new Error("Address not found");
      }

      // Convert message to hex
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(message);
      const messageHex = Array.from(messageBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Sign the message
      const signature = await api.signData(addressHex, messageHex);
      
      return JSON.stringify(signature);
    } catch (err: any) {
      console.error("Failed to sign message:", err);
      setError(err.message || "Failed to sign message");
      return null;
    }
  };

  // Check for existing wallet connection on mount
  useEffect(() => {
    const restoreConnection = async () => {
      const savedAddress = localStorage.getItem('walletAddress');
      const savedWallet = localStorage.getItem('connectedWallet');
      const savedAdmin = localStorage.getItem('isAdmin');
      const savedPaymentKeyHash = localStorage.getItem('paymentKeyHash');
      
      if (savedAddress && savedWallet) {
        try {
          // Try to restore connection
          const walletApi = window.cardano?.[savedWallet];
          if (walletApi) {
            // Just restore from localStorage without re-enabling
            // User can reconnect if needed
            setWalletAddress(savedAddress);
            setConnectedWallet(savedWallet);
            setIsAdmin(savedAdmin === 'true');
            if (savedPaymentKeyHash) {
              setPaymentKeyHash(savedPaymentKeyHash);
            }
            console.log(`Restored connection to ${savedWallet} wallet`);
          }
        } catch (err) {
          console.error("Failed to restore wallet connection:", err);
          // Clear stored data on error
          disconnectWallet();
        }
      }
    };

    restoreConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        paymentKeyHash,
        isAdmin,
        isConnecting,
        availableWallets,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        signMessage,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 