'use client';

import React, { type ReactNode } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';

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
  emoji?: {
    url: string;
    style: string;
    seed: number;
  };
};

export type KanbanBoardProps = {
  id: Status['id'];
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      id,
      accepts: ['Card'],
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-40 flex-col gap-2 rounded-md border p-2 text-xs shadow-sm outline-2 transition-all',
        isOver ? 'outline-primary bg-secondary/80' : 'outline-transparent',
        className
      )}
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
  emoji?: {
    url: string;
    style: string;
    seed: number;
  };
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
  emoji,
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'Card',
      parent,
      index,
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'touch-none select-none',
        isDragging && 'z-50'
      )}
    >
      <Card
        className={cn(
          'rounded-md p-3 shadow-sm relative group cursor-grab',
          'hover:shadow-md transition-all duration-200',
          isDragging && 'cursor-grabbing shadow-lg opacity-80 border-2 border-primary/30',
          className
        )}
      >
        <div 
          className="pb-8 w-full"
          {...listeners}
          onClick={() => !isDragging && onClick?.()}
        >
          {emoji && (
            <div className="float-right ml-2 mb-1">
              <div className="relative w-8 h-8 overflow-hidden rounded-full">
                <Image
                  src={emoji.url}
                  alt="Task emoji"
                  width={32}
                  height={32}
                  className="object-cover rounded-full"
                  unoptimized
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('&format=png')) {
                      img.src = `${emoji.url.split('?')[0]}?seed=${emoji.seed}&backgroundColor=transparent&radius=50&format=png`;
                    } else {
                      // If PNG also fails, use a fallback emoji
                      img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23eaad80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>`;
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
        </div>
        
        <div className="absolute bottom-2 right-2 left-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <button
              className="px-2 py-1 rounded bg-blue-100 text-blue-600 text-xs font-medium hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 active:bg-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit task"
              type="button"
            >
              Edit
            </button>
          )}
          
          {onDelete && (
            <button
              className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 active:bg-red-300 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(id);
              }}
              aria-label="Delete task"
              type="button"
            >
              Delete
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export type KanbanCardsProps = {
  children: ReactNode;
  className?: string;
};

type KanbanCardElement = React.ReactElement<KanbanCardProps>;

export const KanbanCards = ({ children, className }: KanbanCardsProps) => {
  const ids = React.Children.toArray(children)
    .filter((child): child is KanbanCardElement => {
      if (!React.isValidElement<KanbanCardProps>(child)) return false;
      const props = child.props as Partial<KanbanCardProps>;
      return props && typeof props.id === 'string';
    })
    .map(child => child.props.id);

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div className={cn('flex flex-1 flex-col gap-2', className)}>{children}</div>
    </SortableContext>
  );
};

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
}: KanbanProviderProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div
        className={cn(
          'grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4',
          className
        )}
      >
        {children}
      </div>
    </DndContext>
  );
};
