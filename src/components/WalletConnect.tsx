import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Shield, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContextLite";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface WalletConnectProps {
  fullWidth?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export const WalletConnect = ({ fullWidth = false, variant = "outline" }: WalletConnectProps) => {
  const { 
    walletAddress, 
    isAdmin, 
    isConnecting, 
    availableWallets,
    connectedWallet,
    connectWallet, 
    disconnectWallet, 
    error 
  } = useWallet();
  const navigate = useNavigate();

  // When wallet is connected, automatically navigate to dashboard
  useEffect(() => {
    if (walletAddress) {
      // Small delay to show connection success before navigation
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [walletAddress, navigate]);

  // Show error if there is one
  useEffect(() => {
    if (error) {
      console.error("Wallet error:", error);
      // You could add a toast notification here
    }
  }, [error]);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  // If wallet is connected
  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-md text-sm">
            <Shield className="h-3 w-3" />
            Admin
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={variant} 
              size="sm" 
              className={fullWidth ? "w-full" : "text-white border-white hover:bg-white hover:text-black"}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {formatAddress(walletAddress)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Connected via {connectedWallet}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              disconnectWallet();
              navigate("/");
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // No wallets available
  if (availableWallets.length === 0) {
    return (
      <Button 
        variant={variant} 
        size={fullWidth ? "default" : "sm"} 
        className={fullWidth ? "w-full" : "text-white border-white hover:bg-white hover:text-black"}
        onClick={() => window.open('https://namiwallet.io', '_blank')}
      >
        <Wallet className="h-4 w-4 mr-2" />
        Install Wallet
      </Button>
    );
  }

  // Single wallet available
  if (availableWallets.length === 1) {
    return (
      <Button
        variant={variant}
        size={fullWidth ? "default" : "sm"}
        className={fullWidth ? "w-full" : "text-white border-white hover:bg-white hover:text-black"}
        onClick={() => connectWallet(availableWallets[0].key)}
        disabled={isConnecting}
      >
        <Wallet className="h-4 w-4 mr-2" />
        {isConnecting ? 'Connecting...' : `Connect ${availableWallets[0].name}`}
      </Button>
    );
  }

  // Multiple wallets available
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={fullWidth ? "default" : "sm"} 
          className={fullWidth ? "w-full" : "text-white border-white hover:bg-white hover:text-black"}
          disabled={isConnecting}
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          Select a wallet
        </div>
        <DropdownMenuSeparator />
        {availableWallets.map((wallet) => (
          <DropdownMenuItem 
            key={wallet.key} 
            onClick={() => connectWallet(wallet.key)}
            disabled={isConnecting}
          >
            {wallet.icon && (
              <img 
                src={wallet.icon} 
                alt={wallet.name} 
                className="h-4 w-4 mr-2" 
              />
            )}
            {wallet.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 