import { exampleFeatures, exampleStatuses } from './content';
import type { User } from './auth';

// Define types
export interface Feature {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
  group?: { id: string; name: string };
  product?: { id: string; name: string };
  owner?: User;
  initiative?: { id: string; name: string };
  release?: { id: string; name: string };
  description?: string;
  emoji?: {
    url: string;
    style: string;
    seed: number;
    bgColor?: string;
  };
}

export interface Status {
  id: string;
  name: string;
  color: string;
}

// Storage keys
const USER_FEATURES_PREFIX = 'kanban-user-features-';

// Storage keys for notes
const USER_NOTES_KEY = 'kanban-user-notes';

// Notes type
export interface Notes {
  content: string; // HTML string content for Maily editor
  lastUpdated: Date;
}

// Get features for a specific user
export const getUserFeatures = (userId: string): Feature[] => {
  if (typeof window === 'undefined') return [];

  const key = `${USER_FEATURES_PREFIX}${userId}`;
  const storedFeatures = localStorage.getItem(key);
  
  if (!storedFeatures) {
    // Background colors for emojis
    const bgColors = ['714033', 'c07f50', 'eaad80'];
    const getRandomBgColor = () => bgColors[Math.floor(Math.random() * bgColors.length)];
    
    // Initialize with example features for demo purposes
    const initialFeatures = exampleFeatures.map(feature => ({
      ...feature,
      startAt: new Date(feature.startAt),
      endAt: new Date(feature.endAt),
      // Add default emoji for example features
      emoji: {
        url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${Math.floor(Math.random() * 100) + 1}&backgroundColor=${getRandomBgColor()}&radius=50`,
        style: 'adventurer-neutral', 
        seed: Math.floor(Math.random() * 100) + 1
      }
    }));
    localStorage.setItem(key, JSON.stringify(initialFeatures));
    return initialFeatures;
  }

  // Parse dates back to Date objects
  const features = JSON.parse(storedFeatures);
  return features.map((feature: Feature) => ({
    ...feature,
    startAt: new Date(feature.startAt),
    endAt: new Date(feature.endAt)
  }));
};

// Save features for a specific user
export const saveUserFeatures = (userId: string, features: Feature[]): void => {
  if (typeof window === 'undefined') return;
  
  const key = `${USER_FEATURES_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(features));
};

// Add a new feature for a user
export const addUserFeature = (userId: string, feature: Feature): Feature[] => {
  const features = getUserFeatures(userId);
  const updatedFeatures = [...features, feature];
  saveUserFeatures(userId, updatedFeatures);
  return updatedFeatures;
};

// Remove a feature for a user
export const removeUserFeature = (userId: string, featureId: string): Feature[] => {
  const features = getUserFeatures(userId);
  const updatedFeatures = features.filter(feature => feature.id !== featureId);
  saveUserFeatures(userId, updatedFeatures);
  return updatedFeatures;
};

// Update a feature for a user
export const updateUserFeature = (userId: string, updatedFeature: Feature): Feature[] => {
  const features = getUserFeatures(userId);
  const updatedFeatures = features.map(feature => 
    feature.id === updatedFeature.id ? updatedFeature : feature
  );
  saveUserFeatures(userId, updatedFeatures);
  return updatedFeatures;
};

// Get user notes
export const getUserNotes = (): Notes | null => {
  if (typeof window === 'undefined') return null;
  
  const storedNotes = localStorage.getItem(USER_NOTES_KEY);
  
  if (!storedNotes) {
    return null;
  }
  
  const notes = JSON.parse(storedNotes);
  return {
    ...notes,
    lastUpdated: new Date(notes.lastUpdated)
  };
};

// Save user notes
export const saveUserNotes = (content: string): void => {
  if (typeof window === 'undefined') return;
  
  const notes: Notes = {
    content,
    lastUpdated: new Date()
  };
  
  localStorage.setItem(USER_NOTES_KEY, JSON.stringify(notes));
};

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
