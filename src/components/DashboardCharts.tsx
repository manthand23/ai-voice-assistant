
import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

interface DashboardChartsProps {
  conversationHistory: any[];
}

export function DashboardCharts({ conversationHistory }: DashboardChartsProps) {
  // Generate conversation data by day
  const getConversationsByDay = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    
    // Count conversations per day
    const countByDay = last7Days.map(day => {
      const count = conversationHistory.filter(conv => 
        conv.date.split('T')[0] === day
      ).length;
      
      return {
        date: new Date(day).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        conversations: count
      };
    });
    
    return countByDay;
  };
  
  // Calculate message types distribution
  const getMessageDistribution = () => {
    let userMessages = 0;
    let assistantMessages = 0;
    
    conversationHistory.forEach(conv => {
      conv.messages.forEach((msg: any) => {
        if (msg.role === 'user') userMessages++;
        else if (msg.role === 'assistant') assistantMessages++;
      });
    });
    
    return [
      { name: 'User', value: userMessages, color: '#4f46e5' },
      { name: 'Assistant', value: assistantMessages, color: '#10b981' }
    ];
  };
  
  // Calculate message length distribution
  const getMessageLengthData = () => {
    const messageLengths: { [key: string]: number } = {
      'Short (<50)': 0,
      'Medium (50-200)': 0,
      'Long (>200)': 0
    };
    
    conversationHistory.forEach(conv => {
      conv.messages.forEach((msg: any) => {
        const length = msg.content.length;
        if (length < 50) messageLengths['Short (<50)']++;
        else if (length >= 50 && length <= 200) messageLengths['Medium (50-200)']++;
        else messageLengths['Long (>200)']++;
      });
    });
    
    return Object.entries(messageLengths).map(([name, value]) => ({ name, value }));
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  const conversationsByDay = getConversationsByDay();
  const messageDistribution = getMessageDistribution();
  const messageLengthData = getMessageLengthData();
  
  // If no data, show placeholder
  if (conversationHistory.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>No Analytics Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Start a conversation to see analytics here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Conversation Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ChartContainer 
            config={{
              conversations: {
                label: 'Conversations',
                theme: {
                  light: '#4f46e5',
                  dark: '#818cf8'
                }
              }
            }}
          >
            <LineChart data={conversationsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="conversations" 
                stroke="var(--color-conversations)" 
                strokeWidth={2}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Message Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Message Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={messageDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {messageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Message Length Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Message Length Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ChartContainer 
            config={{
              value: {
                label: 'Count',
                theme: {
                  light: '#10b981',
                  dark: '#34d399'
                }
              }
            }}
          >
            <BarChart data={messageLengthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
