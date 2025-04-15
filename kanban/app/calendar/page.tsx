'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isEqual, parse } from 'date-fns';
import { AuthProvider, useAuthContext } from '@/lib/auth';
import { getUserFeatures, type Feature } from '@/lib/storage';
import { LoginModal } from '@/components/ui/kibo-ui/login-modal';
import { Nav } from '@/components/ui/kibo-ui/nav';
import { UserProfile } from '@/components/ui/kibo-ui/user-profile';
import { TaskModal } from '@/components/ui/kibo-ui/task-modal';
import { TaskDetail } from '@/components/ui/kibo-ui/task-detail';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster, toast } from 'sonner';
import Image from 'next/image';

const CalendarPageContent = () => {
  const { user } = useAuthContext();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedTask, setSelectedTask] = useState<Feature | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Feature | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(currentDate, 'MMM'));
  const [currentYear, setCurrentYear] = useState(format(currentDate, 'yyyy'));
  
  // Generate days for the current month view
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = monthStart;
    const endDate = monthEnd;
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };
  
  // Get the start day of month (0 = Sunday, 1 = Monday, etc.)
  const getStartDayOfMonth = () => {
    return getDay(startOfMonth(currentDate));
  };
  
  // Get all days to display including empty slots for proper grid layout
  const getAllDaysInGrid = () => {
    const days = getDaysInMonth();
    const startDay = getStartDayOfMonth();
    
    // Create empty slots for days before the 1st of the month
    const emptySlotsAtStart = Array(startDay).fill(null);
    
    // Calculate how many empty slots needed at the end to make a complete grid
    // Grid should have 6 rows (42 cells) for consistent month view
    const totalCellsNeeded = 42;
    const emptySlotsAtEnd = Array(totalCellsNeeded - (emptySlotsAtStart.length + days.length)).fill(null);
    
    return [...emptySlotsAtStart, ...days, ...emptySlotsAtEnd];
  };
  
  // Load features for the logged in user
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    const userFeatures = getUserFeatures(user.id);
    setFeatures(userFeatures);
    setIsLoading(false);
  }, [user]);
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentDate(previousMonth);
    setCurrentMonth(format(previousMonth, 'MMM'));
    setCurrentYear(format(previousMonth, 'yyyy'));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
    setCurrentMonth(format(nextMonth, 'MMM'));
    setCurrentYear(format(nextMonth, 'yyyy'));
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
      const taskDate = new Date(feature.endAt);
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear()
      );
    });
  };
  
  // Handle task creation/editing
  const handleSaveTask = (task: Feature) => {
    if (!user) return;
    
    let updatedFeatures;
    
    if (editingTask) {
      updatedFeatures = features.map(feature => 
        feature.id === task.id ? task : feature
      );
      toast.success(`Task "${task.name}" updated`);
    } else {
      updatedFeatures = [...features, task];
      toast.success(`Task "${task.name}" created`);
    }
    
    setFeatures(updatedFeatures);
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
  };
  
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
  const handleDeleteTask = () => {
    if (!user || !selectedTask) return;
    
    const updatedFeatures = features.filter(
      feature => feature.id !== selectedTask.id
    );
    setFeatures(updatedFeatures);
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
    toast.success(`Task "${selectedTask.name}" deleted`);
  };
  
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
          <div className="animate-pulse h-full bg-muted rounded-lg min-h-[600px]"></div>
        </main>
      </div>
    );
  }
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allDays = getAllDaysInGrid();
  
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
          
          <UserProfile />
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        <Card className="p-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{currentMonth}</h1>
              <div className="text-2xl font-light">{currentYear}</div>
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
                onClick={() => setCurrentDate(new Date())}
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
                        {tasksForDay.length > 0 ? (
                          tasksForDay.map((task) => (
                            <div 
                              key={task.id}
                              onClick={() => handleOpenTaskDetail(task)}
                              className="p-1 text-xs rounded cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-1"
                            >
                              {task.emoji && (
                                <div className="relative w-4 h-4 flex-shrink-0">
                                  <Image
                                    src={task.emoji.url}
                                    alt=""
                                    width={16}
                                    height={16}
                                  />
                                </div>
                              )}
                              <div className="truncate">{task.name}</div>
                            </div>
                          ))
                        ) : null}
                        
                        {tasksForDay.length > 3 && (
                          <div className="text-xs text-muted-foreground p-1">
                            +{tasksForDay.length - 3} more
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          const newTask = {
                            startAt: day,
                            endAt: day
                          };
                          setEditingTask(newTask as any);
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
          currentUser={user}
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