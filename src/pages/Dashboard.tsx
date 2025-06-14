import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletConnect } from "@/components/WalletConnect";
import { Bot, MessageSquare, User, Shield, CheckCircle, AlertCircle, Zap, Search, Clock, Wallet, Settings, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContextLite";
import { toast } from "sonner";
import { AgentSelectionModal } from "@/components/AgentSelectionModal";
import { type MasumiAgent } from "@/lib/masumi-agent-discovery";

interface AgentConfig {
  businessContext: string;
  documents: File[];
}

interface ActiveAgent {
  agent: MasumiAgent;
  config: AgentConfig;
  activatedAt: string;
  paymentReceipt?: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { walletAddress, isAdmin } = useWallet();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<ActiveAgent | null>(null);
  const [agentStats, setAgentStats] = useState({
    totalQueries: 0,
    avgResponseTime: "< 1s",
    customerSatisfaction: "N/A",
    lastActivity: null as string | null
  });

  // Note: Removed wallet redirect for demo mode
  // Users can now access dashboard without wallet to browse agents
  // Wallet connection is only required for actual payments

  // Load active agent from localStorage on mount
  useEffect(() => {
    loadActiveAgent();
  }, []);

  const loadActiveAgent = () => {
    try {
      const savedAgent = localStorage.getItem('masumi-active-agent');
      const savedReceipt = localStorage.getItem('masumi-payment-receipt');
      
      if (savedAgent) {
        const agentData = JSON.parse(savedAgent);
        const receiptData = savedReceipt ? JSON.parse(savedReceipt) : null;
        
        setActiveAgent({
          ...agentData,
          paymentReceipt: receiptData
        });
        
        toast.success(`Loaded active agent: ${agentData.agent.name}`);
      }
    } catch (error) {
      console.error('Failed to load active agent:', error);
    }
  };

  const handleAgentSelected = (agent: MasumiAgent, config: AgentConfig) => {
    const activeAgentData: ActiveAgent = {
      agent,
      config,
      activatedAt: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('masumi-active-agent', JSON.stringify(activeAgentData));
    
    setActiveAgent(activeAgentData);
    toast.success(`Agent "${agent.name}" is now active and ready to help customers!`);
  };

  const handleDeactivateAgent = () => {
    localStorage.removeItem('masumi-active-agent');
    localStorage.removeItem('masumi-payment-receipt');
    setActiveAgent(null);
    setAgentStats({
      totalQueries: 0,
      avgResponseTime: "< 1s",
      customerSatisfaction: "N/A",
      lastActivity: null
    });
    toast.success("Agent deactivated");
  };

  const getPriceDisplay = (agent: MasumiAgent) => {
    const pricing = agent.AgentPricing?.FixedPricing?.Amounts?.[0];
    if (!pricing) return "Free";
    
    const amount = parseInt(pricing.amount);
    if (pricing.unit === 'lovelace' || pricing.unit === '') {
      return `${amount / 1000000} ADA`;
    }
    return `${amount} ${pricing.unit}`;
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.includes('_')) {
      const parts = address.split('_');
      return `${parts[0]} (${parts[1]})`;
    }
    return `${address.slice(0, 15)}...${address.slice(-15)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold">AI HelpDesk</span>
            </Button>
            <nav className="flex space-x-4">
              <Button variant="ghost" className="text-foreground">Dashboard</Button>
              <Button variant="ghost" onClick={() => navigate("/support")}>Support Portal</Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Badge variant="default" className="bg-blue-600">
                <Shield className="h-3 w-3 mr-1" />
                Admin Mode
              </Badge>
            )}
            <ThemeToggle />
            {walletAddress ? (
              <WalletConnect />
            ) : (
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Admin Notice */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-semibold text-blue-500">Admin Mode Active</p>
              <p className="text-sm text-muted-foreground">
                You have unlimited access to all platform features without subscription requirements.
              </p>
            </div>
          </div>
        )}
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Agent Dashboard</h1>
          <p className="text-muted-foreground">Find and activate AI agents from the Masumi network</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {!activeAgent ? (
              /* No Active Agent */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Find AI Agent</span>
                  </CardTitle>
                  <CardDescription>
                    Discover and activate an AI agent from the Masumi network to power your customer support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Active Agent</h3>
                    <p className="text-muted-foreground mb-6">
                      Find and activate an AI agent to start providing intelligent customer support.
                    </p>
                    <Button onClick={() => setIsAgentModalOpen(true)} size="lg">
                      <Search className="h-4 w-4 mr-2" />
                      Find Agent
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-3">How it works:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium">Browse Available Agents</p>
                          <p className="text-sm text-muted-foreground">Discover AI agents on the Masumi network with different capabilities</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium">Select & Configure</p>
                          <p className="text-sm text-muted-foreground">Choose an agent and provide your business context</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium">Pay & Activate</p>
                          <p className="text-sm text-muted-foreground">Pay the agent fee from your connected wallet</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                        <div>
                          <p className="font-medium">Start Helping Customers</p>
                          <p className="text-sm text-muted-foreground">Your agent is ready to answer customer questions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Active Agent Dashboard */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Active Agent</span>
                  </CardTitle>
                  <CardDescription>
                    Your AI agent is active and ready to help customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Agent Info */}
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{activeAgent.agent.name}</h3>
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{activeAgent.agent.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span><strong>Capability:</strong> {activeAgent.agent.Capability?.name}</span>
                          <span><strong>Price:</strong> {getPriceDisplay(activeAgent.agent)} per query</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Activated: {new Date(activeAgent.activatedAt).toLocaleString()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDeactivateAgent}>
                        Deactivate
                      </Button>
                    </div>
                  </div>

                  {/* Business Context */}
                  <div>
                    <h4 className="font-semibold mb-2">Business Context</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{activeAgent.config.businessContext}</p>
                    </div>
                  </div>

                  {/* Uploaded Documents */}
                  {activeAgent.config.documents.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {activeAgent.config.documents.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                            <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Button onClick={() => navigate("/support")} className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Test Agent
                    </Button>
                    <Button variant="outline" onClick={() => setIsAgentModalOpen(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Change Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Active Agent</span>
                  <span className="font-semibold">{activeAgent ? 1 : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Queries</span>
                  <span className="font-semibold">{agentStats.totalQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="font-semibold">{agentStats.avgResponseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Satisfaction</span>
                  <span className="font-semibold">{agentStats.customerSatisfaction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Network</span>
                  <span className="font-semibold text-orange-500">Preprod</span>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Connected</span>
                  <span className="font-semibold">{walletAddress ? 'Yes' : 'No'}</span>
                </div>
                {walletAddress && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Address</span>
                      <span className="text-xs font-mono">{formatAddress(walletAddress)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Network</span>
                      <span className="text-orange-500 font-medium">Preprod</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Receipt */}
            {activeAgent?.paymentReceipt && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Payment Receipt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Amount</span>
                    <span className="font-semibold">{activeAgent.paymentReceipt.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Date</span>
                    <span className="text-xs">{new Date(activeAgent.paymentReceipt.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    TX: {activeAgent.paymentReceipt.txHash}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Agent Selection Modal */}
      <AgentSelectionModal
        open={isAgentModalOpen}
        onOpenChange={setIsAgentModalOpen}
        onAgentSelected={handleAgentSelected}
      />
    </div>
  );
};

export default Dashboard;
