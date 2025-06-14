import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Bot, Send, User, AlertCircle, Clock, CheckCircle, 
  Smile, Meh, Frown, ThumbsUp, ThumbsDown, X, Plus,
  TrendingUp, TrendingDown, Minus, PlayCircle, StopCircle, Settings, Zap, TestTube
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHistory } from "@/components/ChatHistory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  SentimentSimulator, 
  sentimentScenarios, 
  calculateAggregateSentiment,
  generateChatResponse,
  type ChatMessage,
  type ChatSession,
  type SentimentData,
  type ServiceLevel,
  type SentimentType
} from "@/lib/sentiment-simulator";
import { sendChatMessage, analyzeMessageSentiment } from "@/lib/chat-service";
import { 
  queryMasumiAgent, 
  getAgentDetails, 
  type MasumiAgent 
} from "@/lib/masumi-agent-discovery";
import { toast } from "sonner";
import { testAllAgents, getBestWorkingAgent, printAgentTestSummary } from "@/lib/test-agents";

const Support = () => {
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    issue: ""
  });
  
  // Masumi agent state
  const [activeAgent, setActiveAgent] = useState<{
    agent: MasumiAgent;
    config: { businessContext: string; documents: File[] };
    activatedAt: string;
    paymentReceipt?: any;
  } | null>(null);
  const [useMasumiAgent, setUseMasumiAgent] = useState(true);
  
  // Sentiment tracking
  const [sentimentHistory, setSentimentHistory] = useState<SentimentData[]>([]);
  const [aggregateSentiment, setAggregateSentiment] = useState<{ average: number; trend: 'up' | 'down' | 'stable' }>({ average: 0.75, trend: 'stable' });
  
  // Simulation controls
  const [simulationScenario, setSimulationScenario] = useState<keyof typeof sentimentScenarios>('balanced');
  const [isSimulating, setIsSimulating] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false); // Default to Masumi
  const simulatorRef = useRef<SentimentSimulator | null>(null);
  
  // Test agents
  const [isTestingAgents, setIsTestingAgents] = useState(false);
  
  // Effect to stop simulation when switching to real AI
  useEffect(() => {
    if ((useRealAI || useMasumiAgent) && isSimulating) {
      simulatorRef.current?.stop();
      setIsSimulating(false);
    }
  }, [useRealAI, useMasumiAgent, isSimulating]);
  
  // Load active Masumi agent on mount
  useEffect(() => {
    loadActiveAgent();
  }, []);
  
  const loadActiveAgent = async () => {
    try {
      const savedAgent = localStorage.getItem('masumi-active-agent');
      if (savedAgent) {
        const agentData = JSON.parse(savedAgent);
        setActiveAgent(agentData);
        toast.success(`Loaded active agent: ${agentData.agent.name}`);
      }
    } catch (error) {
      console.error('Failed to load active agent:', error);
    }
  };
  
  // Get current session
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Initialize simulator
  useEffect(() => {
    simulatorRef.current = new SentimentSimulator();
    
    // Subscribe to sentiment updates
    const unsubscribe = simulatorRef.current.subscribe((data) => {
      setSentimentHistory(prev => [...prev, data]);
    });
    
    // Start with a new session
    startNewSession();
    
    return () => {
      unsubscribe();
      simulatorRef.current?.stop();
    };
  }, []);

  // Update aggregate sentiment when history changes
  useEffect(() => {
    const aggregate = calculateAggregateSentiment(sentimentHistory, 5);
    setAggregateSentiment(aggregate);
  }, [sentimentHistory]);

  const startNewSession = () => {
    const agentName = activeAgent?.agent.name || "AI Support Agent";
    const newSession: ChatSession = {
      id: Date.now().toString(),
      messages: [
        {
          id: '1',
          type: 'bot',
          content: `Hello! I'm ${agentName}. How can I help you today?`,
          timestamp: new Date()
        }
      ],
      startTime: new Date(),
      overallSentiment: 0.5,
      serviceLevel: 'basic',
      isActive: true
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  const closeCurrentSession = () => {
    if (!currentSession) return;
    
    // Calculate overall sentiment from message ratings
    const ratedMessages = currentSession.messages.filter(m => m.sentiment !== undefined);
    const avgSentiment = ratedMessages.length > 0
      ? ratedMessages.reduce((sum, m) => sum + (m.sentiment === 1 ? 1 : m.sentiment === -1 ? 0 : 0.5), 0) / ratedMessages.length
      : 0.5;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id 
        ? { ...s, isActive: false, endTime: new Date(), overallSentiment: avgSentiment }
        : s
    ));
    
    // Start a new session
    startNewSession();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatMessage,
      timestamp: new Date(),
      serviceLevel: currentSession.serviceLevel
    };

    // Add user message
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id 
        ? { ...s, messages: [...s.messages, userMessage] }
        : s
    ));

    // Analyze user message sentiment
    const userSentiment = analyzeMessageSentiment(chatMessage);
    const userSentimentData: SentimentData = {
      score: userSentiment,
      label: userSentiment >= 0.7 ? 'Positive' : userSentiment >= 0.4 ? 'Neutral' : 'Negative',
      level: currentSession.serviceLevel,
      timestamp: new Date(),
      chatId: currentSession.id
    };
    setSentimentHistory(prev => [...prev, userSentimentData]);

    // Get AI response based on selected method
    if (useMasumiAgent && activeAgent) {
      // Use Masumi agent
      try {
        // Add business context to the query if available
        let contextualQuery = chatMessage;
        if (activeAgent.config.businessContext) {
          contextualQuery = `Business Context: ${activeAgent.config.businessContext}\n\nCustomer Question: ${chatMessage}`;
        }

        // Show loading message
        const loadingMessage: ChatMessage = {
          id: (Date.now() + 0.5).toString(),
          type: "bot",
          content: "Let me check that for you... (Processing through Masumi network)",
          timestamp: new Date()
        };

        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, messages: [...s.messages, loadingMessage] }
            : s
        ));

        // Query the Masumi agent
        const response = await queryMasumiAgent(activeAgent.agent, contextualQuery);

        // Replace loading message with actual response
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: response,
          timestamp: new Date()
        };

        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { 
                ...s, 
                messages: s.messages.map(msg => 
                  msg.id === loadingMessage.id ? aiResponse : msg
                )
              }
            : s
        ));

      } catch (error: any) {
        console.error('Masumi agent query failed:', error);
        
        // Remove loading message and show error
        const errorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: `I apologize, but I'm having trouble connecting to the AI agent. Error: ${error.message}. Please try again or submit a support ticket.`,
          timestamp: new Date()
        };

        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { 
                ...s, 
                messages: s.messages.filter(msg => msg.id !== (Date.now() + 0.5).toString()).concat(errorResponse)
              }
            : s
        ));
      }
    } else if (useRealAI) {
      // Use real AI endpoint (existing implementation)
      try {
        // Build conversation history
        const previousMessages = currentSession.messages.map(msg => ({
          role: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content
        }));

        const response = await sendChatMessage(chatMessage, {
          serviceLevel: currentSession.serviceLevel,
          previousMessages
        });

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: response.reply,
          timestamp: response.timestamp
        };

        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, messages: [...s.messages, aiResponse] }
            : s
        ));

        // Add AI response sentiment to history if provided
        if (response.sentiment !== undefined) {
          const aiSentimentData: SentimentData = {
            score: response.sentiment,
            label: response.sentiment >= 0.7 ? 'AI Positive' : response.sentiment >= 0.4 ? 'AI Neutral' : 'AI Negative',
            level: currentSession.serviceLevel,
            timestamp: new Date(),
            chatId: currentSession.id
          };
          setSentimentHistory(prev => [...prev, aiSentimentData]);
        }
      } catch (error) {
        console.error('Failed to get AI response:', error);
        // Fallback to error message
        const errorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "I apologize, but I'm having trouble processing your request. Please try again or submit a support ticket.",
          timestamp: new Date()
        };
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, messages: [...s.messages, errorResponse] }
            : s
        ));
      }
    } else {
      // Use simulated response for testing
      setTimeout(() => {
        const sentimentType: SentimentType = 
          aggregateSentiment.average >= 0.7 ? 'positive' :
          aggregateSentiment.average <= 0.3 ? 'negative' : 'neutral';
        
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: generateChatResponse(chatMessage, sentimentType),
          timestamp: new Date()
        };
        
        setSessions(prev => prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, messages: [...s.messages, aiResponse] }
            : s
        ));
      }, 1000);
    }

    setChatMessage("");
  };

  const handleMessageSentiment = (messageId: string, sentiment: 1 | -1) => {
    if (!currentSession) return;
    
    setSessions(prev => prev.map(session => 
      session.id === currentSession.id 
        ? {
            ...session,
            messages: session.messages.map(msg => 
              msg.id === messageId ? { ...msg, sentiment } : msg
            )
          }
        : session
    ));
    
    // Add to sentiment history
    const sentimentData: SentimentData = {
      score: sentiment === 1 ? 0.9 : 0.1,
      label: sentiment === 1 ? 'Positive Feedback' : 'Negative Feedback',
      level: currentSession.serviceLevel,
      timestamp: new Date(),
      chatId: currentSession.id,
      userRating: sentiment
    };
    
    setSentimentHistory(prev => [...prev, sentimentData]);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Ticket submitted:", ticketForm);
    setTicketForm({ name: "", email: "", issue: "" });
    alert("Ticket submitted successfully!");
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      simulatorRef.current?.stop();
      setIsSimulating(false);
    } else {
      simulatorRef.current?.start(simulationScenario, 2000);
      setIsSimulating(true);
    }
  };

  const changeServiceLevel = (level: ServiceLevel) => {
    if (!currentSession) return;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id 
        ? { ...s, serviceLevel: level }
        : s
    ));
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 0.7) return <Smile className="h-6 w-6 text-green-500" />;
    if (score >= 0.4) return <Meh className="h-6 w-6 text-yellow-500" />;
    return <Frown className="h-6 w-6 text-red-500" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return "bg-green-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const handleTestAgents = async () => {
    setIsTestingAgents(true);
    try {
      toast.info("Testing Masumi agents... Check console for details");
      
      const results = await testAllAgents();
      printAgentTestSummary(results);
      
      const availableCount = results.filter(r => r.isAvailable).length;
      
      if (availableCount > 0) {
        toast.success(`Found ${availableCount} working agents! Check console for details.`);
      } else {
        toast.error("No agents are currently available. The Masumi network may be experiencing issues.");
      }
      
    } catch (error: any) {
      console.error('Agent testing failed:', error);
      toast.error(`Agent testing failed: ${error.message}`);
    } finally {
      setIsTestingAgents(false);
    }
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
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              <Button variant="ghost" className="text-foreground">Support Portal</Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Account
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header with Agent Controls */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Support Portal</h1>
              <p className="text-muted-foreground">Get instant help from our AI agent</p>
              {activeAgent && (
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    {activeAgent.agent.name}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Masumi Network
                  </Badge>
                </div>
              )}
            </div>
            {/* AI Mode Controls */}
            <Card className="w-96">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI Agent Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Masumi Agent Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="masumi-toggle" className="font-medium">Use Masumi Agent</Label>
                    <p className="text-xs text-muted-foreground">
                      {activeAgent ? `Using: ${activeAgent.agent.name}` : 'No agent configured'}
                    </p>
                  </div>
                  <Switch
                    id="masumi-toggle"
                    checked={useMasumiAgent}
                    onCheckedChange={setUseMasumiAgent}
                    disabled={!activeAgent}
                  />
                </div>

                {!activeAgent && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                      No Masumi agent configured yet.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => navigate('/dashboard')}
                        className="w-full"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure Agent
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleTestAgents}
                        disabled={isTestingAgents}
                        className="w-full"
                      >
                        {isTestingAgents ? (
                          <>
                            <TestTube className="h-3 w-3 mr-1 animate-pulse" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-3 w-3 mr-1" />
                            Test Available Agents
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {activeAgent && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      Agent configured and ready to use.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleTestAgents}
                      disabled={isTestingAgents}
                      className="w-full"
                    >
                      {isTestingAgents ? (
                        <>
                          <TestTube className="h-3 w-3 mr-1 animate-pulse" />
                          Testing Network...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-3 w-3 mr-1" />
                          Test Network Status
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Fallback AI Toggle */}
                <div className={`flex items-center justify-between ${useMasumiAgent ? 'opacity-50' : ''}`}>
                  <div>
                    <Label htmlFor="real-ai-toggle" className="font-medium">Use Fallback AI</Label>
                    <p className="text-xs text-muted-foreground">Flux Point Studios API</p>
                  </div>
                  <Switch
                    id="real-ai-toggle"
                    checked={useRealAI}
                    onCheckedChange={setUseRealAI}
                    disabled={useMasumiAgent}
                  />
                </div>
                
                {/* Simulation Options */}
                <div className={`space-y-3 ${(useRealAI || useMasumiAgent) ? 'opacity-50' : ''}`}>
                  <Label className="text-sm font-medium">Simulation Options</Label>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={simulationScenario} 
                      onValueChange={(value) => setSimulationScenario(value as keyof typeof sentimentScenarios)}
                      disabled={useRealAI || useMasumiAgent}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(sentimentScenarios).map(([key, scenario]) => (
                          <SelectItem key={key} value={key}>
                            {scenario.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      variant={isSimulating ? "destructive" : "default"}
                      onClick={toggleSimulation}
                      disabled={useRealAI || useMasumiAgent}
                    >
                      {isSimulating ? (
                        <>
                          <StopCircle className="h-4 w-4 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                  {!(useRealAI || useMasumiAgent) && (
                    <p className="text-xs text-muted-foreground">
                      {sentimentScenarios[simulationScenario].description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Left Column - Real-time Chat */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <span>AI Support Chat</span>
                    <Badge variant="secondary">
                      {useMasumiAgent ? 'Masumi' : useRealAI ? 'Live' : 'Demo'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {useMasumiAgent && activeAgent 
                      ? `Powered by ${activeAgent.agent.name} on Masumi`
                      : 'Get instant answers from our AI agent'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={currentSession?.serviceLevel || 'basic'} 
                    onValueChange={changeServiceLevel}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={closeCurrentSession}
                    title="Close chat and start new"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 h-96 pr-4">
                <div className="space-y-4">
                  {currentSession?.messages.map((message) => (
                    <div key={message.id}>
                      <div
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                      {message.type === 'bot' && (
                        <div className="flex justify-start ml-2 space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-6 w-6 ${message.sentiment === 1 ? 'text-green-500' : ''}`}
                            onClick={() => handleMessageSentiment(message.id, 1)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-6 w-6 ${message.sentiment === -1 ? 'text-red-500' : ''}`}
                            onClick={() => handleMessageSentiment(message.id, -1)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="flex space-x-2 mt-4">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Middle Column - Sentiment Analysis */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getSentimentIcon(aggregateSentiment.average)}
                <span>Real-time Sentiment</span>
                {getTrendIcon(aggregateSentiment.trend)}
              </CardTitle>
              <CardDescription>Customer satisfaction tracking</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {/* Aggregate Sentiment */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-2xl font-bold">
                      {(aggregateSentiment.average * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getSentimentColor(aggregateSentiment.average)}`}
                      style={{ width: `${aggregateSentiment.average * 100}%` }}
                    />
                  </div>
                </div>

                {/* Recent Sentiment History */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {sentimentHistory.slice(-10).reverse().map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center space-x-2">
                            {getSentimentIcon(entry.score)}
                            <span className="text-xs">{entry.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Support Ticket Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span>Submit Support Ticket</span>
              </CardTitle>
              <CardDescription>For complex issues that need human attention</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issue">Describe Your Issue</Label>
                  <Textarea
                    id="issue"
                    placeholder="Please provide details about your issue..."
                    value={ticketForm.issue}
                    onChange={(e) => setTicketForm({ ...ticketForm, issue: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Chat History */}
        <div className="mt-8">
          <ChatHistory 
            sessions={sessions.filter(s => !s.isActive)} 
          />
        </div>
      </div>
    </div>
  );
};

export default Support;
