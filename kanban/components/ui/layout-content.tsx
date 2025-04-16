'use client';

import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { UserProfile } from "@/components/ui/kibo-ui/user-profile";
import { ThemeProvider } from "@/components/ui/kibo-ui/theme-provider";
import { AuthProvider } from "@/lib/auth";
import Link from "next/link";
import { motion } from "framer-motion";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  // Navigation items for the expandable tabs
  const navItems = [
    {
      value: "kanban",
      label: "Kanban Board",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      ),
      href: "/",
    },
    {
      value: "calendar",
      label: "Calendar",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      href: "/calendar",
    },
    {
      value: "notes",
      label: "Notes",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
      ),
      href: "/notes",
    },
  ];

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
            {/* Sidebar with expandable tabs */}
            <aside className="md:w-64 p-4 border-r border-border bg-card/20">
              <ExpandableTabs items={navItems} defaultExpanded={true} />
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