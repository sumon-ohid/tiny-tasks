'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kibo-ui/kanban';
import type { DragEndEvent } from '@/components/ui/kibo-ui/kanban';
import { exampleStatuses } from '@/lib/content';
import { LoginModal } from '@/components/ui/kibo-ui/login-modal';
import { UserProfile } from '@/components/ui/kibo-ui/user-profile';
import { Nav } from '@/components/ui/kibo-ui/nav';
import { TaskModal } from '@/components/ui/kibo-ui/task-modal';
import { TaskDetail } from '@/components/ui/kibo-ui/task-detail';
import { AuthProvider, useAuthContext } from '@/lib/auth';
import NotesEditor from '@/components/ui/kibo-ui/notes-editor';
import { 
  getUserFeatures,
  saveUserFeatures, 
  updateUserFeature,
  addUserFeature,
  removeUserFeature,
  type Feature 
} from '@/lib/storage';
import { Toaster, toast } from 'sonner';
import Image from 'next/image';

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});

const ACTIVE_USERS = [
  { id: '1', name: 'Alice Johnson', image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=1' },
  { id: '2', name: 'Bob Smith', image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=2' },
  { id: '3', name: 'Charlie Brown', image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=3' }
];

// Kanban page component
const KanbanPage = () => {
  const { user } = useAuthContext();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedTask, setSelectedTask] = useState<Feature | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Feature | undefined>(undefined);
  const [activeUsers, setActiveUsers] = useState(ACTIVE_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'compact'>('board');

  // Filter tasks based on search query - memoized for performance
  const filteredFeatures = useMemo(() => {
    return features.filter(
      feature => 
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        feature.initiative?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [features, searchQuery]);

  // Load user's features when user changes
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    const userFeatures = getUserFeatures(user.id);
    setFeatures(userFeatures);
    
    // Apply user preferences
    if (user.preferences?.compactView) {
      setViewMode('compact');
    } else {
      setViewMode('board');
    }
    
    if (!activeUsers.some(u => u.id === user.id) && user.image) {
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user as { id: string; name: string; image: string }]);
    }
    
    setIsLoading(false);
  }, [user, activeUsers]);

  // Handle drag and drop
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!user) return;
    
    const { active, over } = event;
    
    // Debug information for drag & drop
    console.log('[DragEnd]', {
      active: {
        id: active.id,
        data: active.data.current,
      },
      over: over ? {
        id: over.id,
        data: over.data.current,
      } : 'none',
    });
  
    if (!over || !active.data.current) return;
  
    const activeData = active.data.current;
    const isCard = activeData.type === 'Card';
    
    if (!isCard) return;
  
    const activeIndex = features.findIndex(f => f.id === active.id);
    if (activeIndex === -1) return;
  
    const updatedFeatures = [...features];
    const movedFeature = { ...updatedFeatures[activeIndex] };
    updatedFeatures.splice(activeIndex, 1);
  
    // Check if this is a column by matching its ID with exampleStatuses
    const isColumnId = exampleStatuses.some(s => s.id === over.id);
    const targetColumnId = isColumnId ? over.id.toString() : null;
    const isCardOver = over.data.current?.type === 'Card';
    
    // Case 1: Dropping onto a column/board
    if (targetColumnId) {
      const status = exampleStatuses.find(s => s.id === targetColumnId);
      if (!status) return;
      
      movedFeature.status = status;
      
      // Find all features with the target status (after removal of the moved feature)
      const featuresInTargetStatus = updatedFeatures.filter(f => f.status.id === status.id);
      
      if (featuresInTargetStatus.length === 0) {
        // No items in this column, just add it
        updatedFeatures.push(movedFeature);
      } else {
        // There are items in this column already
        
        // Check if we were dropped near a card in the column
        if (over.data.current?.type === 'Card') {
          // We were dropped on a card - check if that card is in the target column
          const overIndex = updatedFeatures.findIndex(f => f.id === over.id);
          if (overIndex !== -1 && updatedFeatures[overIndex].status.id === status.id) {
            // The card we dropped on is in the target column, insert at that position
            updatedFeatures.splice(overIndex, 0, movedFeature);
          } else {
            // The card we dropped on is not in the target column 
            // (this can happen during column transitions due to DND quirks)
            // Add to the end of the target column
            updatedFeatures.push(movedFeature);
          }
        } else {
          // We were dropped directly on the column, add to the end of the column's cards
          updatedFeatures.push(movedFeature);
        }
      }
      
      toast.success(`Moved "${movedFeature.name}" to ${status.name}`);
    } 
    // Case 2: Dropping onto another card
    else if (isCardOver) {
      const overIndex = features.findIndex(f => f.id === over.id);
      if (overIndex === -1) return;
      
      // Get the status from the card we're dropping onto
      const targetStatus = features[overIndex].status;
      movedFeature.status = targetStatus;
      
      // Insert at the position of the target card
      updatedFeatures.splice(overIndex, 0, movedFeature);
      
      toast.success(`Moved "${movedFeature.name}" to ${targetStatus.name}`);
    }
    // Case 3: Fallback - just add to the end with the same status
    else {
      updatedFeatures.push(movedFeature);
    }
  
    setFeatures(updatedFeatures);
    saveUserFeatures(user.id, updatedFeatures);
    updateUserFeature(user.id, movedFeature);
  }, [features, user]);

  // Handle task creation/update
  const handleSaveTask = useCallback((task: Feature) => {
    if (!user) return;
    
    if (editingTask) {
      const updatedFeatures = features.map(feature => 
        feature.id === task.id ? task : feature
      );
      setFeatures(updatedFeatures);
      saveUserFeatures(user.id, updatedFeatures);
      toast.success(`Task "${task.name}" updated`);
    } else {
      const updatedFeatures = addUserFeature(user.id, task);
      setFeatures(updatedFeatures);
      toast.success(`Task "${task.name}" created`);
    }
    
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
  }, [editingTask, features, user]);

  // Handle task deletion
  const handleDeleteTask = useCallback(() => {
    if (!user || !selectedTask) return;
    
    const updatedFeatures = removeUserFeature(user.id, selectedTask.id);
    setFeatures(updatedFeatures);
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
    toast.success(`Task "${selectedTask.name}" deleted`);
  }, [selectedTask, user]);

  // Handle direct deletion from task card
  const handleDirectTaskDelete = useCallback((taskId: string) => {
    if (!user) return;
    
    const taskToDelete = features.find(f => f.id === taskId);
    if (!taskToDelete) return;
    
    const updatedFeatures = removeUserFeature(user.id, taskId);
    setFeatures(updatedFeatures);
    toast.success(`Task "${taskToDelete.name}" deleted`);
  }, [features, user]);

  // Handle opening task detail view
  const handleOpenTaskDetail = useCallback((task: Feature) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  }, []);

  // Handle opening task edit
  const handleEditTask = useCallback(() => {
    if (selectedTask) {
      setEditingTask(selectedTask);
      setIsTaskDetailOpen(false);
      setIsTaskModalOpen(true);
    }
  }, [selectedTask]);

  // Get task counts by status
  const getTaskCountByStatus = useCallback((statusId: string) => {
    return filteredFeatures.filter(feature => feature.status.id === statusId).length;
  }, [filteredFeatures]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'board' ? 'compact' : 'board';
    setViewMode(newMode);
    
    if (user && user.preferences) {
      // This will be handled by the context in a real implementation
    }
  }, [viewMode, user]);

  // No need to render anything if not logged in
  if (!user) {
    return <LoginModal />;
  }
  
  // Skeleton loader while loading features
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b gap-4">
          <div className="animate-pulse h-8 w-32 bg-muted rounded"></div>
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="animate-pulse h-10 w-64 bg-muted rounded"></div>
            <div className="animate-pulse h-10 w-24 bg-muted rounded"></div>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(col => (
              <div key={col} className="h-full min-h-40 flex flex-col gap-2 rounded-md border p-2">
                <div className="animate-pulse h-6 w-24 bg-muted rounded mb-4"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-24 w-full bg-muted rounded mb-2"></div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b gap-4 bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Nav />
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md pr-8"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg 
              className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              onClick={() => {
                setEditingTask(undefined);
                setIsTaskModalOpen(true);
              }}
            >
              Add Task
            </button>
            
            <button 
              className="px-3 py-2 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => setIsNotesOpen(true)}
              aria-label="Open notes"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            
            <button 
              className="px-3 py-2 rounded-md font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={toggleViewMode}
              aria-label={`Switch to ${viewMode === 'board' ? 'compact' : 'board'} view`}
            >
              {viewMode === 'board' ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              )}
            </button>
          </div>
          
          <UserProfile />
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        {viewMode === 'board' ? (
          <KanbanProvider onDragEnd={handleDragEnd} className="p-4">
            {exampleStatuses.map((status) => (
              <KanbanBoard key={status.id} id={status.id}>
                <KanbanHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <p className="m-0 font-semibold text-sm">{status.name}</p>
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {getTaskCountByStatus(status.id)}
                    </span>
                  </div>
                </KanbanHeader>
                
                <KanbanCards>
                  {filteredFeatures
                    .filter((feature) => feature.status.id === status.id)
                    .map((feature, index) => (
                      <KanbanCard
                        key={feature.id}
                        id={feature.id}
                        name={feature.name}
                        index={index}
                        parent={status.id}
                        onClick={() => handleOpenTaskDetail(feature)}
                        onDelete={handleDirectTaskDelete}
                        onEdit={() => {
                          setEditingTask(feature);
                          setIsTaskModalOpen(true);
                        }}
                        emoji={feature.emoji}
                      >
                        <div className="flex flex-col h-full">
                          <div className="mb-2">
                            <h3 className="font-medium text-sm">{feature.name}</h3>
                            {feature.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {feature.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-auto pt-2 flex flex-col gap-2">
                            {feature.initiative && (
                              <div className="flex items-center">
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                  {feature.initiative.name}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {shortDateFormatter.format(
                                  feature.endAt instanceof Date 
                                    ? feature.endAt 
                                    : new Date(feature.endAt)
                                )}
                              </div>
                              
                              {feature.owner && (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={feature.owner.image} alt={feature.owner.name} />
                                  <AvatarFallback>{feature.owner.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        </div>
                      </KanbanCard>
                    ))}
                </KanbanCards>
              </KanbanBoard>
            ))}
          </KanbanProvider>
        ) : (
          <div className="space-y-6">
            {exampleStatuses.map((status) => {
              const statusFeatures = filteredFeatures.filter(
                (feature) => feature.status.id === status.id
              );
              
              if (statusFeatures.length === 0) return null;
              
              return (
                <div key={status.id} className="rounded-lg border overflow-hidden">
                  <div 
                    className="px-4 py-3 font-medium flex items-center justify-between"
                    style={{ backgroundColor: `${status.color}20` }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span>{status.name}</span>
                    </div>
                    <span className="text-xs bg-background/90 px-2 py-0.5 rounded-full">
                      {statusFeatures.length}
                    </span>
                  </div>
                  <div className="divide-y">
                    {statusFeatures.map((feature) => (
                      <div 
                        key={feature.id} 
                        className="p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleOpenTaskDetail(feature)}
                      >
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {feature.emoji && (
                              <div className="relative w-6 h-6 overflow-hidden rounded-md">
                                <Image
                                  src={feature.emoji.url}
                                  alt="Task emoji"
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <h3 className="font-medium">{feature.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask(feature);
                                setIsTaskModalOpen(true);
                              }}
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
                              >
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectTaskDelete(feature.id);
                              }}
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
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {feature.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {feature.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            {feature.initiative && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {feature.initiative.name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">
                              Due {shortDateFormatter.format(
                                feature.endAt instanceof Date 
                                  ? feature.endAt 
                                  : new Date(feature.endAt)
                              )}
                            </span>
                          </div>
                          
                          {feature.owner && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={feature.owner.image} alt={feature.owner.name} />
                              <AvatarFallback>{feature.owner.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsTaskModalOpen(false);
            setEditingTask(undefined);
          }}
        />
      )}

      {isTaskDetailOpen && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      )}
      
      {isNotesOpen && (
        <NotesEditor 
          isOpen={isNotesOpen} 
          onClose={() => setIsNotesOpen(false)} 
        />
      )}
      
      <Toaster position="bottom-right" />
    </div>
  );
};

// Main Home component with AuthProvider
export default function Home() {
  return (
    <AuthProvider>
      <KanbanPage />
    </AuthProvider>
  );
}
