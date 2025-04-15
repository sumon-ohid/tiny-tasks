'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  rectIntersection,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';

export type { DragEndEvent } from '@dnd-kit/core';

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

export type KanbanBoardProps = {
  id: Status['id'];
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      className={cn(
        'flex h-full min-h-40 flex-col gap-2 rounded-md border bg-secondary p-2 text-xs shadow-sm outline outline-2 transition-all',
        isOver ? 'outline-primary' : 'outline-transparent',
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps = Pick<Feature, 'id' | 'name'> & {
  index: number;
  parent: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
};

export const KanbanCard = ({
  id,
  name,
  index,
  parent,
  children,
  className,
  onClick,
  onDelete,
  onEdit,
}: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: { index, parent },
    });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick of the card
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick of the card
    if (onEdit) {
      onEdit();
    } else if (onClick) {
      // Fallback to onClick if onEdit is not provided
      onClick();
    }
  };

  // Make the card draggable but not clickable so buttons work properly
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClick) {
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        'rounded-md p-3 shadow-sm relative group',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        transform: transform
          ? `translateX(${transform.x}px) translateY(${transform.y}px)`
          : 'none',
      }}
      onClick={handleCardClick}
      {...listeners}
      {...attributes}
      ref={setNodeRef}
    >
      <div className="pb-6"> {/* Add bottom padding to make room for buttons */}
        {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
      </div>
      
      {/* Action buttons row at the bottom */}
      <div className="absolute bottom-2 right-2 left-2 flex justify-end gap-2 z-10">
        {onEdit && (
          <button
            className="px-2 py-1 rounded bg-blue-100 text-blue-600 text-xs font-medium hover:bg-blue-200"
            onClick={handleEdit}
            aria-label="Edit task"
          >
            Edit
          </button>
        )}
        
        {onDelete && (
          <button
            className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200"
            onClick={handleDelete}
            aria-label="Delete task"
          >
            Delete
          </button>
        )}
      </div>
    </Card>
  );
};

export type KanbanCardsProps = {
  children: ReactNode;
  className?: string;
};

export const KanbanCards = ({ children, className }: KanbanCardsProps) => (
  <div className={cn('flex flex-1 flex-col gap-2', className)}>{children}</div>
);

export type KanbanHeaderProps =
  | {
      children: ReactNode;
    }
  | {
      name: Status['name'];
      color: Status['color'];
      className?: string;
    };

export const KanbanHeader = (props: KanbanHeaderProps) =>
  'children' in props ? (
    props.children
  ) : (
    <div className={cn('flex shrink-0 items-center gap-2', props.className)}>
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: props.color }}
      />
      <p className="m-0 font-semibold text-sm">{props.name}</p>
    </div>
  );

export type KanbanProviderProps = {
  children: ReactNode;
  onDragEnd: (event: DragEndEvent) => void;
  className?: string;
};

export const KanbanProvider = ({
  children,
  onDragEnd,
  className,
}: KanbanProviderProps) => (
  <DndContext collisionDetection={rectIntersection} onDragEnd={onDragEnd}>
    <div
      className={cn('grid w-full auto-cols-fr grid-flow-col gap-4', className)}
    >
      {children}
    </div>
  </DndContext>
);
