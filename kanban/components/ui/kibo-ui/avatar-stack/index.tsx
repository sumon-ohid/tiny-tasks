'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = {
  id: string;
  name: string;
  image?: string;
};

type AvatarStackProps = {
  users: User[];
  limit?: number;
};

export const AvatarStack = ({ users, limit = 3 }: AvatarStackProps) => {
  const displayUsers = users.slice(0, limit);
  const remaining = users.length - limit;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
        ))}
        
        {remaining > 0 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium border-2 border-background">
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
};
