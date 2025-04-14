'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';

export const UserProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 bg-secondary p-2 rounded-md">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.image} />
        <AvatarFallback>{user.name?.slice(0, 2)}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        <span className="font-medium text-sm">{user.name}</span>
        <button 
          onClick={logout} 
          className="text-xs text-muted-foreground hover:text-primary text-left"
        >
          Logout
        </button>
      </div>
    </div>
  );
};