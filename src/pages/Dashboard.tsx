import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletConnect } from "@/components/WalletConnect";
import { Bot, Upload, Settings, MessageSquare, Plus, FileText, User, Shield, Copy, CheckCircle, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContextLite";
import { toast } from "sonner";
import { generateAgentConfig, regenerateField } from "@/lib/ai-service";

const Dashboard = () => {
  const navigate = useNavigate();
  const { walletAddress, paymentKeyHash, isAdmin, connectedWallet, signMessage } = useWallet();
  const [businessPrompt, setBusinessPrompt] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentBio, setAgentBio] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [messageToSign, setMessageToSign] = useState("");
  const [signature, setSignature] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  // Redirect to home if no wallet is connected
  useEffect(() => {
    if (!walletAddress) {
      navigate("/");
    }
  }, [walletAddress, navigate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agentName || !agentBio || !agentDescription) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Import the createAgent function
    const { createAgent } = await import('@/lib/agents');
    
    try {
      toast.loading("Creating agent and registering with Masumi...");
      
      const agent = await createAgent({
        name: agentName,
        description: agentDescription,
        bio: agentBio,
        documents: uploadedFiles
      });
      
      toast.dismiss();
      toast.success(`Agent "${agent.name}" created and registered successfully!`);
      
      // Reset form
      setAgentName("");
      setAgentBio("");
      setAgentDescription("");
      setUploadedFiles([]);
      
      // TODO: Refresh agents list
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to create agent");
    }
  };

  const handleSignMessage = async () => {
    if (!messageToSign) {
      toast.error("Please enter a message to sign");
      return;
    }

    const sig = await signMessage(messageToSign);
    if (sig) {
      setSignature(sig);
      toast.success("Message signed successfully!");
    } else {
      toast.error("Failed to sign message");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    // Handle simplified wallet addresses from WalletContextLite
    if (address.includes('_')) {
      const parts = address.split('_');
      return `${parts[0]} (${parts[1]})`;
    }
    return `${address.slice(0, 15)}...${address.slice(-15)}`;
  };

  const handleGenerateAgentConfig = async () => {
    if (!businessPrompt.trim()) {
      toast.error("Please describe your business first");
      return;
    }

    setIsGenerating(true);
    try {
      const suggestions = await generateAgentConfig({ businessPrompt });
      
      setAgentName(suggestions.name);
      setAgentBio(suggestions.bio);
      setAgentDescription(suggestions.description);
      
      toast.success("AI suggestions generated! Feel free to edit them.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateField = async (field: 'name' | 'bio' | 'description') => {
    if (!businessPrompt.trim()) {
      toast.error("Please describe your business first");
      return;
    }

    setIsRegenerating(field);
    try {
      const newValue = await regenerateField(field, businessPrompt, {
        name: agentName,
        bio: agentBio,
        description: agentDescription
      });
      
      switch (field) {
        case 'name':
          setAgentName(newValue);
          break;
        case 'bio':
          setAgentBio(newValue);
          break;
        case 'description':
          setAgentDescription(newValue);
          break;
      }
      
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} regenerated!`);
    } catch (error: any) {
      toast.error(error.message || `Failed to regenerate ${field}`);
    } finally {
      setIsRegenerating(null);
    }
  };

  const mockAgents = [
    {
      id: 1,
      name: "TechSupport Pro",
      bio: "Expert in software troubleshooting",
      status: "active",
      conversations: 143,
      satisfaction: 4.8
    },
    {
      id: 2,
      name: "Product Guide",
      bio: "Specialized in product documentation",
      status: "training",
      conversations: 87,
      satisfaction: 4.6
    }
  ];

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
          <p className="text-muted-foreground">Create and manage your custom AI support agents</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Agent Creation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create New Agent</span>
                </CardTitle>
                <CardDescription>
                  Configure your AI agent with custom knowledge and personality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAgent} className="space-y-6">
                  {/* AI Assistant Section */}
                  <div className="p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">AI Assistant</h3>
                    </div>
                    <div>
                      <Label htmlFor="business-prompt">Describe Your Business</Label>
                      <Textarea
                        id="business-prompt"
                        placeholder="e.g., We're a SaaS company providing project management tools for remote teams. We need help with onboarding, feature questions, and troubleshooting..."
                        value={businessPrompt}
                        onChange={(e) => setBusinessPrompt(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                      <Button
                        type="button"
                        onClick={handleGenerateAgentConfig}
                        disabled={isGenerating || !businessPrompt.trim()}
                        className="mt-3 w-full"
                        variant="secondary"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Agent Configuration
                          </>
                                                  )}
                        </Button>
                      </div>
                      {/* Temporary debug button */}

                    </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="agent-name">Agent Name</Label>
                      {agentName && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRegenerateField('name')}
                          disabled={isRegenerating === 'name'}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating === 'name' ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      )}
                    </div>
                    <Input
                      id="agent-name"
                      placeholder="e.g., TechSupport Pro"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="agent-bio">Agent Bio</Label>
                      {agentBio && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRegenerateField('bio')}
                          disabled={isRegenerating === 'bio'}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating === 'bio' ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      )}
                    </div>
                    <Input
                      id="agent-bio"
                      placeholder="Brief description of your agent's expertise"
                      value={agentBio}
                      onChange={(e) => setAgentBio(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="agent-description">Detailed Description</Label>
                      {agentDescription && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRegenerateField('description')}
                          disabled={isRegenerating === 'description'}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isRegenerating === 'description' ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      )}
                    </div>
                    <Textarea
                      id="agent-description"
                      placeholder="Describe your agent's personality, communication style, and specific knowledge areas..."
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="documentation">Upload Documentation</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drop your files here or click to browse
                      </p>
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
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">Uploaded Files:</p>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                            <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <Bot className="h-4 w-4 mr-2" />
                    Create AI Agent
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Existing Agents */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your AI Agents</CardTitle>
                <CardDescription>Manage your existing support agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAgents.map((agent) => (
                  <div key={agent.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{agent.bio}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{agent.conversations} conversations</span>
                      <span>★ {agent.satisfaction}/5.0</span>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Active Agents</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Conversations</span>
                  <span className="font-semibold">230</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg. Satisfaction</span>
                  <span className="font-semibold">4.7/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="font-semibold">&lt; 1s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
