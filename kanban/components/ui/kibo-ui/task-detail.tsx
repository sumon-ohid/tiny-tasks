'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import type { Feature } from '@/lib/content-provider';
import Image from 'next/image';
import { TimeBlockPomodoro } from './time-block-pomodoro';
import { PrioritySystem } from './priority-system';
import { HabitGoalTracker } from './habit-goal-tracker';
import { FocusMode } from './focus-mode';
import { TaskAnalytics } from './task-analytics';
import { GamificationRewards } from './gamification-rewards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type TaskDetailProps = {
  task: Feature;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const TaskDetail = ({ task, onClose, onEdit, onDelete }: TaskDetailProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updatedTask, setUpdatedTask] = useState<Feature>(task);
  
  // Whenever the task is updated by a subcomponent, update our local state
  const handleTaskUpdate = (newTaskData: Feature) => {
    setUpdatedTask(newTaskData);
  };
  
  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayVariants}
      onClick={onClose}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <motion.div 
        onClick={e => e.stopPropagation()}
        variants={modalVariants}
        className="w-full max-w-4xl"
      >
        <Card className="p-0 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div 
            className="p-6 pb-4 border-b relative"
            style={{ backgroundColor: `${updatedTask.status.color}10` }}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                className="p-2 rounded-full hover:bg-white/20 text-gray-700 dark:text-gray-200"
                onClick={onEdit}
                aria-label="Edit task"
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
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </button>
              <button 
                className="p-2 rounded-full hover:bg-white/20 text-gray-700 dark:text-gray-200"
                onClick={onClose}
                aria-label="Close task details"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          
            <div className="flex items-start gap-3">
              {updatedTask.emoji && (
                <div className="relative w-12 h-12 overflow-hidden rounded-full mt-1">
                  <Image
                    src={updatedTask.emoji.url}
                    alt="Task emoji"
                    width={48}
                    height={48}
                    className="object-cover rounded-full"
                    unoptimized
                    onError={(e) => {
                      // Try to reload with a different format if it fails
                      const img = e.currentTarget;
                      if (updatedTask.emoji && !img.src.includes('&format=png')) {
                        img.src = `${updatedTask.emoji.url.split('?')[0]}?seed=${updatedTask.emoji.seed}&backgroundColor=transparent&radius=50&format=png`;
                      } else {
                        // If PNG also fails or emoji doesn't exist, use a fallback emoji
                        img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23eaad80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`;
                      }
                    }}
                  />
                </div>
              )}
              <h2 className="text-xl font-bold pr-16">{updatedTask.name}</h2>
            </div>
            
            <div className="flex items-center gap-3 mt-3">
              <div
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: `${updatedTask.status.color}25`,
                  color: updatedTask.status.color 
                }}
              >
                {updatedTask.status.name}
              </div>
              
              {updatedTask.priority && (
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  updatedTask.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                  updatedTask.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                  updatedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                }`}>
                  {updatedTask.priority.charAt(0).toUpperCase() + updatedTask.priority.slice(1)} Priority
                </div>
              )}
              
              {updatedTask.initiative && (
                <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                  {updatedTask.initiative.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="w-full">
              <div className="px-4 border-b">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="timeblocking">Time Blocking</TabsTrigger>
                  <TabsTrigger value="priority">Priority</TabsTrigger>
                  <TabsTrigger value="habits">Habits & Goals</TabsTrigger>
                  <TabsTrigger value="focus">Focus Mode</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="details" className="m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {updatedTask.description && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {updatedTask.description}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Timeline</h3>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Start Date</div>
                              <div className="font-medium">
                                {format(
                                  updatedTask.startAt instanceof Date 
                                    ? updatedTask.startAt 
                                    : new Date(updatedTask.startAt || Date.now()),
                                  'MMM d, yyyy'
                                )}
                              </div>
                            </div>
                            
                            <div className="text-muted-foreground">→</div>
                            
                            <div className="space-y-1 text-right">
                              <div className="text-xs text-muted-foreground">Due Date</div>
                              <div className="font-medium">
                                {format(
                                  updatedTask.endAt instanceof Date 
                                    ? updatedTask.endAt 
                                    : new Date(updatedTask.endAt || Date.now()),
                                  'MMM d, yyyy'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {updatedTask.emoji && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Emoji Style</h3>
                          <div className="p-4 bg-muted/30 rounded-lg flex items-center gap-3">
                            <div className="relative w-10 h-10 overflow-hidden rounded-full">
                              <Image
                                src={updatedTask.emoji.url}
                                alt="Task emoji"
                                width={40}
                                height={40}
                                className="object-cover rounded-full"
                                unoptimized
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {updatedTask.emoji.style || 'Default Style'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Seed: {updatedTask.emoji.seed || 'Default'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {updatedTask.owner && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              {updatedTask.owner.image ? (
                                <div className="relative w-8 h-8 overflow-hidden rounded-full">
                                  <Image
                                    src={updatedTask.owner.image}
                                    alt={updatedTask.owner.name}
                                    width={32}
                                    height={32}
                                    className="object-cover rounded-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                  {updatedTask.owner.name.charAt(0)}
                                </div>
                              )}
                              <div className="font-medium">{updatedTask.owner.name}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                        <div className="p-4 bg-muted/30 rounded-lg flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={onEdit}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2"
                            >
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                            Edit Task
                          </Button>
                          
                          {!confirmDelete ? (
                            <Button
                              variant="outline"
                              className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => setConfirmDelete(true)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2"
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                              Delete Task
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={onDelete}
                              >
                                Confirm Delete
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setConfirmDelete(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="timeblocking" className="m-0">
                  <TimeBlockPomodoro 
                    task={updatedTask} 
                    onUpdateTask={handleTaskUpdate} 
                  />
                </TabsContent>
                
                <TabsContent value="priority" className="m-0">
                  <PrioritySystem
                    task={updatedTask} 
                    onUpdateTask={handleTaskUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="habits" className="m-0">
                  <HabitGoalTracker
                    task={updatedTask} 
                    onUpdateTask={handleTaskUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="focus" className="m-0">
                  <FocusMode
                    task={updatedTask} 
                    onUpdateTask={handleTaskUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="analytics" className="m-0">
                  <TaskAnalytics
                    task={updatedTask} 
                    onUpdateTask={handleTaskUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="rewards" className="m-0">
                  <GamificationRewards
                    task={updatedTask} 
                    onUpdateTask={handleTaskUpdate}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};