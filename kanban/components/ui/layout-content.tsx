'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/components/ui/kibo-ui/theme-provider';
import { UserProfile } from './kibo-ui/user-profile';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="flex flex-col min-h-screen">
          {/* Top navbar */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="container flex h-14 items-center justify-between">
              {/* Branding */}
              <Link 
                href="/" 
                className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors"
              >
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: -10, transition: { duration: 0.2 } }}
                  className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </motion.div>
                <span className="font-bold text-md hidden md:inline-block">Tiny Tasks</span>
              </Link>
              
              {/* User profile */}
              <UserProfile />
            </div>
          </header>
          
          {/* Main content area with sidebar */}
          <div className="flex-1 flex flex-col md:flex-row">
            {/* Sidebar with expandable tabs removed */}
            <aside className="md:w-64 p-4 border-r border-border bg-card/20">
              {/* <ExpandableTabs tabs={navItems} /> */}
              {/* Placeholder or alternative navigation can go here */}
              <div className="text-sm text-muted-foreground">Navigation</div>
            </aside>
            
            {/* Main content */}
            <main className="flex-1 container p-4">
              {children}
            </main>
          </div>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}