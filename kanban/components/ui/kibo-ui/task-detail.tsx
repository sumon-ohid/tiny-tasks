'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Feature } from '@/lib/storage';
import { format } from 'date-fns';

type TaskDetailProps = {
  task: Feature;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const TaskDetail = ({ task, onClose, onEdit, onDelete }: TaskDetailProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold truncate">{task.name}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted"
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

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">
                {task.description || "No description provided."}
              </p>
            </div>

            {task.initiative && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Initiative</h3>
                <p className="text-sm">{task.initiative.name}</p>
              </div>
            )}

            {task.product && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Product</h3>
                <p className="text-sm">{task.product.name}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: task.status.color }}
                ></div>
                <p className="text-sm">{task.status.name}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Timeline</h3>
              <p className="text-sm">
                {format(new Date(task.startAt), 'MMM d, yyyy')} - {format(new Date(task.endAt), 'MMM d, yyyy')}
              </p>
            </div>

            {task.owner && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Owner</h3>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.owner.image} />
                    <AvatarFallback>{task.owner.name?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">{task.owner.name}</p>
                </div>
              </div>
            )}

            {task.release && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Release</h3>
                <p className="text-sm">{task.release.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-md font-medium text-white bg-red-500 hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </button>
        </div>
      </Card>
    </div>
  );
};