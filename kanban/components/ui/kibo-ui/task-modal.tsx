'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { exampleStatuses } from '@/lib/content';
import { generateId } from '@/lib/storage';
import type { Feature } from '@/lib/storage';
import { addDays, isAfter, format } from 'date-fns';
import { EmojiPicker } from './emoji-picker';

type TaskModalProps = {
  task?: Feature;
  onSave: (task: Feature) => void;
  onCancel: () => void;
};

export const TaskModal = ({ task, onSave, onCancel }: TaskModalProps) => {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [statusId, setStatusId] = useState(task?.status.id || exampleStatuses[0].id);
  const [startDate, setStartDate] = useState(
    task?.startAt ? new Date(task.startAt) : new Date()
  );
  const [endDate, setEndDate] = useState(
    task?.endAt ? new Date(task.endAt) : addDays(new Date(), 7)
  );
  const [initiative, setInitiative] = useState(task?.initiative?.name || '');
  const [emoji, setEmoji] = useState(task?.emoji);
  
  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    dates?: string;
  }>({});
  
  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } }
  };

  // Update state values when task prop changes
  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setDescription(task.description || '');
      setStatusId(task.status.id || exampleStatuses[0].id);
      setStartDate(task.startAt instanceof Date ? task.startAt : new Date(task.startAt));
      setEndDate(task.endAt instanceof Date ? task.endAt : new Date(task.endAt));
      setInitiative(task.initiative?.name || '');
      setEmoji(task.emoji);
    }
  }, [task]);

  const validateForm = (): boolean => {
    const newErrors: {name?: string; dates?: string} = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Task name is required';
    }
    
    // Validate dates
    if (isAfter(startDate, endDate)) {
      newErrors.dates = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const selectedStatus = exampleStatuses.find(status => status.id === statusId) || exampleStatuses[0];
    
    const updatedTask: Feature = {
      id: task?.id || generateId(),
      name,
      status: selectedStatus,
      startAt: startDate,
      endAt: endDate,
      description,
      emoji,
      initiative: initiative ? {
        id: task?.initiative?.id || generateId(),
        name: initiative
      } : undefined
    };
    
    onSave(updatedTask);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayVariants}
      onClick={onCancel}
    >
      <motion.div 
        onClick={e => e.stopPropagation()}
        variants={modalVariants}
        className="w-full max-w-lg bg-transparent"
      >
        <Card className="p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button 
              type="button" 
              className="p-2 rounded-full hover:bg-muted"
              onClick={onCancel}
              aria-label="Close"
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-3 items-start">
              <EmojiPicker 
                onSelect={setEmoji} 
                currentEmoji={emoji}
              />
              
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium" htmlFor="name">
                  Task Name *
                </label>
                <input
                  id="name"
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.name ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors({...errors, name: undefined});
                    }
                  }}
                  placeholder="Enter task name"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="w-full p-2 border rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">
                  Status *
                </label>
                <div className="relative">
                  <select
                    id="status"
                    className="w-full p-2 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={statusId}
                    onChange={(e) => setStatusId(e.target.value)}
                    required
                  >
                    {exampleStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="initiative">
                  Initiative
                </label>
                <input
                  id="initiative"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={initiative}
                  onChange={(e) => setInitiative(e.target.value)}
                  placeholder="E.g., Project X"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="startDate">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.dates ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setStartDate(newDate);
                    if (errors.dates) {
                      setErrors({...errors, dates: undefined});
                    }
                  }}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="endDate">
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="date"
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.dates ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setEndDate(newDate);
                    if (errors.dates) {
                      setErrors({...errors, dates: undefined});
                    }
                  }}
                  required
                  min={format(startDate, 'yyyy-MM-dd')}
                />
              </div>
              {errors.dates && (
                <p className="text-red-500 text-xs col-span-2 mt-1">{errors.dates}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-md font-medium bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={!name}
              >
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
};