'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addMinutes, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';
import type { Feature } from '@/lib/content-provider';

interface TimeBlockPomodoroProps {
  task: Feature;
  onUpdateTask: (updatedTask: Feature) => void;
}

export function TimeBlockPomodoro({ task, onUpdateTask }: TimeBlockPomodoroProps) {
  // Time Blocking State
  const [timeBlocks, setTimeBlocks] = useState<Array<{ start: Date; end: Date; completed: boolean }>>(
    task.timeBlocks || []
  );
  const [newBlockStart, setNewBlockStart] = useState<Date>(new Date());
  const [newBlockDuration, setNewBlockDuration] = useState<number>(30); // minutes
  const [showTimeBlockDialog, setShowTimeBlockDialog] = useState<boolean>(false);
  
  // Pomodoro State
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workDuration: task.pomodoroSettings?.workDuration || 25,
    breakDuration: task.pomodoroSettings?.breakDuration || 5,
    longBreakDuration: task.pomodoroSettings?.longBreakDuration || 15,
    longBreakInterval: task.pomodoroSettings?.longBreakInterval || 4
  });
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(pomodoroSettings.workDuration * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(task.analytics?.completedPomodoros || 0);
  const [activeTab, setActiveTab] = useState<string>("time-blocking");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    return () => {
      if (isPomodoroRunning && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPomodoroRunning]);

  // Sort time blocks by start time
  const sortedTimeBlocks = [...timeBlocks].sort((a, b) => {
    const aDate = a.start instanceof Date ? a.start : new Date(a.start);
    const bDate = b.start instanceof Date ? b.start : new Date(b.start);
    return aDate.getTime() - bDate.getTime();
  });

  // Handle Pomodoro Timer
  useEffect(() => {
    if (isPomodoroRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            
            // Play notification sound
            if (audioRef.current) {
              audioRef.current.play().catch(err => console.error("Error playing notification:", err));
            }
            
            // Handle timer completion
            if (isBreak) {
              // Break ended, start work session
              setIsBreak(false);
              setTimeLeft(pomodoroSettings.workDuration * 60);
              toast.info("Break ended. Time to focus!");
            } else {
              // Work session ended, start break
              setIsBreak(true);
              
              // Increment completed pomodoros
              const newCompletedPomodoros = completedPomodoros + 1;
              setCompletedPomodoros(newCompletedPomodoros);
              
              // Update analytics for the task
              const updatedAnalytics = {
                ...(task.analytics || {}),
                completedPomodoros: newCompletedPomodoros
              };
              
              // Determine if it's time for a long break
              const isLongBreak = newCompletedPomodoros % pomodoroSettings.longBreakInterval === 0;
              const breakTime = isLongBreak 
                ? pomodoroSettings.longBreakDuration 
                : pomodoroSettings.breakDuration;
              
              setTimeLeft(breakTime * 60);
              
              // Update task
              onUpdateTask({
                ...task,
                analytics: updatedAnalytics
              });
              
              // Show notification
              toast.success(`Pomodoro completed! ${isLongBreak ? 'Take a long break.' : 'Short break time.'}`);
            }
            
            // Restart timer
            setIsPomodoroRunning(true);
            return isBreak ? pomodoroSettings.workDuration * 60 : pomodoroSettings.breakDuration * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPomodoroRunning, isBreak, pomodoroSettings, completedPomodoros, onUpdateTask, task]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add new time block
  const addTimeBlock = () => {
    const startTime = new Date(newBlockStart);
    const endTime = addMinutes(startTime, newBlockDuration);
    
    const newBlock = {
      start: startTime,
      end: endTime,
      completed: false
    };
    
    const updatedBlocks = [...timeBlocks, newBlock];
    setTimeBlocks(updatedBlocks);
    
    // Update task with new time blocks
    onUpdateTask({
      ...task,
      timeBlocks: updatedBlocks
    });
    
    setShowTimeBlockDialog(false);
    toast.success(`Time block added: ${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`);
  };

  // Toggle time block completion
  const toggleBlockCompletion = (index: number) => {
    const updatedBlocks = [...timeBlocks];
    updatedBlocks[index].completed = !updatedBlocks[index].completed;
    
    setTimeBlocks(updatedBlocks);
    
    // Update task with updated blocks
    onUpdateTask({
      ...task,
      timeBlocks: updatedBlocks
    });
    
    // Add points for completed time blocks (gamification)
    if (updatedBlocks[index].completed) {
      const updatedPoints = (task.points || 0) + 5;
      onUpdateTask({
        ...task,
        timeBlocks: updatedBlocks,
        points: updatedPoints
      });
      
      toast.success("Time block completed! +5 points");
    }
  };

  // Remove a time block
  const removeTimeBlock = (index: number) => {
    const updatedBlocks = timeBlocks.filter((_, i) => i !== index);
    setTimeBlocks(updatedBlocks);
    
    // Update task with updated blocks
    onUpdateTask({
      ...task,
      timeBlocks: updatedBlocks
    });
    
    toast.info("Time block removed");
  };

  // Update pomodoro settings
  const saveSettings = () => {
    // Update task with new pomodoro settings
    onUpdateTask({
      ...task,
      pomodoroSettings
    });
    
    // Reset timer
    setTimeLeft(pomodoroSettings.workDuration * 60);
    setIsBreak(false);
    setIsPomodoroRunning(false);
    
    toast.success("Pomodoro settings updated");
  };

  return (
    <Card className="p-4 w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="time-blocking">Time Blocking</TabsTrigger>
          <TabsTrigger value="pomodoro">Pomodoro Timer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="time-blocking" className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h3 className="text-lg font-medium">Time Blocks</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTimeBlockDialog(true)}
            >
              Add Time Block
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto p-1">
            {sortedTimeBlocks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No time blocks scheduled yet
              </div>
            ) : (
              sortedTimeBlocks.map((block, index) => {
                const startTime = block.start instanceof Date ? block.start : new Date(block.start);
                const endTime = block.end instanceof Date ? block.end : new Date(block.end);
                const isCurrentBlock = isBefore(new Date(), endTime) && isAfter(new Date(), startTime);
                
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 rounded-md border ${
                      block.completed 
                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/70' 
                        : isCurrentBlock
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/70'
                          : 'border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex flex-col">
                      <p className="font-medium">
                        {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(startTime, 'EEEE, MMMM d')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {isCurrentBlock && !block.completed && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Current
                        </Badge>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`block-${index}`}
                          checked={block.completed}
                          onCheckedChange={() => toggleBlockCompletion(index)}
                        />
                        <Label htmlFor={`block-${index}`}>
                          {block.completed ? 'Completed' : 'Mark complete'}
                        </Label>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeBlock(index)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="pomodoro" className="space-y-4 mt-4">
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-2">
            <div>
              <h3 className="text-xl font-bold">
                {isBreak ? 'Break Time' : 'Focus Time'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Completed Pomodoros: {completedPomodoros}
              </p>
            </div>
            
            <div className="w-full max-w-xs">
              <Progress value={(timeLeft / (isBreak ? (pomodoroSettings.breakDuration * 60) : (pomodoroSettings.workDuration * 60))) * 100} className="h-2" />
            </div>
            
            <div className="text-5xl font-mono font-bold">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant={isPomodoroRunning ? "destructive" : "default"}
                onClick={() => setIsPomodoroRunning(prev => !prev)}
              >
                {isPomodoroRunning ? 'Pause' : (timeLeft === pomodoroSettings.workDuration * 60 || timeLeft === pomodoroSettings.breakDuration * 60) ? 'Start' : 'Resume'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setIsPomodoroRunning(false);
                  setIsBreak(false);
                  setTimeLeft(pomodoroSettings.workDuration * 60);
                }}
              >
                Reset
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
              <div className="space-y-2">
                <Label htmlFor="work-duration">Work (Minutes)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="work-duration"
                    min={5}
                    max={60}
                    step={5}
                    value={[pomodoroSettings.workDuration]}
                    onValueChange={(value) => setPomodoroSettings(prev => ({ ...prev, workDuration: value[0] }))}
                  />
                  <span className="w-8 text-right">{pomodoroSettings.workDuration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="break-duration">Break (Minutes)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="break-duration"
                    min={1}
                    max={30}
                    step={1}
                    value={[pomodoroSettings.breakDuration]}
                    onValueChange={(value) => setPomodoroSettings(prev => ({ ...prev, breakDuration: value[0] }))}
                  />
                  <span className="w-8 text-right">{pomodoroSettings.breakDuration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="long-break">Long Break (Minutes)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="long-break"
                    min={5}
                    max={45}
                    step={5}
                    value={[pomodoroSettings.longBreakDuration]}
                    onValueChange={(value) => setPomodoroSettings(prev => ({ ...prev, longBreakDuration: value[0] }))}
                  />
                  <span className="w-8 text-right">{pomodoroSettings.longBreakDuration}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="long-break-interval">Long Break After</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="long-break-interval"
                    min={2}
                    max={8}
                    step={1}
                    value={[pomodoroSettings.longBreakInterval]}
                    onValueChange={(value) => setPomodoroSettings(prev => ({ ...prev, longBreakInterval: value[0] }))}
                  />
                  <span className="w-8 text-right">{pomodoroSettings.longBreakInterval}</span>
                </div>
              </div>
            </div>
            
            <Button variant="secondary" onClick={saveSettings}>
              Save Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showTimeBlockDialog} onOpenChange={setShowTimeBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Block</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-date">Date & Start Time</Label>
              <input
                id="block-date"
                type="datetime-local"
                className="w-full p-2 border rounded-md"
                value={format(newBlockStart, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setNewBlockStart(new Date(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="block-duration">Duration (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="block-duration"
                  min={5}
                  max={120}
                  step={5}
                  value={[newBlockDuration]}
                  onValueChange={(value) => setNewBlockDuration(value[0])}
                  className="flex-1"
                />
                <span className="w-12 text-right">{newBlockDuration}</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Block will end at: {format(addMinutes(newBlockStart, newBlockDuration), "h:mm a")}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addTimeBlock}>
              Add Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 