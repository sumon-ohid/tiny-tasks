'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import NotesEditor from '@/components/ui/kibo-ui/notes-editor';
import { motion } from 'framer-motion';
import { getUserNotes } from '@/lib/storage';

export default function NotesPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Load the last updated time from saved notes
  useEffect(() => {
    const savedNotes = getUserNotes();
    if (savedNotes) {
      setLastUpdated(new Date(savedNotes.lastUpdated));
    }
  }, []);
  
  // Update the last updated time when the notes editor is closed
  const handleEditorClose = () => {
    setIsEditorOpen(false);
    const savedNotes = getUserNotes();
    if (savedNotes) {
      setLastUpdated(new Date(savedNotes.lastUpdated));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notes</h1>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <div className="flex items-center gap-2">
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
              <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
              <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
            </svg>
            <span>Edit Notes</span>
          </div>
        </button>
      </div>
      
      {/* Notes preview card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Project Notes</h2>
          <div className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleDateString()} at ${lastUpdated.toLocaleTimeString()}` : 'No notes yet'}
          </div>
        </div>
        
        <div className="prose dark:prose-invert max-w-none">
          <div className="space-y-4">
            {!lastUpdated ? (
              <div className="text-center py-12">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto text-muted-foreground mb-4"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                  <p className="text-muted-foreground">No notes yet. Click &quot;Edit Notes&quot; to start writing!</p>
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-12">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto text-primary mb-4"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                  <p className="text-muted-foreground">Your notes are available! Click &quot;Edit Notes&quot; to edit them.</p>
                  <button
                    onClick={() => setIsEditorOpen(true)}
                    className="mt-4 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
                  >
                    View and Edit
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Notes editor */}
      <NotesEditor isOpen={isEditorOpen} onClose={handleEditorClose} />
    </div>
  );
} 