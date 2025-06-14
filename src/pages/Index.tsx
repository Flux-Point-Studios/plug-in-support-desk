import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletConnect } from "@/components/WalletConnect";
import { Bot, Shield, Zap, Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContextSimple";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign up:", { name, email, password });
    // Navigate to dashboard after successful signup
    navigate("/dashboard");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
    // Navigate to dashboard after successful login
    navigate("/dashboard");
  };

  const handleStripeCheckout = (plan: string) => {
    console.log("Redirect to Stripe checkout for:", plan);
    // Redirect to the actual Stripe payment link
    window.open("https://buy.stripe.com/5kA3cvdZp68AgENdwNfrW07", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-blue-500" />
          <span className="text-2xl font-bold text-white">AI HelpDesk</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI-Powered Support Agents
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Create custom AI support agents trained on your documentation. 
            Provide instant, accurate support to your customers 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Bot className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">Custom AI Agents</CardTitle>
              <CardDescription className="text-slate-300">
                Train your agent with your specific documentation and knowledge base
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Zap className="h-12 w-12 text-purple-500 mb-4" />
              <CardTitle className="text-white">Instant Responses</CardTitle>
              <CardDescription className="text-slate-300">
                Provide immediate support with AI-powered responses 24/7
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Shield className="h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-white">Sentiment Analysis</CardTitle>
              <CardDescription className="text-slate-300">
                Monitor customer satisfaction with real-time sentiment tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-white mb-12">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 opacity-50">
            <CardHeader>
              <CardTitle className="text-slate-400">Starter</CardTitle>
              <CardDescription className="text-slate-500">Coming soon</CardDescription>
              <div className="text-3xl font-bold text-slate-400">$10<span className="text-lg font-normal text-slate-500">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-500 mb-6">
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />1 AI Support Agent</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />10MB Documentation Upload</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />Basic Analytics</li>
              </ul>
              <Button className="w-full" disabled variant="secondary">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 ring-2 ring-blue-500">
            <CardHeader>
              <CardTitle className="text-white">Pro</CardTitle>
              <CardDescription className="text-slate-300">Most popular choice</CardDescription>
              <div className="text-3xl font-bold text-white">$25<span className="text-lg font-normal text-slate-300">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-300 mb-6">
                <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />1 AI Support Agent</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />100MB Documentation Upload</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Advanced Analytics</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Sentiment Analysis</li>
              </ul>
              <div className="stripe-button-wrapper">
                <stripe-buy-button
                  buy-button-id="buy_btn_1RZRDPDPjjPcAkxqVxIC4Uy7"
                  publishable-key="pk_live_51OPtxUDPjjPcAkxqmjcKCty6rLE1ASSfGq0KbpNdtIy6UXhx8G6XmdFuxqtla5qS2EnBLZju8PqUHj8xP1IecOVd00OA4vyJhK"
                ></stripe-buy-button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 opacity-50">
            <CardHeader>
              <CardTitle className="text-slate-400">Enterprise</CardTitle>
              <CardDescription className="text-slate-500">Coming soon</CardDescription>
              <div className="text-3xl font-bold text-slate-400">$199<span className="text-lg font-normal text-slate-500">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-slate-500 mb-6">
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />Unlimited AI Agents</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />Unlimited Documentation</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />Full Analytics Suite</li>
                <li className="flex items-center"><Check className="h-4 w-4 text-slate-600 mr-2" />Priority Support</li>
              </ul>
              <Button className="w-full" disabled variant="secondary">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">Get Started Today</CardTitle>
              <CardDescription className="text-slate-300 text-center">
                Create your account or sign in to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signup" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="login">Login</TabsTrigger>
                </TabsList>
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Account
                    </Button>
                    
                    <div className="relative my-4">
                      <Separator className="bg-slate-600" />
                      <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-2 text-sm text-slate-400">
                        OR
                      </span>
                    </div>
                    
                    <div className="w-full">
                      <WalletConnect fullWidth variant="default" />
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email" className="text-white">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password" className="text-white">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Sign In
                    </Button>
                    
                    <div className="relative my-4">
                      <Separator className="bg-slate-600" />
                      <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 px-2 text-sm text-slate-400">
                        OR
                      </span>
                    </div>
                    
                    <div className="w-full">
                      <WalletConnect fullWidth variant="default" />
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
