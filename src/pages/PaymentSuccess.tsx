import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bot } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // You can add logic here to verify the payment status with your backend
    // and update the user's subscription status in your database
  }, []);

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

      {/* Success Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-white">Payment Successful!</CardTitle>
              <CardDescription className="text-slate-300">
                Your subscription is now active. Let's create your first AI support agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">What's next?</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Create your custom AI support agent</li>
                  <li>• Upload your documentation and knowledge base</li>
                  <li>• Configure your agent's personality and responses</li>
                  <li>• Start providing instant support to your customers</li>
                </ul>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-center text-sm text-slate-400">
                A confirmation email has been sent to your registered email address.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 