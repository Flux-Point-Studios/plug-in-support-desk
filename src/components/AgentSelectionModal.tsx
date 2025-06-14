import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Bot, 
  Wallet, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Zap,
  Clock,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  DollarSign,
  User,
  Sparkles,
  Brain,
  Code,
  Mail,
  Palette,
  FileText,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { 
  discoverAgents, 
  findSupportAgents, 
  startAgentJob,
  type MasumiAgent 
} from "@/lib/masumi-agent-discovery";
import { buildMasumiPaymentTx, checkSufficientBalance, waitForTxConfirmation } from '@/lib/masumi-transaction-builder';
import { formatAddress } from '@/lib/masumi-address-utils';
import { useNavigate } from 'react-router-dom';

interface AgentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentSelected: (agent: MasumiAgent, config: AgentConfig) => void;
}

interface AgentConfig {
  businessContext: string;
  documents: File[];
}

export function AgentSelectionModal({ open, onOpenChange, onAgentSelected }: AgentSelectionModalProps) {
  const navigate = useNavigate();
  const { walletAddress, paymentKeyHash, isAdmin, availableWallets, connectedWallet, connectWallet, isConnecting, lucid, error } = useWallet();
  const [agents, setAgents] = useState<MasumiAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<MasumiAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSupportOnly, setShowSupportOnly] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<MasumiAgent | null>(null);
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage] = useState(10);
  
  // Configuration state
  const [businessContext, setBusinessContext] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      loadAgents();
    }
  }, [open]);

  useEffect(() => {
    filterAgents();
    setCurrentPage(1); // Reset to first page when filters change
  }, [agents, searchTerm, showSupportOnly]);

  // Handle wallet connection errors
  useEffect(() => {
    if (error) {
      toast.error(`Wallet connection failed: ${error}`);
    }
  }, [error]);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const allAgents = await discoverAgents(50);
      setAgents(allAgents);
      toast.success(`Found ${allAgents.length} agents on Masumi network`);
    } catch (error: any) {
      toast.error(`Failed to load agents: ${error.message}`);
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = agents;

    // Filter by support capability if enabled
    if (showSupportOnly) {
      const supportKeywords = ['support', 'help', 'doc', 'faq', 'assist', 'customer', 'qa', 'question'];
      filtered = agents.filter(agent => {
        const agentText = `${agent.name} ${agent.description} ${agent.Capability?.name || ''} ${agent.Tags?.join(' ') || ''}`.toLowerCase();
        return supportKeywords.some(keyword => agentText.includes(keyword)) || 
               agent.name.toLowerCase().includes('website') || // Website builder can help with support pages
               agent.name.toLowerCase().includes('email') ||   // Email agents can help with support
               agent.name.toLowerCase().includes('meeting');   // Meeting agents can help with support
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.Capability?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.Tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Only show online agents
    filtered = filtered.filter(agent => agent.status === 'Online');

    setFilteredAgents(filtered);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);

  const getPriceDisplay = (agent: MasumiAgent) => {
    const pricing = agent.AgentPricing?.FixedPricing?.Amounts?.[0];
    if (!pricing) return { display: "Free", ada: 0 };
    
    const amount = parseInt(pricing.amount);
    if (pricing.unit === 'lovelace' || pricing.unit === '') {
      const ada = amount / 1000000;
      return { display: `${ada} ADA`, ada };
    }
    return { display: `${amount} ${pricing.unit}`, ada: 0 };
  };

  const handleAgentSelect = (agent: MasumiAgent) => {
    setSelectedAgent(agent);
    setIsPaymentStep(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handlePayAndActivate = async () => {
    if (!selectedAgent || !businessContext.trim()) return;

    setIsProcessingPayment(true);

    try {
      // Prepare configuration
      const config: AgentConfig = {
        businessContext,
        documents: uploadedFiles
      };

      // Check if real payment is needed
      const price = getPriceDisplay(selectedAgent);
      let needsPayment = price.ada > 0 && !isAdmin;
      let jobId: string | undefined;
      let paymentIdentifier: string | undefined;
      let lovelaceAmount: string | undefined;

      if (needsPayment && lucid) {
        // Use real transaction
        try {
          toast.info("Starting job with agent...");
          
          // 1. Start job to get payment details
          const inputData: Record<string, string> = {
            // Use generic input that works with most agents
            text: businessContext,
            query: businessContext,
            website_description: businessContext,
            message: businessContext
          };

          const jobResponse = await startAgentJob(selectedAgent.apiBaseUrl, inputData);
          jobId = jobResponse.job_id;
          paymentIdentifier = jobResponse.paymentIdentifier;
          lovelaceAmount = jobResponse.lovelaceAmount;
          
          toast.info(`Job started: ${jobId.substring(0, 8)}...`);
          
          // 2. Check balance
          toast.info("Checking wallet balance...");
          const lovelaceAmountBigInt = BigInt(lovelaceAmount);
          const balanceCheck = await checkSufficientBalance(lucid, lovelaceAmountBigInt);
          
          if (!balanceCheck.sufficient) {
            const adaRequired = Number(balanceCheck.required) / 1_000_000;
            const adaAvailable = Number(balanceCheck.available) / 1_000_000;
            throw new Error(`Insufficient balance. Need: ${adaRequired} ADA, have: ${adaAvailable} ADA`);
          }

          // 3. Build and submit transaction
          toast.info("Building transaction...");
          const txHash = await buildMasumiPaymentTx(lucid, paymentIdentifier, lovelaceAmountBigInt, {
            agentId: selectedAgent.agentIdentifier,
            jobId,
            businessContext: businessContext.substring(0, 64), // Limit metadata size
            timestamp: new Date().toISOString()
          });

          toast.success(`Transaction submitted! Hash: ${txHash.substring(0, 8)}...`);
          
          // 4. Wait for confirmation
          toast.info("Waiting for confirmation...");
          const confirmed = await waitForTxConfirmation(lucid, txHash);
          
          if (confirmed) {
            toast.success("Transaction confirmed on-chain!");
          }
          
          // Store real payment receipt
          const paymentReceipt = {
            agentId: selectedAgent.agentIdentifier,
            jobId,
            amount: price.display,
            lovelaceAmount,
            timestamp: new Date().toISOString(),
            txHash,
            network: 'Preprod',
            paymentIdentifier
          };

          localStorage.setItem('masumi-payment-receipt', JSON.stringify(paymentReceipt));
          
        } catch (txError: any) {
          console.error('Transaction failed:', txError);
          toast.error(`Transaction failed: ${txError.message}`);
          
          // Ask if user wants to continue with simulation
          if (confirm('Transaction failed. Continue with payment simulation for testing?')) {
            needsPayment = false; // Skip to simulation
          } else {
            throw txError;
          }
        }
      } else if (needsPayment) {
        // Show warning about payment implementation
        toast.info(
          "Note: Real wallet transactions require Lucid Evolution. Using payment simulation for testing.",
          { duration: 5000 }
        );
      }

      // Store simulated payment receipt if not using real tx
      if (!lucid || !needsPayment) {
        const paymentReceipt = {
          agentId: selectedAgent.agentIdentifier,
          amount: price.display,
          timestamp: new Date().toISOString(),
          txHash: isAdmin ? 'admin_bypass' : `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          simulated: true,
          network: 'Preprod'
        };

        localStorage.setItem('masumi-payment-receipt', JSON.stringify(paymentReceipt));
      }
      
      // Store the activated agent configuration
      const activatedAgent = {
        agent: selectedAgent,
        config,
        activatedAt: new Date().toISOString(),
        paymentReceipt: JSON.parse(localStorage.getItem('masumi-payment-receipt') || '{}')
      };
      
      localStorage.setItem('masumi-active-agent', JSON.stringify(activatedAgent));
      
      // Notify parent component
      onAgentSelected(selectedAgent, config);
      
      toast.success(`Agent "${selectedAgent.name}" activated successfully!`);
      onOpenChange(false);
      
      // Reset modal state
      setSelectedAgent(null);
      setIsPaymentStep(false);
      setBusinessContext("");
      setUploadedFiles([]);

    } catch (error: any) {
      toast.error(`Activation failed: ${error.message}`);
      console.error('Activation error:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => {
    setSelectedAgent(null);
    setIsPaymentStep(false);
  };

  const getCapabilityBadgeColor = (capability: string) => {
    const cap = capability.toLowerCase();
    if (cap.includes('support') || cap.includes('help')) return 'bg-green-500';
    if (cap.includes('design') || cap.includes('creative')) return 'bg-purple-500';
    if (cap.includes('website') || cap.includes('development')) return 'bg-blue-500';
    if (cap.includes('email') || cap.includes('marketing')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>{isPaymentStep ? 'Activate Agent' : 'Find AI Agent'}</span>
          </DialogTitle>
          <DialogDescription>
            {isPaymentStep 
              ? `Configure and activate ${selectedAgent?.name}`
              : 'Discover and select an AI agent from the Masumi network'
            }
          </DialogDescription>
        </DialogHeader>

        {!isPaymentStep ? (
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search agents</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search agents by name, capability, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="support-filter"
                  checked={showSupportOnly}
                  onChange={(e) => setShowSupportOnly(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="support-filter" className="text-sm whitespace-nowrap">
                  Support-focused only
                </Label>
              </div>
              <Button onClick={loadAgents} variant="outline" size="sm">
                <Bot className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Agent Grid */}
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Discovering agents...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-4">
                  {currentAgents.map((agent, index) => {
                    const price = getPriceDisplay(agent);
                    return (
                      <Card key={agent.agentIdentifier || index} className="cursor-pointer hover:bg-accent/50 transition-colors h-fit">
                        <CardHeader className="pb-3">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1 mr-4">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <CardTitle className="text-lg leading-tight">{agent.name}</CardTitle>
                                  <Badge variant={agent.status === 'Online' ? 'default' : 'secondary'} className="text-xs">
                                    {agent.status}
                                  </Badge>
                                  <Badge 
                                    className={`text-xs text-white ${getCapabilityBadgeColor(agent.Capability?.name || '')}`}
                                  >
                                    {agent.Capability?.name || 'General AI'}
                                  </Badge>
                                </div>
                                <CardDescription className="text-sm leading-relaxed">
                                  {agent.description}
                                </CardDescription>
                              </div>
                              <div className="text-right space-y-2 flex-shrink-0">
                                <div className="text-xl font-bold text-primary">
                                  {price.display}
                                </div>
                                <div className="text-xs text-muted-foreground">per query</div>
                              </div>
                            </div>

                            {/* Tags */}
                            {agent.Tags && agent.Tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {agent.Tags.slice(0, 6).map((tag, tagIndex) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {agent.Tags.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{agent.Tags.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Agent Details */}
                            <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                              {agent.Capability?.version && (
                                <div className="flex justify-between">
                                  <span>Version:</span>
                                  <span>{agent.Capability.version}</span>
                                </div>
                              )}
                              {agent.authorName && (
                                <div className="flex justify-between">
                                  <span>Author:</span>
                                  <span>{agent.authorName}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Network:</span>
                                <span className="text-orange-500">Cardano Preprod</span>
                              </div>
                            </div>

                            {/* Select Button */}
                            <Button
                              size="sm"
                              onClick={() => handleAgentSelect(agent)}
                              className="w-full mt-3"
                            >
                              <Wallet className="h-3 w-3 mr-2" />
                              Select & Pay {price.display}
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                  
                  {!isLoading && filteredAgents.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No agents found matching your criteria.</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Pagination Controls */}
            {!isLoading && filteredAgents.length > 0 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {indexOfFirstAgent + 1}-{Math.min(indexOfLastAgent, filteredAgents.length)} of {filteredAgents.length} agents
                  <span className="ml-2">• Network: Masumi Preprod</span>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={prevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Payment and Configuration Step */
          <div className="space-y-6">
            {/* Selected Agent Info */}
            <Card className="bg-accent/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span>{selectedAgent?.name}</span>
                      <Badge variant="default">Selected</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedAgent?.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {getPriceDisplay(selectedAgent!).display}
                    </div>
                    <div className="text-xs text-muted-foreground">per query</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Configuration Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="business-context">Business Context *</Label>
                <Textarea
                  id="business-context"
                  placeholder="Describe your business and how this agent should help your customers. e.g., 'We're a SaaS company providing project management tools. Help customers with feature questions, integrations, and troubleshooting...'"
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="documentation">Upload Documentation (Optional)</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <Input
                    id="documentation"
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('documentation')?.click()}
                  >
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload files that will help the agent understand your product/service
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{file.name}</span>
                        <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Agent Fee:</span>
                  <span className="font-semibold">{getPriceDisplay(selectedAgent!).display}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="text-orange-500 font-medium">Cardano Preprod</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Wallet:</span>
                  {walletAddress ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono">
                        {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                      </span>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Not connected</span>
                      {availableWallets.length > 0 && (
                        <>
                          {availableWallets.length === 1 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => connectWallet(availableWallets[0].key)}
                              disabled={isConnecting}
                              className="h-6 px-2 text-xs"
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Wallet className="h-3 w-3 mr-1" />
                                  Connect {availableWallets[0].name}
                                </>
                              )}
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isConnecting}
                                  className="h-6 px-2 text-xs"
                                >
                                  {isConnecting ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <Wallet className="h-3 w-3 mr-1" />
                                      Connect Wallet
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <div className="px-2 py-1.5 text-xs text-muted-foreground">
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
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Admin mode: Payment will be bypassed</span>
                  </div>
                )}
                {!walletAddress && (
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Please connect your Preprod wallet to continue</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleBack} disabled={isProcessingPayment}>
                Back to Agents
              </Button>
              <Button 
                onClick={handlePayAndActivate} 
                disabled={!businessContext.trim() || !walletAddress || isProcessingPayment}
                className="flex-1"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Activate Agent (Admin)' : `Pay ${getPriceDisplay(selectedAgent!).display} & Activate`}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 