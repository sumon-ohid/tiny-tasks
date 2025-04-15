'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { getUserNotes, saveUserNotes } from '@/lib/storage';

// Lazy load the Maily Editor component
const MailyEditor = lazy(() => 
  import('@maily-to/core').then((module) => ({
    default: module.Editor
  }))
);

const defaultContent = '<h1>Notes</h1><p>Start typing your notes here...</p>';

const NotesEditor = ({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const [content, setContent] = useState(defaultContent);
  
  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = getUserNotes();
    if (savedNotes) {
      setContent(savedNotes.content);
    }
  }, []);

  const handleUpdate = (editor: any) => {
    const html = editor.getHTML();
    setContent(html);
    // Save to localStorage on each update
    saveUserNotes(html);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-3xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Notes</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            <Suspense fallback={<div>Loading editor...</div>}>
              <MailyEditor
                contentHtml={content}
                onUpdate={handleUpdate}
                config={{
                  hasMenuBar: true,
                  autofocus: 'start',
                  spellCheck: true,
                  contentClassName: "p-4 text-left min-h-full",
                  bodyClassName: "overflow-y-auto",
                  wrapClassName: "h-full"
                }}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotesEditor;
