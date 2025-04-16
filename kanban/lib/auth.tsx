import { useState, useEffect, createContext, useContext } from 'react';

// Enhanced user type with more fields
export interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
  image?: string;
  lastActive?: Date;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    compactView?: boolean;
    notificationsEnabled?: boolean;
  }
}

// Context for authentication
export const AuthContext = createContext<{
  user: User | null;
  users: User[];
  login: (userId: string) => boolean;
  logout: () => void;
  updateUserPreference: <K extends keyof NonNullable<User['preferences']>>(
    key: K,
    value: NonNullable<User['preferences']>[K]
  ) => void;
  isLoading: boolean;
}>({
  user: null,
  users: [],
  login: () => false,
  logout: () => {},
  updateUserPreference: () => {},
  isLoading: true,
});

// Use local storage for persistence across browser sessions
// Session storage keys
const USER_KEY = 'kanban-app-user';
const USERS_KEY = 'kanban-app-users';

// Default users for demo purposes
const defaultUsers: User[] = [
  { 
    id: '1', 
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=1',
    preferences: {
      theme: 'system',
      compactView: false,
      notificationsEnabled: true
    }
  },
  { 
    id: '2', 
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'member',
    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=2',
    preferences: {
      theme: 'light',
      compactView: true,
      notificationsEnabled: false
    }
  },
  { 
    id: '3', 
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'member',
    image: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=3',
    preferences: {
      theme: 'dark',
      compactView: false,
      notificationsEnabled: true
    }
  }
];

// Initialize users with persistence
export const initUsers = (): User[] => {
  if (typeof window === 'undefined') return defaultUsers;
  
  const storedUsers = localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  
  return JSON.parse(storedUsers);
};

// Get current user with persistence
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  
  const parsedUser = JSON.parse(user);
  
  // Convert date strings to Date objects
  if (parsedUser.lastActive) {
    parsedUser.lastActive = new Date(parsedUser.lastActive);
  }
  
  return parsedUser;
};

// Save current user with persistence
export const setCurrentUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  
  // Update last active timestamp
  const updatedUser = { 
    ...user, 
    lastActive: new Date() 
  };
  
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  
  // Also update this user in the users array
  const allUsers = initUsers();
  const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
};

// Update user preferences
export const updateUserPreferences = (userId: string, preferences: Partial<User['preferences']>): void => {
  if (typeof window === 'undefined') return;
  
  const currentUser = getCurrentUser();
  const allUsers = initUsers();
  
  // Update in users array
  const updatedUsers = allUsers.map(user => {
    if (user.id === userId) {
      return {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences
        }
      };
    }
    return user;
  });
  
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  
  // Also update current user if it's the same one
  if (currentUser && currentUser.id === userId) {
    const updatedUser = {
      ...currentUser,
      preferences: {
        ...currentUser.preferences,
        ...preferences
      }
    };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }
};

// Hook for user authentication
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    setIsLoading(true);
    const allUsers = initUsers();
    setUsers(allUsers);
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Update last active timestamp
      setCurrentUser({
        ...currentUser,
        lastActive: new Date()
      });
    }
    setIsLoading(false);
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
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };
  
  // Update user preference
  const updateUserPreference = <K extends keyof NonNullable<User['preferences']>>(
    key: K, 
    value: NonNullable<User['preferences']>[K]
  ) => {
    if (!user) return;
    
    // We assume user.preferences exists if user exists, 
    // or provide a default empty object if needed for the update logic.
    const currentPreferences = user.preferences ?? {};

    const updatedPreferences = {
      ...currentPreferences, // Spread potentially existing preferences
      [key]: value
    };
    
    // Pass the whole updated preferences object
    updateUserPreferences(user.id, updatedPreferences as Partial<User['preferences']>);
    
    // Update local state
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: value
        }
      };
    });
  };

  return { user, users, login, logout, updateUserPreference, isLoading };
};

// Create auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuthContext = () => useContext(AuthContext);