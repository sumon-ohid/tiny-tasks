'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import type { Feature } from '@/lib/storage';
import Image from 'next/image';

type TaskDetailProps = {
  task: Feature;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const TaskDetail = ({ task, onClose, onEdit, onDelete }: TaskDetailProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
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
        className="w-full max-w-2xl"
      >
        <Card className="p-0 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div 
            className="p-6 pb-4 border-b relative"
            style={{ backgroundColor: `${task.status.color}10` }}
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
              {task.emoji && (
                <div className="relative w-12 h-12 overflow-hidden rounded-full mt-1">
                  <Image
                    src={task.emoji.url}
                    alt="Task emoji"
                    width={48}
                    height={48}
                    className="object-cover rounded-full"
                    unoptimized
                    onError={(e) => {
                      // Try to reload with a different format if it fails
                      const img = e.currentTarget;
                      if (task.emoji && !img.src.includes('&format=png')) {
                        img.src = `${task.emoji.url.split('?')[0]}?seed=${task.emoji.seed}&backgroundColor=transparent&radius=50&format=png`;
                      } else {
                        // If PNG also fails or emoji doesn't exist, use a fallback emoji
                        img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23eaad80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`;
                      }
                    }}
                  />
                </div>
              )}
              <h2 className="text-xl font-bold pr-16">{task.name}</h2>
            </div>
            
            <div className="flex items-center gap-3 mt-3">
              <div
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: `${task.status.color}25`,
                  color: task.status.color 
                }}
              >
                {task.status.name}
              </div>
              
              {task.initiative && (
                <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                  {task.initiative.name}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {task.description && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {task.description}
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
                            task.startAt instanceof Date 
                              ? task.startAt 
                              : new Date(task.startAt),
                            'MMM d, yyyy'
                          )}
                        </div>
                      </div>
                      
                      <div className="text-muted-foreground">→</div>
                      
                      <div className="space-y-1 text-right">
                        <div className="text-xs text-muted-foreground">Due Date</div>
                        <div className="font-medium">
                          {format(
                            task.endAt instanceof Date 
                              ? task.endAt 
                              : new Date(task.endAt),
                            'MMM d, yyyy'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {task.emoji && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Emoji Style</h3>
                    <div className="p-4 bg-muted/30 rounded-lg flex items-center gap-3">
                      <div className="relative w-10 h-10 overflow-hidden rounded-full">
                        <Image
                          src={task.emoji.url}
                          alt="Task emoji"
                          width={40}
                          height={40}
                          className="object-cover rounded-full"
                          unoptimized
                          onError={(e) => {
                            // Try to reload with a different format if it fails
                            const img = e.currentTarget;
                            if (task.emoji && !img.src.includes('&format=png')) {
                              img.src = `${task.emoji.url.split('?')[0]}?seed=${task.emoji.seed}&backgroundColor=transparent&radius=50&format=png`;
                            } else {
                              // If PNG also fails or emoji doesn't exist, use a fallback emoji
                              img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23eaad80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`;
                            }
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>{task.emoji.style}</div>
                        <div>Seed: {task.emoji.seed}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Task ID</h3>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="font-mono text-xs text-muted-foreground">
                      {task.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 dark:text-red-400">Are you sure?</span>
                <button
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded-md text-sm dark:bg-red-700"
                  onClick={onDelete}
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md text-sm font-medium transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Task
              </button>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};