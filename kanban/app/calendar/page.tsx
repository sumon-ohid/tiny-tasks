'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { AuthProvider, useAuthContext } from '@/lib/auth';
import { useContentContext, type Feature } from '@/lib/content-provider';
import { LoginModal } from '@/components/ui/kibo-ui/login-modal';
import { Nav } from '@/components/ui/kibo-ui/nav';
import { TaskModal } from '@/components/ui/kibo-ui/task-modal';
import { TaskDetail } from '@/components/ui/kibo-ui/task-detail';
import { Card } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';

const CalendarPageContent = () => {
  const { user } = useAuthContext();
  const { features, isLoading: isContentLoading, statuses, setFeatures } = useContentContext();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate] = useState<Date | undefined>(new Date());
  const [selectedTask, setSelectedTask] = useState<Feature | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Feature | undefined>(undefined);

  // Calculate days in month, etc.
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  // Group features by date - Handle potentially undefined dates
  const featuresByDate = useMemo(() => {
    const grouped: { [key: string]: Feature[] } = {};
    features.forEach(feature => {
      // Use startAt for grouping, ensure it's a valid Date
      if (feature.startAt instanceof Date) {
        const dateKey = format(feature.startAt, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(feature);
      }
    });
    return grouped;
  }, [features]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Toggle task modal for creating new tasks
  const toggleTaskModal = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };
  
  // Get tasks for a specific day
  const getTasksForDay = (day: Date | null) => {
    if (!day) return [];
    
    return features.filter(feature => {
      // Only compare if feature.endAt is a valid Date
      if (feature.endAt instanceof Date) {
        const taskDate = feature.endAt; // Already a Date object
        return (
          taskDate.getDate() === day.getDate() &&
          taskDate.getMonth() === day.getMonth() &&
          taskDate.getFullYear() === day.getFullYear()
        );
      }
      return false; // Skip features without a valid end date
    });
  };
  
  // Handle task creation/editing
  const handleSaveTask = useCallback((taskData: Partial<Feature>) => {
    if (editingTask) {
      setFeatures(prevFeatures => 
        prevFeatures.map(feature => 
          feature.id === editingTask.id ? { ...feature, ...taskData } : feature
        )
      );
      toast.success(`Task "${taskData.name || editingTask.name}" updated`);
    } else {
      const defaultStatus = statuses[0] || { id: 'todo', name: 'To Do', color: '#6B7280' };
      const newTask: Feature = {
        id: `task_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: taskData.name || 'New Task',
        status: taskData.status || defaultStatus,
        description: taskData.description,
        // Ensure startAt is set, default to selectedDate (if defined) or today
        startAt: taskData.startAt || (selectedDate instanceof Date ? selectedDate : new Date()), 
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
  }, [editingTask, setFeatures, statuses, selectedDate]);
  
  // Handle opening task detail
  const handleOpenTaskDetail = (task: Feature) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };
  
  // Handle editing a task
  const handleEditTask = () => {
    if (selectedTask) {
      setEditingTask(selectedTask);
      setIsTaskDetailOpen(false);
      setIsTaskModalOpen(true);
    }
  };
  
  // Handle deleting a task
  const handleDeleteTask = useCallback(() => {
    if (!selectedTask) return;
    const taskName = selectedTask.name;
    setFeatures(prevFeatures => prevFeatures.filter(f => f.id !== selectedTask.id));
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
    toast.success(`Task "${taskName}" deleted`);
  }, [selectedTask, setFeatures]);
  
  // No need to render anything if not logged in
  if (!user) {
    return <LoginModal />;
  }
  
  // Skeleton loader while loading features
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
          <div className="animate-pulse h-full bg-muted rounded-lg min-h-[600px]"></div>
        </main>
      </div>
    );
  }
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allDays = daysInMonth;
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b gap-4 bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Nav />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              onClick={toggleTaskModal}
            >
              Add Task
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        <Card className="p-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{format(currentMonth, 'MMM')}</h1>
              <div className="text-2xl font-light">{format(currentMonth, 'yyyy')}</div>
              <div className="text-sm text-muted-foreground">
                {features.length} tasks
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Previous month"
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
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
              >
                Today
              </button>
              
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Next month"
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
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
            {/* Day Headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="p-2 text-center font-medium text-sm bg-card">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {allDays.map((day, index) => {
              const tasksForDay = day ? getTasksForDay(day) : [];
              const isCurrentDay = day ? isToday(day) : false;
              
              return (
                <div 
                  key={day ? day.toString() : `empty-${index}`}
                  className={`min-h-24 p-2 bg-card relative flex flex-col ${
                    isCurrentDay ? 'ring-2 ring-primary ring-inset' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-right mb-1 ${
                        isCurrentDay 
                          ? 'text-primary font-bold'
                          : 'text-muted-foreground'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1 overflow-y-auto flex-1">
                        {(featuresByDate[format(day, 'yyyy-MM-dd')] || []).map(feature => (
                          <div
                            key={feature.id}
                            className="text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: `${feature.status.color}40` }}
                            onClick={() => handleOpenTaskDetail(feature)}
                          >
                            {feature.name}
                          </div>
                        ))}
                        
                        {tasksForDay.length > 3 && (
                          <div className="text-xs text-muted-foreground p-1">
                            +{tasksForDay.length - 3} more
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          // Define a partial Feature type for the new task
                          const newTask: Partial<Feature> = {
                            startAt: day,
                            endAt: day,
                            // Add default values for other required Feature fields if necessary
                            // e.g., id: crypto.randomUUID(), name: '', status: 'todo', etc.
                            // Depending on what TaskModal expects. For now, just setting dates.
                          };
                          setEditingTask(newTask as Feature); // Cast to Feature, assuming TaskModal handles partial data
                          setIsTaskModalOpen(true);
                        }}
                        className="absolute right-1 top-1 p-1 rounded-full opacity-0 hover:opacity-100 hover:bg-muted/80 transition-opacity focus:opacity-100"
                        aria-label="Add task"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
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
      
      <Toaster position="bottom-right" />
    </div>
  );
};

export default function CalendarPage() {
  return (
    <AuthProvider>
      <CalendarPageContent />
    </AuthProvider>
  );
} 