'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { getUserNotes, saveUserNotes } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

// Lazy load the Maily Editor component
const MailyEditor = lazy(() => 
  import('@maily-to/core').then((module) => ({
    default: module.Editor
  }))
);

const defaultContent = '<h1>Notes</h1><p>Start typing your notes here...</p>';

const LoadingEditor = () => (
  <div className="flex flex-col items-center justify-center h-full p-8">
    <div className="w-12 h-12 rounded-full border-4 border-primary border-b-transparent animate-spin mb-4"></div>
    <p className="text-muted-foreground">Loading editor...</p>
  </div>
);

const NotesEditor = ({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const [content, setContent] = useState(defaultContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 500
      }
    }
  };
  
  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = getUserNotes();
    if (savedNotes) {
      setContent(savedNotes.content);
      setLastSaved(new Date(savedNotes.lastUpdated));
    }
  }, []);

  const handleUpdate = (editor: any) => {
    const html = editor.getHTML();
    setContent(html);
    
    // Show saving indicator
    setIsSaving(true);
    
    // Debounce save to avoid too many saves
    const saveTimeout = setTimeout(() => {
      // Save to localStorage
      saveUserNotes(html);
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on escape key
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
        >
          <motion.div 
            className="w-full max-w-4xl h-[90vh] flex flex-col"
            variants={modalVariants}
          >
            <Card className="flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
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
                    className="text-primary"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <h2 className="text-xl font-bold">Quick Notes</h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {isSaving ? (
                      <span className="flex items-center">
                        <svg 
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          ></circle>
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </span>
                    ) : lastSaved ? (
                      <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                    ) : null}
                  </div>
                  
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Close notes"
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
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<LoadingEditor />}>
                  <div className="h-full">
                    <MailyEditor
                      contentHtml={content}
                      onUpdate={handleUpdate}
                      config={{
                        hasMenuBar: true,
                        autofocus: 'start',
                        spellCheck: true,
                        contentClassName: "p-6 text-left min-h-full",
                        bodyClassName: "overflow-y-auto",
                        wrapClassName: "h-full"
                      }}
                    />
                  </div>
                </Suspense>
              </div>
              
              <div className="flex justify-between items-center p-3 border-t text-xs text-muted-foreground">
                <div className="sm:hidden">
                  {isSaving ? 'Saving...' : lastSaved ? `Saved: ${lastSaved.toLocaleTimeString()}` : ''}
                </div>
                <div className="ml-auto">
                  <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">Esc</kbd>
                  <span className="ml-1">to close</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotesEditor;
