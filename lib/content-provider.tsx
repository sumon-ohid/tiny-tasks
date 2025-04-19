'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  exampleFeatures as initialFeatures,
  exampleMarkers as initialMarkers,
  exampleStatuses
} from './content'; // Assuming your content.ts exports these

// Define and Export the Feature type explicitly
// Based on the structure seen in content.ts and potential usage
export interface Feature {
  id: string;
  name: string;
  status: { id: string; name: string; color: string }; // Status is assumed mandatory
  description?: string; // Optional
  startAt?: Date;       // Optional
  endAt?: Date;         // Optional
  owner?: { id: string; name: string; image?: string }; // Optional owner, optional image
  group?: { id: string; name: string };                // Optional
  product?: { id: string; name: string };               // Optional
  initiative?: { id: string; name: string };          // Optional
  release?: { id: string; name: string };             // Optional
  emoji?: { url: string; style?: string; seed?: number }; 
  // New fields for enhanced features
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // For priority system
  timeBlocks?: Array<{ start: Date; end: Date; completed: boolean }>; // For time blocking
  pomodoroSettings?: { workDuration: number; breakDuration: number; longBreakDuration: number; longBreakInterval: number }; // For pomodoro
  isHabit?: boolean; // Mark if this is a recurring habit
  habitStreak?: number; // Current streak for habits
  habitHistory?: Array<{ date: string; completed: boolean }>; // Track habit completion
  goalType?: 'daily' | 'weekly' | 'monthly' | 'custom'; // For goal setting
  goalTarget?: number; // Target value for goal (e.g., number of times)
  goalProgress?: number; // Current progress toward goal
  focusMode?: boolean; // Is this task marked for focus mode
  distractionList?: string[]; // List of distractions to block
  points?: number; // Gamification points earned
  badges?: string[]; // Earned badges
  analytics?: { 
    estimatedTime?: number; // Estimated time in minutes
    actualTime?: number;   // Actual time spent in minutes
    completedPomodoros?: number; // Number of completed pomodoro sessions
    productivity?: number; // Productivity score (0-100)
  };
}

// Export Marker and Status types (can be inferred or defined explicitly)
type Marker = typeof initialMarkers[0];
export type Status = typeof exampleStatuses[0]; // Export Status too

interface ContentContextProps {
  features: Feature[];
  markers: Marker[];
  statuses: Status[];
  setFeatures: React.Dispatch<React.SetStateAction<Feature[]>>;
  clearFeatures: () => void;
  isLoading: boolean;
}

const ContentContext = createContext<ContentContextProps | undefined>(undefined);

const FEATURES_STORAGE_KEY = 'kanban-app-features';

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [markers] = useState<Marker[]>(initialMarkers); // Markers are static for now
  const [statuses] = useState<Status[]>(exampleStatuses); // Statuses are static
  const [isLoading, setIsLoading] = useState(true);

  // Load features from local storage or initial data on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedFeatures = localStorage.getItem(FEATURES_STORAGE_KEY);
      // Ensure initialFeatures conforms to Feature[] type
      const featuresToSet: Feature[] = storedFeatures 
        ? JSON.parse(storedFeatures).map((f: Partial<Feature>): Feature => ({
            ...f, id: f.id || `feat_${Date.now()}_${Math.random().toString(16).slice(2)}`, name: f.name || "Untitled Task",
            // Ensure dates are Date objects or undefined
            startAt: f.startAt ? new Date(f.startAt) : undefined,
            endAt: f.endAt ? new Date(f.endAt) : undefined,
            // Ensure status is correctly typed (assuming it's stored properly)
            status: f.status || { id: 'todo', name: 'To Do', color: '#6B7280' }, // Add fallback if status can be missing
          }))
        : initialFeatures;
      setFeatures(featuresToSet);
    } catch (error) {
      console.error("Failed to load features from local storage:", error);
      setFeatures(initialFeatures as Feature[]); // Fallback, assert type if confident
    }
    setIsLoading(false);
  }, []);

  // Save features to local storage whenever they change
  useEffect(() => {
    if (!isLoading) { // Only save after initial load
      try {
        localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
      } catch (error) {
        console.error("Failed to save features to local storage:", error);
      }
    }
  }, [features, isLoading]);

  const clearFeatures = () => {
    setFeatures([]); // Set state to empty array
    // Local storage will be updated by the useEffect above
  };

  const value = {
    features,
    markers,
    statuses,
    setFeatures,
    clearFeatures,
    isLoading,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContentContext = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContentContext must be used within a ContentProvider');
  }
  return context;
}; 