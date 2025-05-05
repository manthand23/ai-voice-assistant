
import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Clock, MessageSquare, BarChart } from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { DashboardCharts } from "@/components/DashboardCharts";

interface DashboardProps {
  userName?: string;
  onBackToChat?: () => void;
}

interface ConversationHistoryItem {
  id: number;
  date: string;
  messages: {
    role: string;
    content: string;
    timestamp: number;
  }[];
}

export function Dashboard({ userName, onBackToChat }: DashboardProps) {
  // Get statistics from localStorage or use defaults
  const userData = localStorage.getItem("user_data") 
    ? JSON.parse(localStorage.getItem("user_data")!) 
    : { name: userName || "User", email: "Not provided" };
    
  const conversationStats = {
    totalConversations: localStorage.getItem("total_conversations") || "0",
    averageDuration: "3m 24s",
    lastSession: new Date().toLocaleDateString()
  };

  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [commonQueries, setCommonQueries] = useState<{query: string, count: number}[]>([]);

  useEffect(() => {
    // Load conversation history
    const history = JSON.parse(localStorage.getItem("conversation_history") || "[]");
    setConversationHistory(history);

    // Generate common queries
    const queries = new Map<string, number>();
    
    history.forEach((conv: ConversationHistoryItem) => {
      conv.messages.forEach(msg => {
        if (msg.role === "user") {
          // Truncate long messages
          const content = msg.content.substring(0, 30) + (msg.content.length > 30 ? "..." : "");
          queries.set(content, (queries.get(content) || 0) + 1);
        }
      });
    });
    
    // Convert to array and sort
    const sortedQueries = Array.from(queries.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 only
      
    setCommonQueries(sortedQueries);
  }, []);

  return (
    <div className="p-6 max-h-screen overflow-auto">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        {onBackToChat && (
          <Button variant="outline" onClick={onBackToChat}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        )}
      </div>
      
      <div className="space-y-8">
        {/* User Information */}
        <div className="space-y-4">
          <div className="flex items-center">
            <User className="mr-2 h-5 w-5 text-assistant-primary" />
            <h3 className="text-lg font-medium">User Profile</h3>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm font-medium">Name:</p>
              <p className="text-sm">{userData.name}</p>
              
              <p className="text-sm font-medium">Email:</p>
              <p className="text-sm">{userData.email}</p>
              
              <p className="text-sm font-medium">Last Login:</p>
              <p className="text-sm">{new Date(userData.lastLogin || Date.now()).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Usage Statistics */}
        <div className="space-y-4">
          <div className="flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-assistant-primary" />
            <h3 className="text-lg font-medium">Usage Statistics</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{conversationStats.totalConversations}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{conversationStats.averageDuration}</p>
              <p className="text-xs text-muted-foreground">Avg. Duration</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{conversationStats.lastSession}</p>
              <p className="text-xs text-muted-foreground">Last Session</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Analytics Charts */}
        <div className="space-y-4">
          <div className="flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-assistant-primary" />
            <h3 className="text-lg font-medium">Analytics</h3>
          </div>
          <DashboardCharts conversationHistory={conversationHistory} />
        </div>
        
        <Separator />
        
        {/* Common Questions */}
        <div className="space-y-4">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-assistant-primary" />
            <h3 className="text-lg font-medium">Common Questions</h3>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Frequency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commonQueries.length > 0 ? (
                  commonQueries.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.query}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No conversation data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <Separator />
        
        {/* Recent Conversations */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-assistant-primary" />
            <h3 className="text-lg font-medium">Recent Conversations</h3>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversationHistory.length > 0 ? (
                  conversationHistory.map((conv, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(conv.date).toLocaleString()}</TableCell>
                      <TableCell>{conv.messages.length}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No conversation history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
