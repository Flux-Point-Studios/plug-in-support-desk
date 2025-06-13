
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bot, Send, User, AlertCircle, Clock, CheckCircle, Smile, Meh, Frown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const Support = () => {
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: "bot", content: "Hello! I'm your AI support agent. How can I help you today?" },
  ]);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    issue: ""
  });
  const [sentiment, setSentiment] = useState({ score: 0.75, label: "Positive" });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      type: "user",
      content: chatMessage
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: "bot",
        content: "I understand your question. Let me help you with that. Based on our documentation, here's what I recommend..."
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setChatMessage("");
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Ticket submitted:", ticketForm);
    // Reset form
    setTicketForm({ name: "", email: "", issue: "" });
    // Show success message
    alert("Ticket submitted successfully!");
  };

  // Simulate sentiment updates
  useEffect(() => {
    const interval = setInterval(() => {
      const scores = [0.85, 0.72, 0.91, 0.68, 0.79];
      const labels = ["Very Positive", "Positive", "Excellent", "Good", "Positive"];
      const randomIndex = Math.floor(Math.random() * scores.length);
      setSentiment({
        score: scores[randomIndex],
        label: labels[randomIndex]
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Support Portal</h1>
          <p className="text-muted-foreground">Get instant help or submit a support ticket</p>
        </div>

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column - Real-time Chat */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-500" />
                <span>AI Support Chat</span>
                <Badge variant="secondary" className="ml-auto">Live</Badge>
              </CardTitle>
              <CardDescription>Get instant answers from our AI agent</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 h-96 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
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

          {/* Right Column - Sentiment Gauge */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getSentimentIcon(sentiment.score)}
                  <span>Live Sentiment</span>
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
                        strokeDasharray={`${sentiment.score * 351.86} 351.86`}
                        className={getSentimentColor(sentiment.score).replace('bg-', 'text-')}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(sentiment.score * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold">{sentiment.label}</p>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Today's Conversations</span>
                  <span className="font-semibold">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolution Rate</span>
                  <span className="font-semibold">89%</span>
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
