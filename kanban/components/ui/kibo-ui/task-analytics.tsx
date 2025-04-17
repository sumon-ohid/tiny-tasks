'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import type { Feature } from '@/lib/content-provider';

interface TaskAnalyticsProps {
  task: Feature;
  onUpdateTask: (updatedTask: Feature) => void;
}

export function TaskAnalytics({ task, onUpdateTask }: TaskAnalyticsProps) {
  // Get or initialize analytics data
  const analytics = task.analytics || {
    estimatedTime: 0,
    actualTime: 0,
    completedPomodoros: 0,
    productivity: 50, // Default middle value
  };
  
  const [estimatedTime, setEstimatedTime] = useState<number>(analytics.estimatedTime || 0);
  const [productivityScore, setProductivityScore] = useState<number>(analytics.productivity || 50);
  const [activeTab, setActiveTab] = useState<string>("time-tracking");
  
  // Calculate time statistics
  const actualTime = analytics.actualTime || 0;
  const timeEfficiency = estimatedTime > 0 
    ? Math.min(100, (actualTime / estimatedTime) * 100)
    : 0;
  
  // Calculate days statistics
  const daysElapsed = task.startAt 
    ? differenceInDays(new Date(), task.startAt instanceof Date ? task.startAt : new Date(task.startAt))
    : 0;
  const totalDays = task.startAt && task.endAt
    ? differenceInDays(
        task.endAt instanceof Date ? task.endAt : new Date(task.endAt),
        task.startAt instanceof Date ? task.startAt : new Date(task.startAt)
      )
    : 0;
  const daysPercentage = totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
  
  // Calculate pomodoro statistics
  const completedPomodoros = analytics.completedPomodoros || 0;
  const pomodoroMinutes = completedPomodoros * 25; // Assuming 25-minute pomodoros
  
  // Prepare chart data
  const timeData = [
    { name: 'Estimated', time: estimatedTime },
    { name: 'Actual', time: actualTime },
    { name: 'Pomodoro', time: pomodoroMinutes },
  ];
  
  const pieData = [
    { name: 'Elapsed', value: daysElapsed, color: '#3B82F6' },
    { name: 'Remaining', value: Math.max(0, totalDays - daysElapsed), color: '#E5E7EB' },
  ];
  
  const productivityData = [
    { name: 'Efficiency', value: timeEfficiency },
    { name: 'Focus', value: Math.min(completedPomodoros * 10, 100) },
    { name: 'Perceived', value: productivityScore },
  ];
  
  // Update estimated time
  const updateEstimatedTime = () => {
    const updatedAnalytics = {
      ...analytics,
      estimatedTime,
    };
    
    onUpdateTask({
      ...task,
      analytics: updatedAnalytics
    });
    
    toast.success("Estimated time updated");
  };
  
  // Update productivity score
  const updateProductivityScore = () => {
    const updatedAnalytics = {
      ...analytics,
      productivity: productivityScore,
    };
    
    onUpdateTask({
      ...task,
      analytics: updatedAnalytics
    });
    
    toast.success("Productivity score updated");
  };
  
  // Generate productivity insights based on the data
  const getProductivityInsights = () => {
    const insights = [];
    
    // Time-based insights
    if (estimatedTime > 0 && actualTime > 0) {
      if (actualTime < estimatedTime * 0.8) {
        insights.push("You're completing this task faster than estimated. Great efficiency!");
      } else if (actualTime > estimatedTime * 1.2) {
        insights.push("This task is taking longer than estimated. Consider adjusting your time estimates or breaking it down into smaller tasks.");
      }
    }
    
    // Pomodoro insights
    if (completedPomodoros > 0) {
      insights.push(`You've completed ${completedPomodoros} Pomodoro sessions (${pomodoroMinutes} focused minutes) on this task.`);
    } else {
      insights.push("Try using the Pomodoro timer to improve focus and track productive time.");
    }
    
    // Time management insights
    if (totalDays > 0) {
      const percentageTimeUsed = daysPercentage;
      const percentageWorkDone = timeEfficiency;
      
      if (percentageTimeUsed > 70 && percentageWorkDone < 50) {
        insights.push("Warning: Task is behind schedule. Consider prioritizing this task or adjusting the deadline.");
      } else if (percentageTimeUsed < 50 && percentageWorkDone > 70) {
        insights.push("You're ahead of schedule on this task. Great planning!");
      }
    }
    
    // If no specific insights, add a general one
    if (insights.length === 0) {
      insights.push("Start tracking your time to get personalized productivity insights.");
    }
    
    return insights;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency < 70) return 'text-red-500';
    if (efficiency < 90) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const productivityInsights = getProductivityInsights();

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Task Analytics</h3>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="time-tracking" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="font-medium">Time Analysis</h4>
                
                <div className="flex items-center gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="estimated-time" className="text-xs">Estimated Time (minutes)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        id="estimated-time"
                        min={0}
                        max={480}
                        step={15}
                        value={[estimatedTime]}
                        onValueChange={(value) => setEstimatedTime(value[0])}
                        className="w-32"
                      />
                      <span className="w-10 text-xs">{estimatedTime}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={updateEstimatedTime}
                        className="h-7 text-xs"
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Estimated Time</div>
                  <div className="text-xl font-bold mt-1">{formatTime(estimatedTime)}</div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Actual Time</div>
                  <div className="text-xl font-bold mt-1">{formatTime(actualTime)}</div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Efficiency</div>
                  <div className={`text-xl font-bold mt-1 ${getEfficiencyColor(timeEfficiency)}`}>
                    {timeEfficiency.toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} minutes`, 'Time']} />
                    <Bar dataKey="time" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="pt-4 border-t mt-4">
                <h4 className="font-medium mb-2">Timeline Progress</h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Day {daysElapsed} of {totalDays}</span>
                    <span>{daysPercentage.toFixed(0)}% Elapsed</span>
                  </div>
                  <Progress value={daysPercentage} className="h-2" />
                </div>
                
                <div className="h-48 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value} days`, 'Time']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="productivity" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="font-medium">Productivity Analysis</h4>
                
                <div className="flex items-center gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="productivity-score" className="text-xs">How productive do you feel? (0-100)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        id="productivity-score"
                        min={0}
                        max={100}
                        step={5}
                        value={[productivityScore]}
                        onValueChange={(value) => setProductivityScore(value[0])}
                        className="w-32"
                      />
                      <span className="w-10 text-xs">{productivityScore}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={updateProductivityScore}
                        className="h-7 text-xs"
                      >
                        Log
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Time Efficiency</div>
                  <div className={`text-xl font-bold mt-1 ${getEfficiencyColor(timeEfficiency)}`}>
                    {timeEfficiency.toFixed(0)}%
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Focus Sessions</div>
                  <div className="text-xl font-bold mt-1">{completedPomodoros}</div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Perceived Productivity</div>
                  <div className="text-xl font-bold mt-1">{productivityScore}%</div>
                </div>
              </div>
              
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productivityData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/20 mt-4">
                <h4 className="font-medium mb-3">Productivity Insights</h4>
                <ul className="space-y-2">
                  {productivityInsights.map((insight, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {totalDays > 0 && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Task Duration: {totalDays} days ({format(
                    task.startAt instanceof Date ? task.startAt : new Date(task.startAt || Date.now()),
                    'MMM d'
                  )} - {format(
                    task.endAt instanceof Date ? task.endAt : new Date(task.endAt || Date.now()),
                    'MMM d, yyyy'
                  )})
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
} 