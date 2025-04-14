'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, type User } from '@/lib/auth';

type LoginModalProps = {
  onLogin: () => void;
};

export const LoginModal = ({ onLogin }: LoginModalProps) => {
  const { users, login } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleLogin = () => {
    if (selectedUserId) {
      login(selectedUserId);
      onLogin();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 p-6 bg-white shadow-xl">
        <h2 className="text-xl font-bold mb-4">Select User to Continue</h2>
        <p className="text-muted-foreground mb-4">
          Choose a user to access your personalized Kanban board
        </p>
        
        <div className="space-y-2 mb-6">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                selectedUserId === user.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
              onClick={() => setSelectedUserId(user.id)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.name}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedUserId
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={handleLogin}
            disabled={!selectedUserId}
          >
            Login
          </button>
        </div>
      </Card>
    </div>
  );
};