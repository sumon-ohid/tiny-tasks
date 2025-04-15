"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Modern nav with branding and links
export function Nav() {
  const pathname = usePathname();
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-6">
        {/* Branding section */}
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

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-4">
          <NavItem 
            href="/" 
            label="Dashboard" 
            active={pathname === '/'} 
            icon={
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
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
            } 
          />
          <NavItem 
            href="/" 
            label="Kanban Board" 
            active={pathname === '/' || pathname === '/board'} 
            icon={
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
            } 
          />
          <NavItem 
            href="/calendar" 
            label="Calendar" 
            active={pathname === '/calendar'} 
            icon={
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
            } 
          />
        </nav>
        
        {/* Mobile navigation */}
        <nav className="md:hidden flex items-center">
          <DropdownNav />
        </nav>
      </div>
    </TooltipProvider>
  );
}

// Dropdown nav for mobile
function DropdownNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-md transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="4" y1="12" x2="20" y2="12"></line>
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-card border z-10">
          <div className="py-1" onClick={() => setIsOpen(false)}>
            <Link
              href="/"
              className={`block px-4 py-2 text-sm ${pathname === '/' ? 'bg-muted/40 text-foreground' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className={`block px-4 py-2 text-sm ${pathname === '/' || pathname === '/board' ? 'bg-muted/40 text-foreground' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
            >
              Kanban Board
            </Link>
            <Link
              href="/calendar"
              className={`block px-4 py-2 text-sm ${pathname === '/calendar' ? 'bg-muted/40 text-foreground' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
            >
              Calendar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Nav item component with tooltip
function NavItem({ href, label, icon, active = false }: { 
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          href={href} 
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
            active 
              ? 'bg-muted/40 text-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
          }`}
        >
          {icon}
          <span>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
