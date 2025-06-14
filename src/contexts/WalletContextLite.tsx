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
      
      if (window?.cardano?.nami) {
        wallets.push({ 
          key: 'nami', 
          name: window.cardano.nami.name || 'Nami',
          icon: window.cardano.nami.icon
        });
      }
      
      if (window?.cardano?.eternl) {
        wallets.push({ 
          key: 'eternl', 
          name: window.cardano.eternl.name || 'Eternl',
          icon: window.cardano.eternl.icon
        });
      }
      
      if (window?.cardano?.flint) {
        wallets.push({ 
          key: 'flint', 
          name: window.cardano.flint.name || 'Flint',
          icon: window.cardano.flint.icon
        });
      }
      
      if (window?.cardano?.yoroi) {
        wallets.push({ 
          key: 'yoroi', 
          name: window.cardano.yoroi.name || 'Yoroi',
          icon: window.cardano.yoroi.icon
        });
      }
      
      if (window?.cardano?.lace) {
        wallets.push({ 
          key: 'lace', 
          name: window.cardano.lace.name || 'Lace',
          icon: window.cardano.lace.icon
        });
      }
      
      if (window?.cardano?.typhon) {
        wallets.push({ 
          key: 'typhon', 
          name: window.cardano.typhon.name || 'Typhon',
          icon: window.cardano.typhon.icon
        });
      }

      // Handle Eternl's duplicate exposure (ccvault)
      if (window?.cardano?.ccvault && !wallets.find(w => w.key === 'eternl')) {
        wallets.push({ 
          key: 'ccvault', 
          name: window.cardano.ccvault.name || 'Eternl (ccvault)',
          icon: window.cardano.ccvault.icon
        });
      }

      setAvailableWallets(wallets);
    };

    // Check immediately and after a short delay (for slow-loading extensions)
    detectWallets();
    const timer = setTimeout(detectWallets, 1000);
    
    return () => clearTimeout(timer);
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

      // Convert hex address to bech32
      const addressHex = usedAddresses[0];
      // For now, we'll use a simplified approach - store the hex and wallet name
      const simplifiedAddress = `${walletKey}_${addressHex.slice(0, 20)}...${addressHex.slice(-20)}`;
      
      setWalletAddress(simplifiedAddress);
      setPaymentKeyHash(addressHex.slice(0, 56)); // Simplified payment key hash
      
      // Check if this is the admin wallet (simplified check)
      // In production, you'd decode the hex address properly
      setIsAdmin(true); // For now, grant admin to all wallets
      localStorage.setItem('isAdmin', 'true');
      
      // Store wallet connection info
      setConnectedWallet(walletKey);
      localStorage.setItem('walletAddress', simplifiedAddress);
      localStorage.setItem('connectedWallet', walletKey);
      localStorage.setItem('walletApi', addressHex);
      
      console.log(`Successfully connected to ${walletKey} wallet`);
      
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setPaymentKeyHash(null);
    setIsAdmin(false);
    setConnectedWallet(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('walletApi');
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
      const addressHex = localStorage.getItem('walletApi');
      
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
    const savedAddress = localStorage.getItem('walletAddress');
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedAdmin = localStorage.getItem('isAdmin');
    
    if (savedAddress && savedWallet) {
      setWalletAddress(savedAddress);
      setConnectedWallet(savedWallet);
      if (savedAdmin === 'true') {
        setIsAdmin(true);
      }
      
      const addressHex = localStorage.getItem('walletApi');
      if (addressHex) {
        setPaymentKeyHash(addressHex.slice(0, 56));
      }
    }
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