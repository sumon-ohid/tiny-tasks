'use client';

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { getUserNotes, saveUserNotes } from '@/lib/storage';
import type { Notes } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { common, createLowlight } from 'lowlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import debounce from "lodash.debounce";

const lowlight = createLowlight(common);
lowlight.register("html", html);
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("ts", ts);

const defaultContent = '<h1>Notes</h1><p>Start typing your notes here...</p>';

// Menu button component for toolbar
interface MenuButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ onClick, active = false, disabled = false, children, title }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-md transition-colors ${
          active
            ? "bg-[#e9a959] dark:bg-[#503f2f] text-white"
            : "hover:bg-[#e9a959]/40 dark:hover:bg-[#503f2f]/40"
        } ${
          disabled
            ? "opacity-30 cursor-not-allowed"
            : "cursor-pointer"
        } focus:outline-none focus:ring-2 focus:ring-[#8a5a2a] dark:focus:ring-[#f0c293]`}
      >
        {children}
      </button>
    );
  }
);

MenuButton.displayName = "MenuButton";

// Custom styles for the editor (to be injected)
const editorStyles = `
  .ProseMirror {
    padding: 1rem;
    min-height: 100%;
    height: 100%;
    outline: none;
    overflow-y: auto;
    color: #4b5563;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: white;
  }

  .dark .ProseMirror {
    background-color: #1e293b;
    color: #e2e8f0;
  }

  .ProseMirror:focus {
    outline: none;
  }

  .ProseMirror p {
    margin-bottom: 0.75rem;
  }

  .ProseMirror h1 {
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #1e293b;
  }

  .dark .ProseMirror h1 {
    color: #f8fafc;
  }

  .ProseMirror h2 {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 600;
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    color: #1e293b;
  }

  .dark .ProseMirror h2 {
    color: #f8fafc;
  }

  .ProseMirror h3 {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: #1e293b;
  }

  .dark .ProseMirror h3 {
    color: #f8fafc;
  }

  .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .ProseMirror li {
    margin-bottom: 0.25rem;
  }

  .ProseMirror blockquote {
    border-left: 4px solid #e9a959;
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
    color: #6b7280;
  }

  .dark .ProseMirror blockquote {
    border-left-color: #a67c52;
    color: #9ca3af;
  }

  .ProseMirror pre {
    background-color: #f3f4f6;
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    margin: 1rem 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .dark .ProseMirror pre {
    background-color: #374151;
  }

  .ProseMirror code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.875rem;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    background-color: #f3f4f6;
  }

  .dark .ProseMirror code {
    background-color: #374151;
  }

  .ProseMirror a {
    color: #a67c52;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .dark .ProseMirror a {
    color: #f0c293;
  }

  .ProseMirror hr {
    border: none;
    height: 1px;
    background-color: #e5e7eb;
    margin: 1.5rem 0;
  }

  .dark .ProseMirror hr {
    background-color: #4b5563;
  }

  /* Task list styling */
  .ProseMirror ul[data-type="taskList"] {
    list-style-type: none;
    padding-left: 0;
  }

  .ProseMirror ul[data-type="taskList"] li {
    display: flex;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .ProseMirror ul[data-type="taskList"] li > label {
    flex: 0 0 auto;
    margin-right: 0.5rem;
    user-select: none;
  }

  .ProseMirror ul[data-type="taskList"] li > div {
    flex: 1 1 auto;
  }

  .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
    cursor: pointer;
    height: 1rem;
    width: 1rem;
    margin: 0;
    margin-right: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    accent-color: #a67c52;
  }

  .dark .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
    border-color: #4b5563;
    background-color: #1e293b;
    accent-color: #f0c293;
  }
`;

// NotesEditor component
interface NotesEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotesEditor: React.FC<NotesEditorProps> = ({ isOpen, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [content, setContent] = useState<string>(defaultContent);
  const [mounted, setMounted] = useState(false);

  // Initialize the editor with extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your notes here...',
      }),
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount.configure({
        limit: 10000,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleContentChange(html);
    },
  });

  // Load user notes on mount
  useEffect(() => {
    setMounted(true);
    const loadNotes = async () => {
      try {
        const savedNotes = await getUserNotes();
        if (savedNotes && savedNotes.content && savedNotes.content.length > 0) {
          setContent(savedNotes.content);
          editor?.commands.setContent(savedNotes.content);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    };
    
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, editor]);

  // Debounced save function to prevent excessive saves
  const debouncedSave = useCallback(
    debounce(async (newContent: string) => {
      try {
        setIsSaving(true);
        await saveUserNotes(newContent);
      } catch (error) {
        console.error('Failed to save notes:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    []
  );

  // Handle content changes and trigger save
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      debouncedSave(newContent);
    },
    [debouncedSave]
  );

  // Export handlers
  const handleExportHTML = () => {
    if (!editor) return;
    const html = editor.getHTML();
    downloadFile(html, 'notes.html', 'text/html');
  };

  const handleExportText = () => {
    if (!editor) return;
    const text = editor.getText();
    downloadFile(text, 'notes.txt', 'text/plain');
  };

  const handleExportMarkdown = () => {
    if (!editor) return;
    // Simple HTML to Markdown conversion
    const html = editor.getHTML();
    const md = html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n\n')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<pre><code>(.*?)<\/code><\/pre>/g, '```\n$1\n```\n\n')
      .replace(/<ul>(.*?)<\/ul>/g, '$1\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<ol>(.*?)<\/ol>/g, '$1\n')
      .replace(/<li>(.*?)<\/li>/g, '1. $1\n')
      .replace(/<br>/g, '\n');
    
    downloadFile(md, 'notes.md', 'text/markdown');
  };

  // Helper function to download files
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save with Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        debouncedSave(content);
      }
      
      // Toggle fullscreen with F11 or Ctrl+Shift+F
      if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f')) {
        e.preventDefault();
        toggleFullscreen();
      }
      
      // Close with Escape
      if (e.key === 'Escape' && !isFullscreen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isFullscreen, content, debouncedSave, onClose]);

  // Custom toolbar component
  const EditorToolbar = () => {
    if (!editor) return null;

    return (
      <div className="flex flex-wrap items-center p-2 border-b border-[#e9d9c3] dark:border-[#3a2e22] bg-[#f9ecd9] dark:bg-[#2c2517] overflow-x-auto">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough (Ctrl+Shift+X)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <path d="M16 6c-.5-1.8-2.1-3-4-3-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2.4 3.4"></path>
            <path d="M6 14c.5 1.8 2.1 3 4 3 2.2 0 4-1.8 4-4 0-1.5-.8-2.8-2.4-3.4"></path>
          </svg>
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e9d9c3] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h16"></path>
            <path d="M4 6h8"></path>
            <path d="M4 18h8"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h10"></path>
            <path d="M4 6h6"></path>
            <path d="M4 18h6"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8"></path>
            <path d="M4 6h4"></path>
            <path d="M4 18h4"></path>
          </svg>
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e9d9c3] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6"></line>
            <line x1="9" y1="12" x2="20" y2="12"></line>
            <line x1="9" y1="18" x2="20" y2="18"></line>
            <circle cx="5" cy="6" r="2"></circle>
            <circle cx="5" cy="12" r="2"></circle>
            <circle cx="5" cy="18" r="2"></circle>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
          title="Task List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="4" height="4" rx="1"></rect>
            <path d="M9 5h12"></path>
            <rect x="3" y="15" width="4" height="4" rx="1"></rect>
            <path d="M9 15h12"></path>
          </svg>
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e9d9c3] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.39 7.64C12.92 7.64 12.89 13 12.89 13v6.67h5.33V13s0-1.3 1.3-1.3S21.78 13 21.78 13v-1.95s0-3.41-4.39-3.41zM5.89 7.64C1.42 7.64 1.39 13 1.39 13v6.67h5.33V13s0-1.3 1.3-1.3 2.26 1.3 2.26 1.3v-1.95s0-3.41-4.39-3.41z"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e9d9c3] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
          </svg>
        </MenuButton>
      </div>
    );
  };

  // Don't render anything if the editor is not open
  if (!isOpen || !mounted) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`relative flex flex-col w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl ${
            isFullscreen ? 'h-full' : 'h-[85vh]'
          }`}
        >
          <Card className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#e9d9c3] dark:border-[#3a2e22] bg-[#f9ecd9] dark:bg-[#2c2517] text-[#5a3e2b] dark:text-[#f0c293]">
              <h2 className="text-lg font-medium">Notes</h2>
              <div className="flex items-center space-x-2">
                {isSaving ? (
                  <span className="text-xs text-[#a67c52] dark:text-[#f0c293] animate-pulse">
                    Saving...
                  </span>
                ) : (
                  <span className="text-xs text-[#a67c52] dark:text-[#f0c293]">
                    Saved
                  </span>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md hover:bg-[#e9a959]/20 dark:hover:bg-[#503f2f]/30 focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[180px] bg-[#f9ecd9] dark:bg-[#2c2517] text-[#5a3e2b] dark:text-[#f0c293] border-[#e9d9c3] dark:border-[#3a2e22]">
                    <DropdownMenuLabel>Export as</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#e9d9c3] dark:bg-[#3a2e22]" />
                    <DropdownMenuItem onClick={handleExportHTML} className="hover:bg-[#e9a959]/20 dark:hover:bg-[#503f2f]/30 cursor-pointer">HTML</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportText} className="hover:bg-[#e9a959]/20 dark:hover:bg-[#503f2f]/30 cursor-pointer">Plain Text</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMarkdown} className="hover:bg-[#e9a959]/20 dark:hover:bg-[#503f2f]/30 cursor-pointer">Markdown</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-1 rounded-md hover:bg-[#e9a959]/20 dark:hover:bg-[#503f2f]/30 focus:outline-none"
                  title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
                >
                  {isFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V6m3 9V6m3 9H6m3 3h6" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-[#e9a959]/20 dark:hover:bg-[#503f2f]/30 focus:outline-none"
                  title="Close (Esc)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <EditorToolbar />
            
            <style jsx global>{editorStyles}</style>
            
            <div className="flex-1 overflow-auto">
              <EditorContent editor={editor} className="h-full" />
            </div>
            
            <div className="flex items-center justify-between p-2 text-xs text-[#a67c52] dark:text-[#d4a97a] border-t border-[#e9d9c3] dark:border-[#3a2e22] bg-[#f9ecd9] dark:bg-[#2c2517]">
              <div>
                {editor && (
                  <>
                    <span>{editor.storage.characterCount.words()} words</span>
                    <span className="mx-2">•</span>
                    <span>{editor.storage.characterCount.characters()} characters</span>
                  </>
                )}
              </div>
              <div>
                <span className="mr-2">Ctrl+S: Save</span>
                <span>F11: Fullscreen</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotesEditor; 