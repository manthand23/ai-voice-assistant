
import React from 'react';
import { Separator } from "@/components/ui/separator";

interface DashboardProps {
  userName?: string;
}

export function Dashboard({ userName = "User" }: DashboardProps) {
  // Get statistics from localStorage or use defaults
  const userData = localStorage.getItem("user_data") 
    ? JSON.parse(localStorage.getItem("user_data")!) 
    : { name: userName, email: "Not provided" };
    
  const conversationStats = {
    totalConversations: localStorage.getItem("total_conversations") || "0",
    averageDuration: "3m 24s",
    lastSession: new Date().toLocaleDateString()
  };

  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="space-y-6">
        {/* User Information */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">User Profile</h3>
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
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Usage Statistics</h3>
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
        
        {/* Voice Settings */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Voice Settings</h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm mb-2">Current Voice: <span className="font-medium">Sarah</span></p>
            <p className="text-sm text-muted-foreground">Voice model: eleven_multilingual_v2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
