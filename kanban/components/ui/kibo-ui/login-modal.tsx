'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/lib/auth';

export const LoginModal = () => {
  const { users, login, isLoading } = useAuthContext();
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleLogin = (userId: string) => {
    setSelectedUserId(userId);
    setLoginInProgress(true);
    
    // Simulate a login process with a small delay for UX
    setTimeout(() => {
      login(userId);
      setLoginInProgress(false);
    }, 800);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 80
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 mx-auto rounded-full border-4 border-primary border-b-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 shadow-xl">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          <motion.div 
            variants={itemVariants} 
            className="text-center"
          >
            <h1 className="text-2xl font-bold">Welcome to Tiny Tasks</h1>
            <p className="text-muted-foreground mt-2">Select a user to continue</p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 gap-4"
          >
            {users.map((user) => (
              <motion.button
                key={user.id}
                onClick={() => handleLogin(user.id)}
                className={`flex items-center p-4 rounded-lg transition-all ${
                  selectedUserId === user.id
                    ? 'bg-primary/20 border-primary'
                    : 'hover:bg-secondary'
                } border`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loginInProgress}
              >
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-medium leading-none">{user.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {user.email}
                    {user.role && <span className="ml-2 px-2 py-0.5 bg-muted rounded-full text-xs">{user.role}</span>}
                  </div>
                </div>
                {selectedUserId === user.id && loginInProgress && (
                  <div className="ml-auto">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-b-transparent animate-spin"></div>
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
          
          <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
            <p>This is a demo application. No real authentication is performed.</p>
          </motion.div>
        </motion.div>
      </Card>
    </div>
  );
};