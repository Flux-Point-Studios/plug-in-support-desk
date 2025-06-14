import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { ChatSession } from "@/lib/sentiment-simulator";
import { format } from "date-fns";

interface ChatHistoryProps {
  sessions: ChatSession[];
  onSelectSession?: (session: ChatSession) => void;
}

export function ChatHistory({ sessions, onSelectSession }: ChatHistoryProps) {
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.7) return <ThumbsUp className="h-3 w-3 text-green-500" />;
    if (sentiment <= 0.3) return <ThumbsDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getSentimentBadge = (sentiment: number) => {
    if (sentiment >= 0.7) return { variant: "default" as const, className: "bg-green-500" };
    if (sentiment <= 0.3) return { variant: "destructive" as const };
    return { variant: "secondary" as const };
  };

  const getServiceLevelBadge = (level: string) => {
    const colors = {
      basic: "bg-gray-500",
      premium: "bg-blue-500",
      enterprise: "bg-purple-500"
    };
    return colors[level as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <span>Chat History</span>
        </CardTitle>
        <CardDescription>Recent closed conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No chat history yet
              </p>
            ) : (
              sessions
                .filter(session => !session.isActive)
                .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
                .slice(0, 10)
                .map((session) => (
                  <div
                    key={session.id}
                    className="border border-border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onSelectSession?.(session)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Chat #{session.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={getSentimentBadge(session.overallSentiment).variant}
                          className={`${getSentimentBadge(session.overallSentiment).className} text-xs`}
                        >
                          {getSentimentIcon(session.overallSentiment)}
                          <span className="ml-1">
                            {Math.round(session.overallSentiment * 100)}%
                          </span>
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`${getServiceLevelBadge(session.serviceLevel)} text-white text-xs`}
                        >
                          {session.serviceLevel}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{session.messages.length} messages</p>
                      <p>
                        {format(session.startTime, "MMM d, h:mm a")} - 
                        {session.endTime && format(session.endTime, "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 