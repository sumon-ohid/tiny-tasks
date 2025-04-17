'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Slider } from "@/components/ui/slider";
import type { Feature } from '@/lib/content-provider';

interface FocusModeProps {
  task: Feature;
  onUpdateTask: (updatedTask: Feature) => void;
}

export function FocusMode({ task, onUpdateTask }: FocusModeProps) {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(task.focusMode || false);
  const [distractions, setDistractions] = useState<string[]>(task.distractionList || []);
  const [newDistraction, setNewDistraction] = useState<string>('');
  const [isAddingDistraction, setIsAddingDistraction] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [focusDuration, setFocusDuration] = useState<number>(25); // minutes
  const [isFocusActive, setIsFocusActive] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [showFocusDialog, setShowFocusDialog] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<string>('none');
  const [soundVolume, setSoundVolume] = useState<number>(50);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const soundOptions = [
    { id: 'none', name: 'None' },
    { id: 'white-noise', name: 'White Noise' },
    { id: 'rain', name: 'Rain' },
    { id: 'coffee-shop', name: 'Coffee Shop' },
    { id: 'nature', name: 'Nature Sounds' },
    { id: 'deep-focus', name: 'Deep Focus' },
  ];

  // Initialize audio
  useEffect(() => {
    if (selectedSound !== 'none') {
      const soundUrl = getSoundUrl(selectedSound);
      audioRef.current = new Audio(soundUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = soundVolume / 100;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    };
  }, []);

  // Handle focus timer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isFocusActive) {
      // Enter fullscreen if enabled
      if (isFullScreen && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
      
      // Start ambient sound if selected
      if (selectedSound !== 'none' && audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error("Error playing ambient sound:", err);
        });
      }
      
      // Start timer
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // Timer completed
            clearInterval(timerRef.current!);
            setIsFocusActive(false);
            
            // Exit fullscreen
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error(err));
            }
            
            // Stop sound
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            
            // Add points for completing a focus session (gamification)
            const focusPoints = (task.points || 0) + 15;
            onUpdateTask({
              ...task,
              points: focusPoints,
              analytics: {
                ...(task.analytics || {}),
                actualTime: ((task.analytics?.actualTime || 0) + focusDuration),
              }
            });
            
            toast.success(`Focus session completed! +15 points`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
      
      // Pause sound
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isFocusActive, isFullScreen, selectedSound, soundVolume, task, onUpdateTask, focusDuration]);

  // Update sound volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = soundVolume / 100;
    }
  }, [soundVolume]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get sound URL based on selection
  const getSoundUrl = (soundId: string) => {
    // In a real implementation, these would be actual sound files
    switch (soundId) {
      case 'white-noise': return '/sounds/white-noise.mp3';
      case 'rain': return '/sounds/rain.mp3';
      case 'coffee-shop': return '/sounds/coffee-shop.mp3';
      case 'nature': return '/sounds/nature.mp3';
      case 'deep-focus': return '/sounds/deep-focus.mp3';
      default: return '';
    }
  };

  // Toggle focus mode on/off
  const toggleFocusMode = () => {
    const newFocusMode = !isFocusMode;
    setIsFocusMode(newFocusMode);
    
    onUpdateTask({
      ...task,
      focusMode: newFocusMode
    });
    
    toast.success(newFocusMode 
      ? "Focus mode enabled for this task" 
      : "Focus mode disabled for this task");
  };

  // Add a new distraction to block
  const addDistraction = () => {
    if (!newDistraction.trim()) return;
    
    const updatedDistractions = [...distractions, newDistraction.trim()];
    setDistractions(updatedDistractions);
    setNewDistraction('');
    setIsAddingDistraction(false);
    
    onUpdateTask({
      ...task,
      distractionList: updatedDistractions
    });
    
    toast.success(`Added "${newDistraction.trim()}" to your distractions list`);
  };

  // Remove a distraction from the list
  const removeDistraction = (index: number) => {
    const updatedDistractions = distractions.filter((_, i) => i !== index);
    setDistractions(updatedDistractions);
    
    onUpdateTask({
      ...task,
      distractionList: updatedDistractions
    });
    
    toast.info("Distraction removed from list");
  };

  // Start focus session
  const startFocusSession = () => {
    setSecondsLeft(focusDuration * 60);
    setIsFocusActive(true);
    setShowFocusDialog(false);
    
    // Update sound if needed
    if (selectedSound !== 'none' && audioRef.current) {
      audioRef.current.src = getSoundUrl(selectedSound);
      audioRef.current.volume = soundVolume / 100;
    }
    
    toast.success(`Focus session started - ${focusDuration} minutes`);
  };

  // End focus session early
  const endFocusSession = () => {
    setIsFocusActive(false);
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    
    // Stop sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Calculate partial points based on how much of the session was completed
    const completionPercentage = 1 - (secondsLeft / (focusDuration * 60));
    const earnedPoints = Math.floor(15 * completionPercentage);
    
    if (earnedPoints > 0) {
      onUpdateTask({
        ...task,
        points: (task.points || 0) + earnedPoints,
        analytics: {
          ...(task.analytics || {}),
          actualTime: ((task.analytics?.actualTime || 0) + Math.floor(focusDuration * completionPercentage)),
        }
      });
      
      toast.info(`Focus session ended early. +${earnedPoints} points for partial completion`);
    } else {
      toast.info(`Focus session ended early.`);
    }
  };

  // Update focus session settings
  const updateFocusSettings = () => {
    if (isFocusActive) {
      toast.error("Cannot change settings during active focus session");
      return;
    }
    
    // Update sound
    if (selectedSound !== 'none') {
      const soundUrl = getSoundUrl(selectedSound);
      if (audioRef.current) {
        audioRef.current.src = soundUrl;
        audioRef.current.volume = soundVolume / 100;
      } else {
        audioRef.current = new Audio(soundUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = soundVolume / 100;
      }
    }
    
    toast.success("Focus settings updated");
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Focus Mode</h3>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="focus-toggle"
              checked={isFocusMode}
              onCheckedChange={toggleFocusMode}
            />
            <Label htmlFor="focus-toggle">
              Enable Focus
            </Label>
          </div>
        </div>
        
        {isFocusMode && (
          <>
            {isFocusActive ? (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">Focus Time</h3>
                  <p className="text-sm text-muted-foreground">Stay on task and avoid distractions</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="text-5xl font-mono font-bold">
                    {formatTime(secondsLeft)}
                  </div>
                </div>
                
                <div className="w-full">
                  <Progress 
                    value={100 - (secondsLeft / (focusDuration * 60) * 100)} 
                    className="h-2"
                  />
                </div>
                
                <div className="text-center">
                  <Button 
                    variant="destructive"
                    onClick={endFocusSession}
                  >
                    End Focus Session
                  </Button>
                </div>
                
                {distractions.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-2">Remember to avoid:</h4>
                    <div className="flex flex-wrap gap-2">
                      {distractions.map((distraction, index) => (
                        <Badge key={index} variant="secondary">
                          {distraction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <Button
                    onClick={() => setShowFocusDialog(true)}
                    className="w-full sm:w-auto"
                  >
                    Start Focus Session
                  </Button>
                  
                  {distractions.length === 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingDistraction(true)}
                      className="w-full sm:w-auto"
                    >
                      Add Distractions to Block
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => setIsAddingDistraction(true)}
                      className="w-full sm:w-auto"
                    >
                      Manage Distractions
                    </Button>
                  )}
                </div>
                
                {distractions.length > 0 && (
                  <div className="border rounded-md p-3 mt-4 bg-muted/20">
                    <h4 className="text-sm font-medium mb-2">Distractions to avoid:</h4>
                    <div className="flex flex-wrap gap-2">
                      {distractions.map((distraction, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {distraction}
                          <button
                            onClick={() => removeDistraction(index)}
                            className="ml-1 hover:text-red-500 rounded-full p-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      
      {/* Dialog for adding distractions */}
      <Dialog open={isAddingDistraction} onOpenChange={setIsAddingDistraction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Distractions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="distraction">Add a distraction to avoid</Label>
              <div className="flex gap-2">
                <Input
                  id="distraction"
                  placeholder="e.g., Social media, YouTube, Phone"
                  value={newDistraction}
                  onChange={(e) => setNewDistraction(e.target.value)}
                />
                <Button onClick={addDistraction}>Add</Button>
              </div>
            </div>
            
            {distractions.length > 0 && (
              <div className="space-y-2">
                <Label>Current distractions to avoid:</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20 min-h-16">
                  {distractions.map((distraction, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {distraction}
                      <button
                        onClick={() => removeDistraction(index)}
                        className="ml-1 hover:text-red-500 rounded-full p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingDistraction(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for focus session settings */}
      <Dialog open={showFocusDialog} onOpenChange={setShowFocusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Focus Session Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="focus-duration">Session Duration (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="focus-duration"
                  min={5}
                  max={120}
                  step={5}
                  value={[focusDuration]}
                  onValueChange={(value) => setFocusDuration(value[0])}
                  className="flex-1"
                />
                <span className="w-8 text-right">{focusDuration}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ambient-sound">Ambient Sound</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {soundOptions.map((sound) => (
                  <Button
                    key={sound.id}
                    variant={selectedSound === sound.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedSound(sound.id)}
                  >
                    {sound.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {selectedSound !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="volume"
                    min={0}
                    max={100}
                    value={[soundVolume]}
                    onValueChange={(value) => setSoundVolume(value[0])}
                    className="flex-1"
                  />
                  <span className="w-8 text-right">{soundVolume}%</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="fullscreen-toggle"
                checked={isFullScreen}
                onCheckedChange={setIsFullScreen}
              />
              <Label htmlFor="fullscreen-toggle">
                Enable Fullscreen
              </Label>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={updateFocusSettings}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Save Settings
            </Button>
            <Button 
              onClick={startFocusSession}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 