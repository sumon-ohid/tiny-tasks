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
} 