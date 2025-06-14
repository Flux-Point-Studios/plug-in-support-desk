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
  TrendingUp, TrendingDown, Minus, PlayCircle, StopCircle
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
  
  // Sentiment tracking
  const [sentimentHistory, setSentimentHistory] = useState<SentimentData[]>([]);
  const [aggregateSentiment, setAggregateSentiment] = useState<{ average: number; trend: 'up' | 'down' | 'stable' }>({ average: 0.75, trend: 'stable' });
  
  // Simulation controls
  const [simulationScenario, setSimulationScenario] = useState<keyof typeof sentimentScenarios>('balanced');
  const [isSimulating, setIsSimulating] = useState(false);
  const [useRealAI, setUseRealAI] = useState(true); // Default to real AI
  const simulatorRef = useRef<SentimentSimulator | null>(null);
  
  // Effect to stop simulation when switching to real AI
  useEffect(() => {
    if (useRealAI && isSimulating) {
      simulatorRef.current?.stop();
      setIsSimulating(false);
    }
  }, [useRealAI, isSimulating]);
  
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
    const newSession: ChatSession = {
      id: Date.now().toString(),
      messages: [
        {
          id: '1',
          type: 'bot',
          content: "Hello! I'm your AI support agent. How can I help you today?",
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

    // Get AI response
    if (useRealAI) {
      // Use real AI endpoint
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
        {/* Page Header with Simulation Controls */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Support Portal</h1>
              <p className="text-muted-foreground">Get instant help or submit a support ticket</p>
            </div>
            {/* Simulation Controls */}
            <Card className="w-96">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI & Simulation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Real AI Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="real-ai-toggle" className="font-medium">Use Real AI</Label>
                    <p className="text-xs text-muted-foreground">Connect to Flux Point Studios API</p>
                  </div>
                  <Switch
                    id="real-ai-toggle"
                    checked={useRealAI}
                    onCheckedChange={setUseRealAI}
                  />
                </div>
                
                {/* Simulation Options */}
                <div className={`space-y-3 ${useRealAI ? 'opacity-50' : ''}`}>
                  <Label className="text-sm font-medium">Simulation Options</Label>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={simulationScenario} 
                      onValueChange={(value) => setSimulationScenario(value as keyof typeof sentimentScenarios)}
                      disabled={useRealAI}
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
                      disabled={useRealAI}
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
                  {!useRealAI && (
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
                    <Badge variant="secondary">Live</Badge>
                  </CardTitle>
                  <CardDescription>Get instant answers from our AI agent</CardDescription>
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

          {/* Middle Column - Ticket Form */}
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
                  <Label htmlFor="ticket-name">Your Name</Label>
                  <Input
                    id="ticket-name"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ticket-email">Email Address</Label>
                  <Input
                    id="ticket-email"
                    type="email"
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ticket-issue">Describe Your Issue</Label>
                  <Textarea
                    id="ticket-issue"
                    rows={6}
                    placeholder="Please provide as much detail as possible about your issue..."
                    value={ticketForm.issue}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, issue: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Ticket
                </Button>
              </form>

              {/* Recent Tickets */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Recent Tickets</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border border-border rounded">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">#1001 - Login Issue</span>
                    </div>
                    <Badge variant="outline">Resolved</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border border-border rounded">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">#1002 - Feature Request</span>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Sentiment & Analytics */}
          <div className="space-y-6 overflow-y-auto">
            {/* Live Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getSentimentIcon(aggregateSentiment.average)}
                  <span>Live Sentiment</span>
                  {getTrendIcon(aggregateSentiment.trend)}
                </CardTitle>
                <CardDescription>Real-time customer satisfaction monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${aggregateSentiment.average * 351.86} 351.86`}
                        className={getSentimentColor(aggregateSentiment.average).replace('bg-', 'text-')}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(aggregateSentiment.average * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold">
                    {aggregateSentiment.average >= 0.7 ? 'Positive' : 
                     aggregateSentiment.average >= 0.4 ? 'Neutral' : 'Negative'}
                  </p>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Data points: {sentimentHistory.length}</p>
                    <p>Trend: {aggregateSentiment.trend}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat History */}
            <ChatHistory sessions={sessions} />

            {/* Analytics Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Today's Conversations</span>
                  <span className="font-semibold">{sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolution Rate</span>
                  <span className="font-semibold">
                    {sessions.filter(s => !s.isActive && s.overallSentiment >= 0.7).length > 0
                      ? Math.round((sessions.filter(s => !s.isActive && s.overallSentiment >= 0.7).length / 
                          sessions.filter(s => !s.isActive).length) * 100) || 0
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg. Response Time</span>
                  <span className="font-semibold">0.8s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Agents</span>
                  <span className="font-semibold">2</span>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Service</span>
                  <Badge className="bg-green-500">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-500">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API</span>
                  <Badge className="bg-green-500">Operational</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
