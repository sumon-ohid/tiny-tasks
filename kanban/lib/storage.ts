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
}

export interface Status {
  id: string;
  name: string;
  color: string;
}

// Storage keys
const USER_FEATURES_PREFIX = 'kanban-user-features-';

// Get features for a specific user
export const getUserFeatures = (userId: string): Feature[] => {
  if (typeof window === 'undefined') return [];

  const key = `${USER_FEATURES_PREFIX}${userId}`;
  const storedFeatures = sessionStorage.getItem(key);
  
  if (!storedFeatures) {
    // Initialize with example features for demo purposes
    const initialFeatures = exampleFeatures.map(feature => ({
      ...feature,
      startAt: new Date(feature.startAt),
      endAt: new Date(feature.endAt)
    }));
    sessionStorage.setItem(key, JSON.stringify(initialFeatures));
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
  sessionStorage.setItem(key, JSON.stringify(features));
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

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};