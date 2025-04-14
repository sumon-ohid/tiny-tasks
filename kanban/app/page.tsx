'use client';

import { useState, useEffect } from 'react';
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
import { TaskModal } from '@/components/ui/kibo-ui/task-modal';
import { TaskDetail } from '@/components/ui/kibo-ui/task-detail';
import { AvatarStack } from '@/components/ui/kibo-ui/avatar-stack';
import { useAuth } from '@/lib/auth';
import { 
  getUserFeatures, 
  saveUserFeatures, 
  updateUserFeature,
  addUserFeature,
  removeUserFeature,
  type Feature 
} from '@/lib/storage';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});

// Mock active users for demonstration
const ACTIVE_USERS = [
  { id: '1', name: 'Alice Johnson', image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=1' },
  { id: '2', name: 'Bob Smith', image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=2' },
  { id: '3', name: 'Charlie Brown', image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=3' }
];

const Home = () => {
  const { user, users } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedTask, setSelectedTask] = useState<Feature | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Feature | undefined>(undefined);
  const [activeUsers, setActiveUsers] = useState(ACTIVE_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter tasks based on search query
  const filteredFeatures = features.filter(
    feature => feature.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              feature.initiative?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              feature.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load user's features when user changes
  useEffect(() => {
    if (user) {
      const userFeatures = getUserFeatures(user.id);
      setFeatures(userFeatures);
      
      // Update active users for the demo - in a real app this would come from a backend
      if (!activeUsers.some(u => u.id === user.id)) {
        setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      }
    }
  }, [user]);

  // Handle drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    if (!user) return;
    
    const { active, over } = event;

    if (!over) return;

    const status = exampleStatuses.find((status) => status.id === over.id);
    if (!status) return;

    const updatedFeatures = features.map((feature) => {
      if (feature.id === active.id) {
        const updatedFeature = { ...feature, status };
        // Update in storage
        updateUserFeature(user.id, updatedFeature);
        return updatedFeature;
      }
      return feature;
    });

    setFeatures(updatedFeatures);
  };

  // Handle task creation/update
  const handleSaveTask = (task: Feature) => {
    if (!user) return;

    if (editingTask) {
      // Update existing task
      const updatedFeatures = features.map(feature => 
        feature.id === task.id ? task : feature
      );
      setFeatures(updatedFeatures);
      saveUserFeatures(user.id, updatedFeatures);
    } else {
      // Add new task
      const updatedFeatures = addUserFeature(user.id, task);
      setFeatures(updatedFeatures);
    }
    
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
  };

  // Handle task deletion
  const handleDeleteTask = () => {
    if (!user || !selectedTask) return;
    
    const updatedFeatures = removeUserFeature(user.id, selectedTask.id);
    setFeatures(updatedFeatures);
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  };

  // Handle opening task detail view
  const handleOpenTaskDetail = (task: Feature) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  // Handle opening task edit
  const handleEditTask = () => {
    setEditingTask(selectedTask);
    setIsTaskDetailOpen(false);
    setIsTaskModalOpen(true);
  };

  // Get task counts by status
  const getTaskCountByStatus = (statusId: string) => {
    return filteredFeatures.filter(feature => feature.status.id === statusId).length;
  };

  if (!user) {
    return <LoginModal onLogin={() => {}} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with user profile and action buttons */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b gap-4">
        <div>
          <h1 className="text-xl font-bold">Personal Kanban Board</h1>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground mr-2">Active users:</span>
            <AvatarStack users={activeUsers} limit={5} />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
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
          
          <button 
            className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            onClick={() => {
              setEditingTask(undefined);
              setIsTaskModalOpen(true);
            }}
          >
            Add Task
          </button>
          
          <UserProfile />
        </div>
      </header>

      {/* Main kanban board */}
      <main className="flex-1 p-4 overflow-auto">
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
                      parent={status.id}
                      index={index}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleOpenTaskDetail(feature)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="m-0 flex-1 font-medium text-sm">
                            {feature.name}
                          </p>
                          <p className="m-0 text-muted-foreground text-xs">
                            {feature.initiative?.name}
                          </p>
                        </div>
                        {feature.owner && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={feature.owner.image} />
                            <AvatarFallback>
                              {feature.owner.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <p className="m-0 text-muted-foreground text-xs mt-2">
                        {shortDateFormatter.format(new Date(feature.startAt))} -{' '}
                        {dateFormatter.format(new Date(feature.endAt))}
                      </p>
                    </KanbanCard>
                  ))}
                  
                {filteredFeatures.filter(f => f.status.id === status.id).length === 0 && (
                  <div className="flex items-center justify-center h-24 border border-dashed rounded-md text-muted-foreground text-sm">
                    No tasks in this column
                  </div>
                )}
              </KanbanCards>
            </KanbanBoard>
          ))}
        </KanbanProvider>
      </main>

      {/* Task Modal for creating/editing */}
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

      {/* Task Detail Modal */}
      {isTaskDetailOpen && selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setIsTaskDetailOpen(false)}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default Home;