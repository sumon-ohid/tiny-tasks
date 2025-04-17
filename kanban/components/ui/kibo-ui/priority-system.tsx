'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import type { Feature } from '@/lib/content-provider';

interface PrioritySystemProps {
  task: Feature;
  onUpdateTask: (updatedTask: Feature) => void;
}

export function PrioritySystem({ task, onUpdateTask }: PrioritySystemProps) {
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task.priority || 'medium');
  const [autoSuggestShown, setAutoSuggestShown] = useState<boolean>(false);
  const [suggestedPriority, setSuggestedPriority] = useState<'low' | 'medium' | 'high' | 'urgent' | null>(null);

  useEffect(() => {
    calculateSuggestedPriority();
  }, [task]);

  const calculateSuggestedPriority = () => {
    let priorityScore = 0;
    
    // Factor 1: Deadline proximity
    if (task.endAt) {
      const daysUntilDue = differenceInDays(
        task.endAt instanceof Date ? task.endAt : new Date(task.endAt),
        new Date()
      );
      
      if (daysUntilDue <= 1) {
        priorityScore += 5; // Due today or tomorrow
      } else if (daysUntilDue <= 3) {
        priorityScore += 4; // Due in 2-3 days
      } else if (daysUntilDue <= 7) {
        priorityScore += 3; // Due within a week
      } else if (daysUntilDue <= 14) {
        priorityScore += 2; // Due within two weeks
      } else {
        priorityScore += 1; // Due later
      }
    }
    
    // Factor 2: Task complexity (using description length as a proxy)
    if (task.description) {
      const wordCount = task.description.split(/\s+/).length;
      if (wordCount > 200) {
        priorityScore += 3; // Very complex task
      } else if (wordCount > 100) {
        priorityScore += 2; // Moderately complex task
      } else if (wordCount > 0) {
        priorityScore += 1; // Simple task
      }
    }
    
    // Factor 3: Status relevance
    if (task.status.id === 'inprogress') {
      priorityScore += 2; // In-progress tasks should typically be finished
    }
    
    // Factor 4: Time blocks
    if (task.timeBlocks && task.timeBlocks.length > 0) {
      priorityScore += 1; // Has scheduled time blocks
      
      // If any time blocks are scheduled for today
      const today = new Date().toDateString();
      const hasBlocksToday = task.timeBlocks.some(block => {
        const blockDate = block.start instanceof Date ? block.start : new Date(block.start);
        return blockDate.toDateString() === today;
      });
      
      if (hasBlocksToday) {
        priorityScore += 2; // Has time blocks scheduled for today
      }
    }
    
    // Translate score to priority level
    let newSuggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
    if (priorityScore >= 8) {
      newSuggestedPriority = 'urgent';
    } else if (priorityScore >= 5) {
      newSuggestedPriority = 'high';
    } else if (priorityScore >= 3) {
      newSuggestedPriority = 'medium';
    } else {
      newSuggestedPriority = 'low';
    }
    
    // Only show auto-suggestion if it differs from current priority
    if (newSuggestedPriority !== priority) {
      setSuggestedPriority(newSuggestedPriority);
      setAutoSuggestShown(true);
    } else {
      setSuggestedPriority(null);
      setAutoSuggestShown(false);
    }
  };

  const getEisenhowerQuadrant = () => {
    const isUrgent = priority === 'urgent' || priority === 'high';
    const isImportant = task.initiative?.name?.toLowerCase().includes('mvp') || 
                        task.description?.toLowerCase().includes('important') ||
                        task.name?.toLowerCase().includes('important');
    
    if (isUrgent && isImportant) {
      return { quadrant: 1, label: 'Do', description: 'Urgent & Important' };
    } else if (!isUrgent && isImportant) {
      return { quadrant: 2, label: 'Plan', description: 'Important but Not Urgent' };
    } else if (isUrgent && !isImportant) {
      return { quadrant: 3, label: 'Delegate', description: 'Urgent but Not Important' };
    } else {
      return { quadrant: 4, label: 'Eliminate', description: 'Neither Urgent nor Important' };
    }
  };

  const getQuadrantColor = (quadrant: number) => {
    switch (quadrant) {
      case 1: return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50';
      case 4: return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50';
      default: return '';
    }
  };

  const getCardBackground = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 dark:bg-red-950/20';
      case 'high': return 'bg-orange-50 dark:bg-orange-950/20';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950/20';
      case 'low': return 'bg-green-50 dark:bg-green-950/20';
      default: return '';
    }
  };

  const updatePriority = (newPriority: 'low' | 'medium' | 'high' | 'urgent') => {
    setPriority(newPriority);
    onUpdateTask({
      ...task,
      priority: newPriority,
      // Add gamification points for setting priorities (feature 10)
      points: (task.points || 0) + 2
    });
    
    toast.success(`Priority updated to ${newPriority}`);
    setAutoSuggestShown(false);
  };

  const eisenhowerQuadrant = getEisenhowerQuadrant();

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-medium">Task Priority</h3>
          
          {autoSuggestShown && suggestedPriority && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Suggested:
              </span>
              <Button 
                variant="outline" 
                size="sm"
                className={`${getCardBackground(suggestedPriority)}`}
                onClick={() => updatePriority(suggestedPriority)}
              >
                {suggestedPriority.charAt(0).toUpperCase() + suggestedPriority.slice(1)}
              </Button>
            </div>
          )}
        </div>
        
        <RadioGroup
          value={priority}
          onValueChange={(value) => updatePriority(value as 'low' | 'medium' | 'high' | 'urgent')}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          <div className={`flex items-center space-x-2 rounded-md border p-3 ${priority === 'urgent' ? 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700/50' : 'bg-muted/40'}`}>
            <RadioGroupItem value="urgent" id="urgent" />
            <Label htmlFor="urgent" className="font-medium cursor-pointer">Urgent</Label>
          </div>
          
          <div className={`flex items-center space-x-2 rounded-md border p-3 ${priority === 'high' ? 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50' : 'bg-muted/40'}`}>
            <RadioGroupItem value="high" id="high" />
            <Label htmlFor="high" className="font-medium cursor-pointer">High</Label>
          </div>
          
          <div className={`flex items-center space-x-2 rounded-md border p-3 ${priority === 'medium' ? 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/50' : 'bg-muted/40'}`}>
            <RadioGroupItem value="medium" id="medium" />
            <Label htmlFor="medium" className="font-medium cursor-pointer">Medium</Label>
          </div>
          
          <div className={`flex items-center space-x-2 rounded-md border p-3 ${priority === 'low' ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700/50' : 'bg-muted/40'}`}>
            <RadioGroupItem value="low" id="low" />
            <Label htmlFor="low" className="font-medium cursor-pointer">Low</Label>
          </div>
        </RadioGroup>
        
        <div className="pt-4 mt-2 border-t">
          <h4 className="text-sm font-medium mb-3">Eisenhower Matrix</h4>
          
          <div className={`rounded-md border p-3 flex flex-col ${getQuadrantColor(eisenhowerQuadrant.quadrant)}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">{eisenhowerQuadrant.label}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-background/50">Quadrant {eisenhowerQuadrant.quadrant}</span>
            </div>
            <p className="text-sm mt-1">{eisenhowerQuadrant.description}</p>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            The Eisenhower Matrix helps prioritize tasks based on their urgency and importance.
          </p>
        </div>
      </div>
    </Card>
  );
} 