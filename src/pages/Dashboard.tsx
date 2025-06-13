
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bot, Upload, Settings, MessageSquare, Plus, FileText, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [agentBio, setAgentBio] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating agent:", {
      name: agentName,
      bio: agentBio,
      description: agentDescription,
      files: uploadedFiles
    });
    // Here you would save the agent to your database
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
            <ThemeToggle />
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Account
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      placeholder="e.g., TechSupport Pro"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="agent-bio">Agent Bio</Label>
                    <Input
                      id="agent-bio"
                      placeholder="Brief description of your agent's expertise"
                      value={agentBio}
                      onChange={(e) => setAgentBio(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="agent-description">Detailed Description</Label>
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
