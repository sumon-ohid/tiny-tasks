'use client';

import { useState, useRef, useEffect } from 'react';
import type { Feature } from '@/lib/storage';

type ContextMenuProps = {
  task: Feature;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToPlanned: () => void;
  onMoveToInProgress: () => void;
  onMoveToDone: () => void;
  onClose: () => void;
  position: { x: number; y: number };
};

export const TaskContextMenu = ({
  task,
  onEdit,
  onDelete,
  onMoveToPlanned,
  onMoveToInProgress,
  onMoveToDone,
  onClose,
  position
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Adjust position if menu would appear off-screen
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 200)
  };

  return (
    <div 
      ref={menuRef}
      className="absolute z-50 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100"
      style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
    >
      <div className="py-1">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={onEdit}
        >
          Edit Task
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          onClick={onDelete}
        >
          Delete Task
        </button>
      </div>
      
      <div className="py-1">
        <p className="px-4 py-1 text-xs text-gray-500">Move to:</p>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          onClick={onMoveToPlanned}
          disabled={task.status.name === 'Planned'}
        >
          <div className="h-2 w-2 rounded-full bg-[#6B7280] mr-2"></div>
          Planned
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          onClick={onMoveToInProgress}
          disabled={task.status.name === 'In Progress'}
        >
          <div className="h-2 w-2 rounded-full bg-[#F59E0B] mr-2"></div>
          In Progress
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          onClick={onMoveToDone}
          disabled={task.status.name === 'Done'}
        >
          <div className="h-2 w-2 rounded-full bg-[#10B981] mr-2"></div>
          Done
        </button>
      </div>
    </div>
  );
};