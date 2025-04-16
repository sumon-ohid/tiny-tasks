'use client';

import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import { getUserNotes, saveUserNotes } from '@/lib/storage';
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
import { Bold, Italic, Code, Heading1, Heading2, Heading3, ListOrdered, CheckSquare, Quote, ListIcon } from 'lucide-react';

// Tiptap imports
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
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
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ onClick, isActive = false, disabled = false, children, title }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-md text-[#37352f] dark:text-[#e6e6e6] transition-colors duration-200 ${
          isActive
            ? "bg-[#f5f5f4] dark:bg-gray-700 text-[#37352f] dark:text-white"
            : "hover:bg-[#f5f5f4] dark:hover:bg-gray-700 hover:text-[#37352f] dark:hover:text-white"
        }`}
      >
        {children}
      </button>
    );
  }
);

MenuButton.displayName = "MenuButton";

// NotesEditor component
interface NotesEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotesEditor: React.FC<NotesEditorProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [content, setContent] = useState<string>(defaultContent);
  const [mounted, setMounted] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Initialize the editor with extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing for Notion-like editing...',
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
  const debouncedSave = debounce(async (newContent: string) => {
    try {
      setSavingStatus('saving');
      await saveUserNotes(newContent);
      setSavingStatus('saved');
    } catch (error) {
      console.error('Failed to save notes:', error);
      setSavingStatus('unsaved');
    }
  }, 1000);

  // Handle content changes and trigger save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSavingStatus('unsaved');
    debouncedSave(newContent);
  };

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

  // Toggle fullscreen mode - wrapped in useCallback
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

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
  }, [isOpen, isFullscreen, content, debouncedSave, onClose, toggleFullscreen]);

  // Don't render anything if the editor is not open
  if (!isOpen || !mounted) return null;

  // Render the toolbar
  const renderToolbar = () => {
    if (!editor) return null;

    return (
      <div className="flex flex-wrap items-center p-2 border-b border-[#e6e6e6] bg-white dark:bg-[#191919] dark:border-gray-700 overflow-x-auto">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <path d="M16 6c-.5-1.8-2.1-3-4-3-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2.4 3.4"></path>
            <path d="M6 14c.5 1.8 2.1 3 4 3 2.2 0 4-1.8 4-4 0-1.5-.8-2.8-2.4-3.4"></path>
          </svg>
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e6e6e6] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e6e6e6] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <ListIcon className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="Task List"
        >
          <CheckSquare className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e6e6e6] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </MenuButton>
        
        <div className="w-px h-6 mx-2 bg-[#e6e6e6] dark:bg-[#3a2e22]"></div>
        
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
          </svg>
        </MenuButton>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="w-full max-w-5xl h-[90vh]"
          >
            <Card className="flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-[#e6e6e6] bg-white dark:bg-[#191919] dark:border-gray-700">
                <h2 className="text-lg font-medium text-[#37352f] dark:text-[#e6e6e6]">Notes</h2>
                <div className="flex items-center space-x-2">
                  {savingStatus === 'saving' ? (
                    <span className="text-xs text-[#64635c] dark:text-[#a3a29e] animate-pulse">
                      Saving...
                    </span>
                  ) : (
                    <span className="text-xs text-[#64635c] dark:text-[#a3a29e]">
                      {savingStatus === 'saved' ? 'Saved' : 'Unsaved changes'}
                    </span>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-[#f5f5f4] dark:hover:bg-gray-700 transition-colors focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-[180px] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#e6e6e6] border-[#e6e6e6] dark:border-[#303030]">
                      <DropdownMenuLabel>Export as</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#e6e6e6] dark:bg-[#303030]" />
                      <DropdownMenuItem onClick={handleExportHTML} className="hover:bg-[#f5f5f4] dark:hover:bg-[#2c2c2c] cursor-pointer">HTML</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportText} className="hover:bg-[#f5f5f4] dark:hover:bg-[#2c2c2c] cursor-pointer">Plain Text</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportMarkdown} className="hover:bg-[#f5f5f4] dark:hover:bg-[#2c2c2c] cursor-pointer">Markdown</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded-md hover:bg-[#f5f5f4] dark:hover:bg-gray-700 transition-colors focus:outline-none"
                    title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isFullscreen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-18h2a2 2 0 012 2v2M16 4h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6m0 0v6m0-6l-6 6M9 21H3m0 0v-6m0 6l6-6" />
                      )}
                    </svg>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-[#f5f5f4] dark:hover:bg-gray-700 transition-colors focus:outline-none"
                    title="Close (Esc)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {renderToolbar()}
              
              {/* Tiptap editor with bubble menu */}
              {editor && (
                <BubbleMenu 
                  editor={editor} 
                  tippyOptions={{ duration: 150 }}
                  className="bg-white dark:bg-[#202020] shadow-lg rounded-md p-1 flex items-center border border-[#e6e6e6] dark:border-[#303030]"
                >
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                  >
                    <ListIcon className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    isActive={editor.isActive('taskList')}
                    title="Task List"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Blockquote"
                  >
                    <Quote className="h-4 w-4" />
                  </MenuButton>
                  
                  <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    title="Code Block"
                  >
                    <Code className="h-4 w-4" />
                  </MenuButton>
                </BubbleMenu>
              )}
              
              <style jsx global>{`
                .ProseMirror {
                  min-height: 500px;
                  padding: 2rem;
                  overflow-y: auto;
                  background-color: white;
                  color: #37352f;
                  line-height: 1.5;
                }
                
                .dark .ProseMirror {
                  background-color: #191919;
                  color: #e6e6e6;
                }
                
                .ProseMirror:focus {
                  outline: none;
                }
                
                .ProseMirror p.is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  float: left;
                  color: #adb5bd;
                  pointer-events: none;
                  height: 0;
                }
                
                .ProseMirror h1 {
                  font-size: 1.875rem;
                  font-weight: 600;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                  color: #37352f;
                }
                
                .dark .ProseMirror h1 {
                  color: #e6e6e6;
                }
                
                .ProseMirror h2 {
                  font-size: 1.5rem;
                  font-weight: 600;
                  margin-top: 1.25rem;
                  margin-bottom: 0.75rem;
                  color: #37352f;
                }
                
                .dark .ProseMirror h2 {
                  color: #e6e6e6;
                }
                
                .ProseMirror h3 {
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                  color: #37352f;
                }
                
                .dark .ProseMirror h3 {
                  color: #e6e6e6;
                }
                
                /* Improve spacing and styles for a more Notion-like feel */
                .ProseMirror p {
                  margin-bottom: 0.25rem;
                  min-height: 1.5em;
                }
                
                .ProseMirror ul, .ProseMirror ol {
                  padding-left: 1.5rem;
                  margin-bottom: 0.5rem;
                }
                
                .ProseMirror blockquote {
                  border-left: 3px solid #e6e6e6;
                  padding-left: 1rem;
                  color: #64635c;
                  margin: 0.5rem 0;
                }
                
                .dark .ProseMirror blockquote {
                  border-left-color: #3a3a3a;
                  color: #a3a29e;
                }
                
                .ProseMirror code {
                  font-family: var(--font-geist-mono);
                  background-color: #f5f5f4;
                  padding: 0.2rem 0.4rem;
                  border-radius: 0.25rem;
                  font-size: 0.875rem;
                  color: #37352f;
                }
                
                .dark .ProseMirror code {
                  background-color: #2c2c2c;
                  color: #e6e6e6;
                }
                
                .ProseMirror pre {
                  background-color: #f5f5f4;
                  padding: 0.75rem;
                  border-radius: 0.25rem;
                  overflow-x: auto;
                  margin: 0.5rem 0;
                }
                
                .dark .ProseMirror pre {
                  background-color: #2c2c2c;
                }
                
                .ProseMirror pre code {
                  background-color: transparent;
                  padding: 0;
                  color: #37352f;
                }
                
                .dark .ProseMirror pre code {
                  color: #e6e6e6;
                }
                
                /* Task list styling more like Notion */
                .ProseMirror ul[data-type="taskList"] {
                  list-style-type: none;
                  padding-left: 0.125rem;
                }
                
                .ProseMirror ul[data-type="taskList"] li {
                  display: flex;
                  align-items: flex-start;
                  margin-bottom: 0.5rem;
                }
                
                .ProseMirror ul[data-type="taskList"] li > label {
                  margin-right: 0.5rem;
                  display: flex;
                  align-items: center;
                  cursor: pointer;
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
                  transition: all 0.2s ease;
                }
                
                .dark .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
                  border-color: #4b5563;
                  background-color: #2c2c2c;
                }
                
                .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div p {
                  color: #a3a29e;
                  text-decoration: line-through;
                }
              `}</style>
              
              <div className="flex-1 overflow-auto">
                <EditorContent editor={editor} className="h-full" />
              </div>
              
              <div className="flex items-center justify-between p-2 text-xs text-[#64635c] dark:text-[#a3a29e] border-t border-[#e6e6e6] bg-white dark:bg-[#191919] dark:border-gray-700">
                <div>
                  {editor && (
                    <div className="flex items-center gap-4">
                      <span>
                        {editor.storage.characterCount.characters()} characters
                      </span>
                      <span>
                        {editor.storage.characterCount.words()} words
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {savingStatus === 'saving' ? "Saving..." : savingStatus === 'saved' ? "All changes saved" : "Unsaved changes"}
                  </span>
                  <span className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">Ctrl+S</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotesEditor; 