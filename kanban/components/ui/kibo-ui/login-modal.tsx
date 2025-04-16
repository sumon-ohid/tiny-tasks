'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/lib/auth';
import { TextRotate } from '@/components/ui/text-rotate';
import { Loader2 } from 'lucide-react';

export const LoginHero = () => {
  const { users, login, isLoading } = useAuthContext();
  const [loginInProgress, setLoginInProgress] = useState(false);

  const handleLogin = () => {
    const firstUserId = users?.[0]?.id;
    if (!firstUserId || loginInProgress) return;

    setLoginInProgress(true);
    setTimeout(() => {
      login(firstUserId);
    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 100,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading Users...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
     return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-card rounded-lg shadow-lg border max-w-sm"
        >
           <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
           <p className="text-muted-foreground">Could not load user data. Please check your setup or try again later.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-secondary/20 to-background p-4">
       <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] bg-[url('/grid.svg')] [mask-image:radial-gradient(farthest-side_at_center,white,transparent)]"></div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-2xl mx-auto"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground"
        >
          Welcome to{' '}
          <TextRotate
            texts={["Tiny Tasks", "Kanban Board", "Productivity"]}
            rotationInterval={2800}
            mainClassName="inline-block text-primary px-2 rounded-md bg-primary/10"
            splitLevelClassName="inline-block"
            elementLevelClassName="inline-block"
            staggerDuration={0.03}
            staggerFrom="center"
          />
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-muted-foreground max-w-md sm:max-w-lg"
        >
          Organize your work, streamline your projects, and boost collaboration. Select the demo user to continue.
        </motion.p>

        <motion.div variants={itemVariants} className="pt-2">
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={loginInProgress || !users || users.length === 0}
            className="px-10 py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-primary/20 transition-shadow"
          >
            {loginInProgress ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Logging In...
              </>
            ) : (
              `Continue as ${users[0]?.name || 'Demo User'}`
            )}
          </Button>
        </motion.div>

         <motion.p variants={itemVariants} className="text-xs text-muted-foreground/70 pt-4">
            This is a demo application. No real authentication is performed.
         </motion.p>
      </motion.div>
    </div>
  );
};

export const LoginModal = LoginHero;