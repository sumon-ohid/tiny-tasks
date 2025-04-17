'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, parseISO, startOfDay, subDays } from 'date-fns';
import { toast } from 'sonner';
import type { Feature } from '@/lib/content-provider';

interface HabitGoalTrackerProps {
  task: Feature;
  onUpdateTask: (updatedTask: Feature) => void;
}

export function HabitGoalTracker({ task, onUpdateTask }: HabitGoalTrackerProps) {
  const [isHabit, setIsHabit] = useState<boolean>(task.isHabit || false);
  const [habitStreak, setHabitStreak] = useState<number>(task.habitStreak || 0);
  const [habitHistory, setHabitHistory] = useState<Array<{ date: string; completed: boolean }>>(
    task.habitHistory || []
  );
  const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>(
    task.goalType || 'daily'
  );
  const [goalTarget, setGoalTarget] = useState<number>(task.goalTarget || 1);
  const [goalProgress, setGoalProgress] = useState<number>(task.goalProgress || 0);
  
  // Calculate and update streak on initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isHabit) {
      calculateStreak();
    }
  }, [isHabit]);

  // Calculate current streak
  const calculateStreak = () => {
    if (!habitHistory || habitHistory.length === 0) {
      setHabitStreak(0);
      return;
    }
    
    // Sort history by date (newest first)
    const sortedHistory = [...habitHistory].sort((a, b) => {
      return parseISO(b.date).getTime() - parseISO(a.date).getTime();
    });
    
    // Check if today is completed
    const today = format(new Date(), 'yyyy-MM-dd');
    const isTodayCompleted = sortedHistory.some(
      item => item.date === today && item.completed
    );
    
    // Start from today or yesterday depending on whether today is completed
    const currentDate = isTodayCompleted 
      ? new Date() 
      : subDays(new Date(), 1);
    
    let streak = isTodayCompleted ? 1 : 0;
    
    // Count consecutive days backwards
    for (let i = isTodayCompleted ? 1 : 0; i < sortedHistory.length; i++) {
      const expectedDate = format(subDays(currentDate, i), 'yyyy-MM-dd');
      const historyEntry = sortedHistory.find(item => item.date === expectedDate);
      
      if (historyEntry && historyEntry.completed) {
        streak++;
      } else {
        break;
      }
    }
    
    setHabitStreak(streak);
    
    // Update task with new streak
    if (streak !== task.habitStreak) {
      onUpdateTask({
        ...task,
        habitStreak: streak
      });
    }
  };

  // Toggle today's habit completion
  const toggleTodayCompletion = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updatedHistory = [...habitHistory];
    const todayIndex = updatedHistory.findIndex(item => item.date === today);
    
    if (todayIndex >= 0) {
      // Toggle existing entry
      updatedHistory[todayIndex].completed = !updatedHistory[todayIndex].completed;
    } else {
      // Add new entry for today
      updatedHistory.push({ date: today, completed: true });
    }
    
    setHabitHistory(updatedHistory);
    
    // Update task with new history
    const isTodayCompleted = todayIndex >= 0 
      ? updatedHistory[todayIndex].completed
      : true;
    
    // Update goal progress if this is a daily goal
    let newGoalProgress = goalProgress;
    if (goalType === 'daily' && isTodayCompleted) {
      newGoalProgress = Math.min(goalTarget, goalProgress + 1);
    } else if (goalType === 'daily' && !isTodayCompleted) {
      newGoalProgress = Math.max(0, goalProgress - 1);
    }
    
    setGoalProgress(newGoalProgress);
    
    // Add points for completing a habit (gamification)
    const newPoints = isTodayCompleted 
      ? (task.points || 0) + 10 // +10 for completing a habit
      : Math.max(0, (task.points || 0) - 10); // -10 for uncompleting a habit
    
    onUpdateTask({
      ...task,
      habitHistory: updatedHistory,
      habitStreak: isTodayCompleted ? habitStreak + 1 : Math.max(0, habitStreak - 1),
      goalProgress: newGoalProgress,
      points: newPoints
    });
    
    if (isTodayCompleted) {
      toast.success(`Habit marked complete! Streak: ${habitStreak + 1} days. +10 points`);
    } else {
      toast.info(`Habit marked incomplete. Streak updated.`);
    }
    
    // Recalculate streak after state update
    setTimeout(calculateStreak, 100);
  };

  // Toggle habit status for the task
  const toggleHabitStatus = () => {
    const newIsHabit = !isHabit;
    setIsHabit(newIsHabit);
    
    // Initialize habit data if becoming a habit
    if (newIsHabit && (!habitHistory || habitHistory.length === 0)) {
      setHabitHistory([]);
    }
    
    onUpdateTask({
      ...task,
      isHabit: newIsHabit,
      habitStreak: newIsHabit ? habitStreak : undefined,
      habitHistory: newIsHabit ? habitHistory : undefined,
      goalType: newIsHabit ? goalType : undefined,
      goalTarget: newIsHabit ? goalTarget : undefined,
      goalProgress: newIsHabit ? goalProgress : undefined
    });
    
    toast.success(newIsHabit 
      ? "Task converted to a habit. Track daily completion to build streaks!" 
      : "Task is no longer tracked as a habit.");
  };

  // Update goal settings
  const updateGoalSettings = () => {
    setGoalProgress(0); // Reset progress when settings change
    
    onUpdateTask({
      ...task,
      goalType,
      goalTarget,
      goalProgress: 0
    });
    
    toast.success(`Goal settings updated. New target: ${goalTarget} ${goalType}.`);
  };

  // Increment goal progress manually
  const incrementGoalProgress = () => {
    const newProgress = Math.min(goalTarget, goalProgress + 1);
    setGoalProgress(newProgress);
    
    // Add points for goal progress (gamification)
    const progressPoints = (task.points || 0) + 5;
    
    onUpdateTask({
      ...task,
      goalProgress: newProgress,
      points: progressPoints
    });
    
    if (newProgress === goalTarget) {
      // Goal completed! Add bonus points
      onUpdateTask({
        ...task,
        goalProgress: newProgress,
        points: progressPoints + 20 // Bonus for completing the full goal
      });
      
      toast.success(`🎉 Goal completed! +25 points total`);
    } else {
      toast.success(`Progress updated: ${newProgress}/${goalTarget}. +5 points`);
    }
  };

  // Get last 7 days for the habit calendar
  const getLastWeek = () => {
    const days = [];
    const today = startOfDay(new Date());
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const historyEntry = habitHistory.find(item => item.date === dateStr);
      
      days.push({
        date,
        dateStr,
        completed: historyEntry ? historyEntry.completed : false
      });
    }
    
    return days;
  };

  const lastWeek = getLastWeek();
  const isTodayCompleted = habitHistory.some(
    item => item.date === format(new Date(), 'yyyy-MM-dd') && item.completed
  );

  // Calculate progress percentage
  const progressPercentage = goalTarget > 0 ? (goalProgress / goalTarget) * 100 : 0;

  return (
    <Card className="p-4">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Habit & Goal Tracking</h3>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="habit-toggle"
              checked={isHabit}
              onCheckedChange={toggleHabitStatus}
            />
            <Label htmlFor="habit-toggle">
              Track as Habit
            </Label>
          </div>
        </div>
        
        {isHabit && (
          <>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-medium">Current Streak</h4>
                  <p className="text-sm text-muted-foreground">Complete daily to maintain your streak</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{habitStreak}</div>
                  <div className="text-sm text-muted-foreground">days</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2 p-3 rounded-md bg-muted/30">
                <div className="text-sm">
                  {isTodayCompleted ? 
                    "Today's habit is complete! 🎉" :
                    "Don't break your streak - complete today's habit!"
                  }
                </div>
                
                <Button
                  variant={isTodayCompleted ? "outline" : "default"}
                  size="sm"
                  onClick={toggleTodayCompletion}
                >
                  {isTodayCompleted ? "Mark Incomplete" : "Mark Complete"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Last 7 Days</h4>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {lastWeek.map((day) => (
                  <div key={day.dateStr} className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {format(day.date, 'EEE')}
                    </div>
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                        day.completed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : isToday(day.date)
                            ? 'border-2 border-dashed border-muted-foreground/40'
                            : 'bg-muted/30'
                      }`}
                    >
                      {format(day.date, 'd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h4 className="font-medium">Goal Setting</h4>
            
            <div className="flex items-center gap-2">
              <Select
                value={goalType}
                onValueChange={(value) => setGoalType(value as 'daily' | 'weekly' | 'monthly' | 'custom')}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Goal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(parseInt(e.target.value) || 1)}
                  className="w-16"
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={updateGoalSettings}
                >
                  Set
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div className="text-sm">
                Progress: {goalProgress} / {goalTarget} 
                {goalType !== 'custom' ? ` ${goalType}` : ''}
              </div>
              
              {goalType !== 'daily' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={incrementGoalProgress}
                  disabled={goalProgress >= goalTarget}
                >
                  Log Progress
                </Button>
              )}
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            {progressPercentage >= 100 && (
              <div className="text-center text-sm font-medium text-green-600 dark:text-green-400 mt-2">
                🎉 Goal Completed! 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
} 