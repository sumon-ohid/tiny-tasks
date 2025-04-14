'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { exampleStatuses } from '@/lib/content';
import { generateId } from '@/lib/storage';
import type { Feature, Status } from '@/lib/storage';
import { addDays } from 'date-fns';

type TaskModalProps = {
  task?: Feature;
  onSave: (task: Feature) => void;
  onCancel: () => void;
  currentUser: { id: string; name: string; image?: string };
};

export const TaskModal = ({ task, onSave, onCancel, currentUser }: TaskModalProps) => {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [statusId, setStatusId] = useState(task?.status.id || exampleStatuses[0].id);
  const [startDate, setStartDate] = useState(
    task?.startAt ? new Date(task.startAt) : new Date()
  );
  const [endDate, setEndDate] = useState(
    task?.endAt ? new Date(task.endAt) : addDays(new Date(), 7)
  );
  const [initiative, setInitiative] = useState(task?.initiative?.name || 'General');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedStatus = exampleStatuses.find(status => status.id === statusId) || exampleStatuses[0];
    
    const updatedTask: Feature = {
      id: task?.id || generateId(),
      name,
      status: selectedStatus,
      startAt: startDate,
      endAt: endDate,
      description,
      owner: currentUser,
      initiative: {
        id: task?.initiative?.id || generateId(),
        name: initiative
      }
    };
    
    onSave(updatedTask);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Task Name *
            </label>
            <input
              id="name"
              className="w-full p-2 border rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="w-full p-2 border rounded-md min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">
                Status *
              </label>
              <select
                id="status"
                className="w-full p-2 border rounded-md"
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
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="initiative">
                Initiative
              </label>
              <input
                id="initiative"
                className="w-full p-2 border rounded-md"
                value={initiative}
                onChange={(e) => setInitiative(e.target.value)}
                placeholder="E.g., Project X"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="startDate">
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                className="w-full p-2 border rounded-md"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
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
                className="w-full p-2 border rounded-md"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-md font-medium bg-secondary hover:bg-secondary/80"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!name}
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};