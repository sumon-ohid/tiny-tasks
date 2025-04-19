"use client";

import { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

// --- Icons (Consider moving to a dedicated icons file) ---

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const KanbanIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="7" height="9" x="3" y="3" rx="1"></rect>
    <rect width="7" height="5" x="14" y="3" rx="1"></rect>
    <rect width="7" height="9" x="14" y="12" rx="1"></rect>
    <rect width="7" height="5" x="3" y="16" rx="1"></rect>
  </svg>
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" y1="12" x2="20" y2="12"></line>
    <line x1="4" y1="6" x2="20" y2="6"></line>
    <line x1="4" y1="18" x2="20" y2="18"></line>
  </svg>
);


// --- Reusable Components ---

const BrandLogo = () => (
  <Link
    href="/"
    className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors group"
    aria-label="Back to Home"
  >
    <motion.div
      initial={{ rotate: -5, scale: 1 }}
      animate={{ rotate: 0, scale: 1 }}
      whileHover={{ rotate: -5, scale: 1.05, transition: { duration: 0.2, ease: "easeInOut" } }}
      className="flex items-center justify-center size-8 bg-primary text-primary-foreground rounded-lg shadow-sm"
    >
      <HomeIcon strokeWidth={2.5} />
    </motion.div>
    <span className="font-bold text-lg hidden sm:inline-block">Tiny Tasks</span>
  </Link>
);

const NavItem = ({ href, label, icon: Icon, active = false }: {
  href: string;
  label: string;
  icon: React.ElementType<React.SVGProps<SVGSVGElement>>;
  active?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150 ease-in-out group relative ${
          active
            ? 'font-semibold text-primary bg-primary/10'
            : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <Icon className={`size-4 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
        <span className="hidden lg:inline-block">{label}</span>
        {active && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary rounded-full"
          />
        )}
      </Link>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="lg:hidden">
      {/* Tooltip only needed when label is hidden */}
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

const MobileNavItem = ({ href, label, icon: Icon, active = false, onClick }: {
  href: string;
  label: string;
  icon: React.ElementType<React.SVGProps<SVGSVGElement>>;
  active?: boolean;
  onClick?: () => void; // To close the sheet
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-md text-base transition-colors ${
      active
        ? 'font-semibold text-primary bg-primary/10'
        : 'font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30'
    }`}
  >
    <Icon className={`size-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
    <span>{label}</span>
  </Link>
);

// --- Main Nav Component ---

export function Nav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Board", icon: KanbanIcon, activePaths: ['/', '/board'] },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon, activePaths: ['/calendar'] },
    // Add more links here if needed
    // { href: "/notes", label: "Notes", icon: NotesIcon, activePaths: ['/notes'] },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex items-center justify-between w-full md:w-auto">
        {/* Branding */}
        <BrandLogo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-6 relative">
          {navLinks.map(link => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={link.activePaths.includes(pathname)}
            />
          ))}
          
          {/* Theme Toggle */}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden flex items-center gap-2">
          {/* Theme Toggle for mobile */}
          <ThemeToggle />
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex">
                  <BrandLogo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {navLinks.map(link => (
                  <MobileNavItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    active={link.activePaths.includes(pathname)}
                    onClick={() => setIsMobileMenuOpen(false)} // Close sheet on link click
                  />
                ))}
              </nav>
              {/* Optional: Add footer or user info in mobile menu */}
              <div className="mt-auto p-4 border-t flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Remove the old DropdownNav and NavItem (they are replaced by the new structure)
