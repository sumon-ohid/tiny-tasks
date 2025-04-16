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
import { LoginModal } from '@/components/ui/kibo-ui/login-modal';
import { Nav } from '@/components/ui/kibo-ui/nav';
import { TaskModal } from '@/components/ui/kibo-ui/task-modal';
import { TaskDetail } from '@/components/ui/kibo-ui/task-detail';
import { useAuthContext } from '@/lib/auth';
import NotesEditor from '@/components/ui/kibo-ui/notes-editor';
import { Toaster, toast } from 'sonner';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useContentContext, type Feature } from "@/lib/content-provider";

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});


// Kanban page component
const KanbanPage = () => {
  const { user } = useAuthContext();
  // Get features, statuses, setFeatures, clearFeatures, and isLoading from ContentContext
  const { features, statuses, setFeatures, clearFeatures, isLoading: isContentLoading } = useContentContext(); 
  const [selectedTask, setSelectedTask] = useState<Feature | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Feature | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'compact'>('board');

  // Filter tasks based on search query - use features from context
  const filteredFeatures = useMemo(() => {
    return features.filter(
      feature => 
        (feature.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || // Optional chaining
        (feature.initiative?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || // Optional chaining
        (feature.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) // Optional chaining
    );
  }, [features, searchQuery]);

  // Apply user preferences (viewMode) when user or content loads
   useEffect(() => {
    if (user && !isContentLoading) {
      setViewMode(user.preferences?.compactView ? 'compact' : 'board');
    }
  }, [user, isContentLoading]);

  // Handle drag and drop - use features/setFeatures from context
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    console.log('[DragEnd]', { /* ... logging ... */ });

    if (!over || !active.data.current) return;

    const activeData = active.data.current;
    const isCard = activeData.type === 'Card';
    if (!isCard) return;

    const activeIndex = features.findIndex(f => f.id === active.id);
    if (activeIndex === -1) return;

    const updatedFeatures = [...features]; // Start with current features from context
    const movedFeature = { ...updatedFeatures[activeIndex] };
    updatedFeatures.splice(activeIndex, 1); // Remove from original position

    // Check if dropping onto a column (status)
    const isColumnId = statuses.some(s => s.id === over.id); // Use statuses from context
    const targetColumnId = isColumnId ? over.id.toString() : null;
    const isCardOver = over.data.current?.type === 'Card';

    let targetStatus = null;
    let targetIndex = -1;

    if (targetColumnId) {
      // Dropped on a column
      targetStatus = statuses.find(s => s.id === targetColumnId);
      if (!targetStatus) return; // Should not happen
      
      // Find insertion point within the target column
      if (isCardOver) {
         // Dropped onto a specific card within the column
         targetIndex = updatedFeatures.findIndex(f => f.id === over.id);
      } else {
         // Dropped onto the column itself, append to the end of that column's features
         targetIndex = updatedFeatures.length; // Append logically first
      }
      
    } else if (isCardOver) {
      // Dropped onto another card
      targetIndex = updatedFeatures.findIndex(f => f.id === over.id);
      if (targetIndex === -1) return; // Target card not found (should not happen)
      targetStatus = updatedFeatures[targetIndex].status; // Inherit status from target card
    }

    if (targetStatus) {
      movedFeature.status = targetStatus;
      // Insert the moved feature at the calculated target index
      updatedFeatures.splice(targetIndex, 0, movedFeature);
      toast.success(`Moved "${movedFeature.name}" to ${targetStatus.name}`);
    } else {
      // Fallback: If no valid drop target identified, put it back at the end (or original position?)
      // For simplicity, let's just add it back to the end for now.
      updatedFeatures.push(movedFeature); 
    }

    setFeatures(updatedFeatures); // Update state via context's setFeatures
    // Context provider's useEffect will handle saving to local storage
  }, [features, statuses, setFeatures]); // Depend on context state/setters

  // Handle task creation/update - Ensure task conforms to Feature type
  const handleSaveTask = useCallback((taskData: Partial<Feature>) => { // Accept partial data from modal
    if (editingTask) {
      // Update existing task: merge existing with new data
      setFeatures(prevFeatures => 
        prevFeatures.map(feature => 
          feature.id === editingTask.id ? { ...feature, ...taskData } : feature
        )
      );
      toast.success(`Task "${taskData.name || editingTask.name}" updated`);
    } else {
      // Add new task: ensure mandatory fields are present and add ID
      // Status might come from taskData or default to first status
      const defaultStatus = statuses[0] || { id: 'todo', name: 'To Do', color: '#6B7280' };
      const newTask: Feature = {
        id: `task_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: taskData.name || 'New Task', // Provide default name
        status: taskData.status || defaultStatus, // Default status
        description: taskData.description,
        startAt: taskData.startAt,
        endAt: taskData.endAt,
        owner: taskData.owner,
        group: taskData.group,
        product: taskData.product,
        initiative: taskData.initiative,
        release: taskData.release,
        emoji: taskData.emoji,
      };
      setFeatures(prevFeatures => [...prevFeatures, newTask]);
      toast.success(`Task "${newTask.name}" created`);
    }
    
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
  }, [editingTask, setFeatures, statuses]); // Add statuses dependency

  // Handle task deletion - use setFeatures from context
  const handleDeleteTask = useCallback(() => {
    if (!selectedTask) return;
    const taskName = selectedTask.name;
    setFeatures(prevFeatures => prevFeatures.filter(f => f.id !== selectedTask.id));
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
    toast.success(`Task "${taskName}" deleted`);
  }, [selectedTask, setFeatures]); // Depend on context setter

  // Handle direct deletion from task card - use setFeatures from context
  const handleDirectTaskDelete = useCallback((taskId: string) => {
    const taskToDelete = features.find(f => f.id === taskId);
    if (!taskToDelete) return;
    const taskName = taskToDelete.name;
    setFeatures(prevFeatures => prevFeatures.filter(f => f.id !== taskId));
    toast.success(`Task "${taskName}" deleted`);
  }, [features, setFeatures]); // Depend on context state/setter

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

  // Get task counts by status - use features and statuses from context
  const getTaskCountByStatus = useCallback((statusId: string) => {
    // Add optional chaining for safer access
    return filteredFeatures.filter(feature => feature?.status?.id === statusId).length;
  }, [filteredFeatures]); // Depends on filteredFeatures which depends on context features

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
  
  // Use isContentLoading from context for the skeleton loader
  if (isContentLoading) {
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
            <Button 
              onClick={() => {
                setEditingTask(undefined); // Ensure editingTask is reset
                setIsTaskModalOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Task
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all
                    tasks from your board and local storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearFeatures} // Uses context function
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete all tasks
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
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
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        {viewMode === 'board' ? (
          <KanbanProvider onDragEnd={handleDragEnd} className="p-4">
            {/* Use statuses from context */} 
            {statuses.map((status) => (
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
                      {getTaskCountByStatus(status.id)} {/* Uses filteredFeatures from context */} 
                    </span>
                  </div>
                </KanbanHeader>
                
                <KanbanCards>
                   {/* Use filteredFeatures which depend on context features */}
                  {filteredFeatures 
                    .filter((feature) => feature?.status?.id === status.id)
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
                        // Provide default style/seed if emoji exists but properties are missing
                        emoji={feature.emoji ? { 
                          url: feature.emoji.url, 
                          style: feature.emoji.style || 'adventurer-neutral', // Default style
                          seed: feature.emoji.seed || 0 // Default seed
                        } : undefined}
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
                                {feature.endAt && shortDateFormatter.format(
                                  feature.endAt
                                )}
                              </div>
                              
                              {feature.owner && (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={feature.owner.image} alt={feature.owner.name} />
                                  <AvatarFallback>{feature.owner.name?.charAt(0)}</AvatarFallback>
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
            {/* Use statuses from context */}
            {statuses.map((status) => {
              // Use filteredFeatures which depend on context features
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
                    {/* Use statusFeatures derived from context features */}
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
                                handleDirectTaskDelete(feature.id); // Uses context features/setter
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
                              {feature.endAt && `Due ${shortDateFormatter.format(
                                feature.endAt
                              )}`}
                            </span>
                          </div>
                          
                          {feature.owner && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={feature.owner.image} alt={feature.owner.name} />
                              <AvatarFallback>{feature.owner.name?.charAt(0)}</AvatarFallback>
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
  return <KanbanPage />;
}
