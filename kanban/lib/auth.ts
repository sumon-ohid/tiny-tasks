import { useState, useEffect } from 'react';

// Simple user type
export interface User {
  id: string;
  name: string;
  image?: string;
}

// Session storage keys
const USER_KEY = 'kanban-app-user';
const USERS_KEY = 'kanban-app-users';

// Default users for demo purposes
const defaultUsers: User[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=1' 
  },
  { 
    id: '2', 
    name: 'Bob Smith', 
    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=2' 
  },
  { 
    id: '3', 
    name: 'Charlie Brown', 
    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=3' 
  }
];

// Initialize users in session storage if they don't exist
export const initUsers = (): User[] => {
  if (typeof window === 'undefined') return defaultUsers;
  
  const storedUsers = sessionStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    sessionStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  
  return JSON.parse(storedUsers);
};

// Get current user from session storage
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const user = sessionStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Save current user to session storage
export const setCurrentUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Hook for user authentication
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize on mount
  useEffect(() => {
    const allUsers = initUsers();
    setUsers(allUsers);
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Login function
  const login = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setCurrentUser(selectedUser);
      setUser(selectedUser);
      return true;
    }
    return false;
  };

  // Logout function
  const logout = () => {
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return { user, users, login, logout };
};