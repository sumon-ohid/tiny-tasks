'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import type { Feature } from '@/lib/content-provider';

interface GamificationRewardsProps {
  task: Feature;
  onUpdateTask: (updatedTask: Feature) => void;
}

export function GamificationRewards({ task, onUpdateTask }: GamificationRewardsProps) {
  // Use regular variable instead of state since we don't need to update it directly
  const points = task.points || 0;
  const [badges, setBadges] = useState<string[]>(task.badges || []);
  const [showBadgeDialog, setShowBadgeDialog] = useState<boolean>(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  
  // Define available badges - wrapped in useMemo to avoid recreation on every render
  const availableBadges = useMemo(() => [
    { id: 'first-task', name: 'Task Starter', description: 'Created your first task', requiredPoints: 0, icon: '🚀' },
    { id: 'focused-10', name: 'Focus Adept', description: 'Completed 10 minutes in focus mode', requiredPoints: 15, icon: '🧠' },
    { id: 'streak-3', name: 'Consistency Master', description: 'Maintained a 3-day streak on a habit', requiredPoints: 30, icon: '🔥' },
    { id: 'productivity-80', name: 'High Performer', description: 'Achieved 80%+ productivity rating', requiredPoints: 50, icon: '⚡' },
    { id: 'pomodoro-5', name: 'Pomodoro Expert', description: 'Completed 5 pomodoro sessions', requiredPoints: 75, icon: '⏱️' },
    { id: 'time-wizard', name: 'Time Wizard', description: 'Completed tasks 20% faster than estimated', requiredPoints: 100, icon: '⌛' },
    { id: 'efficient-planner', name: 'Efficient Planner', description: 'Created and completed 5 time blocks', requiredPoints: 125, icon: '📆' },
    { id: 'milestone-master', name: 'Milestone Master', description: 'Reached 150 points on a single task', requiredPoints: 150, icon: '🏆' },
  ], []);
  
  // Calculate level based on points
  const calculateLevel = (points: number) => {
    return Math.floor(points / 50) + 1;
  };
  
  // Calculate progress to next level
  const calculateProgress = (points: number) => {
    const level = calculateLevel(points);
    const levelStartPoints = (level - 1) * 50;
    const nextLevelPoints = level * 50;
    return ((points - levelStartPoints) / (nextLevelPoints - levelStartPoints)) * 100;
  };
  
  // Check for newly earned badges
  useEffect(() => {
    const earnableBadges = availableBadges.filter(badge => 
      !badges.includes(badge.id) && points >= badge.requiredPoints
    );
    
    if (earnableBadges.length > 0) {
      // Get the highest tier badge earned
      const highestBadge = earnableBadges.reduce((prev, current) => 
        prev.requiredPoints > current.requiredPoints ? prev : current
      );
      
      // Add the badge
      const updatedBadges = [...badges, highestBadge.id];
      setBadges(updatedBadges);
      
      // Update task
      onUpdateTask({
        ...task,
        badges: updatedBadges
      });
      
      // Show notification
      toast.success(`🎉 New Badge Earned: ${highestBadge.name}!`);
      
      // Show badge dialog
      setSelectedBadge(highestBadge.id);
      setShowBadgeDialog(true);
    }
  }, [points, badges, availableBadges, onUpdateTask, task]);
  
  // Get unlocked badges
  const unlockedBadges = availableBadges.filter(badge => badges.includes(badge.id));
  
  // Get next badges to unlock
  const nextBadges = availableBadges
    .filter(badge => !badges.includes(badge.id))
    .sort((a, b) => a.requiredPoints - b.requiredPoints)
    .slice(0, 3);
    
  // Get badge details by ID
  const getBadgeById = (badgeId: string) => {
    return availableBadges.find(badge => badge.id === badgeId);
  };
  
  // Handle badge click to view details
  const handleBadgeClick = (badgeId: string) => {
    setSelectedBadge(badgeId);
    setShowBadgeDialog(true);
  };
  
  // Current level and progress
  const level = calculateLevel(points);
  const progress = calculateProgress(points);
  const pointsToNextLevel = level * 50 - points;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-medium">Rewards & Progress</h3>
          
          <div className="flex items-center space-x-2">
            <div className="text-sm">Level</div>
            <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {level}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>XP Points: {points}</span>
            <span>{pointsToNextLevel} points to level {level + 1}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {unlockedBadges.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Your Badges</h4>
            <div className="flex flex-wrap gap-2">
              {unlockedBadges.map(badge => (
                <Badge
                  key={badge.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-muted px-3 py-1"
                  onClick={() => handleBadgeClick(badge.id)}
                >
                  <span className="mr-1">{badge.icon}</span> {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium">Next Achievements</h4>
          
          {nextBadges.length > 0 ? (
            <div className="space-y-3">
              {nextBadges.map(badge => {
                const progressPercentage = Math.min(100, (points / badge.requiredPoints) * 100);
                
                return (
                  <div key={badge.id} className="bg-muted/30 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg opacity-50">{badge.icon}</span>
                        <span className="font-medium">{badge.name}</span>
                      </div>
                      <span className="text-xs">{points}/{badge.requiredPoints} pts</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                    <Progress value={progressPercentage} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              You&apos;ve unlocked all available badges! 🎉
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">How to earn points:</p>
            <ul className="space-y-1 ml-5 list-disc text-xs">
              <li>Complete time blocks: +5 points</li>
              <li>Complete habits: +10 points</li>
              <li>Set task priorities: +2 points</li>
              <li>Complete focus sessions: +15 points</li>
              <li>Complete goals: +25 points</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Badge Details Dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Badge Details</DialogTitle>
          </DialogHeader>
          
          {selectedBadge && getBadgeById(selectedBadge) && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="text-6xl">
                {getBadgeById(selectedBadge)?.icon}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold">
                  {getBadgeById(selectedBadge)?.name}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {getBadgeById(selectedBadge)?.description}
                </p>
                <div className="text-sm mt-2">
                  Required Points: {getBadgeById(selectedBadge)?.requiredPoints}
                </div>
              </div>
              
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => setShowBadgeDialog(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 