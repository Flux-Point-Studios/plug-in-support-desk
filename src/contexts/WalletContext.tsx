import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { LucidEvolution, Network } from '@lucid-evolution/lucid';

interface WalletInfo {
  key: string;
  name: string;
  icon?: string;
}

interface WalletContextType {
  lucid: LucidEvolution | null;
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

// Hardcoded values for hackathon - DELETE THESE AFTER!
const ADMIN_WALLET_ADDRESS = "addr1q9s6m9d8yedfcf53yhq5j5zsg0s58wpzamwexrxpfelgz2wgk0s9l9fqc93tyc8zu4z7hp9dlska2kew9trdg8nscjcq3sk5s3";

// Blockfrost configuration for Preprod - HARDCODED FOR HACKATHON
const BLOCKFROST_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_PROJECT_ID = "preprodqfu8fUmYnHk0lj5FBg8Gq9vuxDDJ8qSz";
const NETWORK = "Preprod" as Network;

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lucid, setLucid] = useState<LucidEvolution | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [paymentKeyHash, setPaymentKeyHash] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize Lucid on mount - DISABLED FOR HACKATHON DUE TO BUILD ISSUES
  useEffect(() => {
    const initLucid = async () => {
      try {
        console.log('Lucid initialization disabled for hackathon - wallet features will use simulation mode');
        // COMMENTED OUT DUE TO PRODUCTION BUILD ISSUES WITH LUCID-EVOLUTION
        // The library has class inheritance issues in Vite production builds
        /*
        console.log('Initializing Lucid with:', {
          url: BLOCKFROST_URL,
          network: NETWORK,
          hasApiKey: !!BLOCKFROST_PROJECT_ID
        });
        
        // Dynamic import to avoid initialization errors
        const { Lucid, Blockfrost } = await import('@lucid-evolution/lucid');
        
        const lucidInstance = await Lucid(
          new Blockfrost(BLOCKFROST_URL, BLOCKFROST_PROJECT_ID),
          NETWORK
        );
        setLucid(lucidInstance);
        console.log('Lucid initialized successfully');
        */
        
        // For hackathon demo, we'll use simulation mode
        setError(null);
      } catch (err) {
        console.error("Failed to initialize Lucid:", err);
        setError("Wallet features running in simulation mode");
        // Don't let this crash the app - wallet features just won't work
      }
    };

    initLucid();
  }, []);

  // Detect available wallets
  useEffect(() => {
    const detectWallets = () => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.cardano) {
        console.log('No window.cardano detected yet');
        return;
      }
      
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
      // SIMULATION MODE FOR HACKATHON
      if (!lucid) {
        console.log("Running in wallet simulation mode for hackathon");
        
        // Generate a simulated address for demo
        const simulatedAddress = `addr_test1_${walletKey}_${Math.random().toString(36).substring(2, 15)}`;
        
        setWalletAddress(simulatedAddress);
        setPaymentKeyHash(simulatedAddress.slice(0, 56));
        
        // Check if this is the admin wallet (for demo purposes)
        if (walletKey === 'admin' || simulatedAddress === ADMIN_WALLET_ADDRESS) {
          setIsAdmin(true);
          localStorage.setItem('isAdmin', 'true');
        }
        
        setConnectedWallet(walletKey);
        localStorage.setItem('walletAddress', simulatedAddress);
        localStorage.setItem('connectedWallet', walletKey);
        
        console.log(`Simulated connection to ${walletKey} wallet`);
        console.log(`Simulated Address: ${simulatedAddress}`);
        setError("Demo Mode: Wallet payments will be simulated");
        
        setIsConnecting(false);
        return;
      }

      // ORIGINAL CODE (kept for reference but won't execute)
      // Check if wallet exists
      const walletApi = window.cardano?.[walletKey];
      if (!walletApi) {
        throw new Error(`Wallet ${walletKey} not found. Please ensure it's installed and enabled.`);
      }

      // Enable the wallet (always call enable to get the API)
      const api = await walletApi.enable();
      if (!api) {
        throw new Error("Failed to connect to wallet. Please try again.");
      }

      // Select the wallet in Lucid
      lucid.selectWallet.fromAPI(api);
      
      // Get the wallet address
      const address = await lucid.wallet().address();
      setWalletAddress(address);
      
      // Get payment key hash (for backend identification)
      try {
        // For now, we'll store a simplified identifier
        // In production, you'd use proper address parsing libraries
        const addressHash = address.slice(0, 56); // First 56 chars as identifier
        setPaymentKeyHash(addressHash);
      } catch (err) {
        console.warn("Could not extract payment key hash:", err);
      }
      
      // Check if this is the admin wallet
      if (address === ADMIN_WALLET_ADDRESS) {
        setIsAdmin(true);
        localStorage.setItem('isAdmin', 'true');
      }
      
      // Store wallet connection info
      setConnectedWallet(walletKey);
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('connectedWallet', walletKey);
      
      console.log(`Successfully connected to ${walletKey} wallet`);
      console.log(`Address: ${address}`);
      console.log(`Payment Key Hash: ${paymentKeyHash || 'N/A'}`);
      
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
  };

  const signMessage = async (message: string): Promise<string | null> => {
    if (!walletAddress) {
      setError("No wallet connected");
      return null;
    }

    // SIMULATION MODE FOR HACKATHON
    if (!lucid) {
      console.log("Simulating message signing for hackathon");
      // Return a simulated signature
      const simulatedSignature = {
        signature: `sim_sig_${btoa(message).substring(0, 20)}`,
        key: walletAddress,
        message: message
      };
      return JSON.stringify(simulatedSignature);
    }

    // ORIGINAL CODE (kept for reference but won't execute)
    try {
      const signature = await lucid.wallet().signMessage(walletAddress, message);
      // Convert SignedMessage to string representation
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
      if (savedAdmin === 'true' && savedAddress === ADMIN_WALLET_ADDRESS) {
        setIsAdmin(true);
      }
      
      // Try to extract payment key hash from saved address
      if (lucid && savedAddress) {
        try {
          // For now, we'll store a simplified identifier
          const addressHash = savedAddress.slice(0, 56); // First 56 chars as identifier
          setPaymentKeyHash(addressHash);
        } catch (err) {
          console.warn("Could not extract payment key hash from saved address:", err);
        }
      }
    }
  }, [lucid]);

  return (
    <WalletContext.Provider
      value={{
        lucid,
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