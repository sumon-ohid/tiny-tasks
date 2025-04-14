'use client';

import { useState, useEffect } from 'react';
import { type Editor, JSONContent } from '@tiptap/react';
import { getUserNotes, saveUserNotes } from '@/lib/storage';
import {
  EditorBubbleMenu,
  EditorFloatingMenu,
  EditorProvider,
  EditorSelector,
  EditorLinkSelector,
  EditorClearFormatting,
  EditorFormatBold,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatCode,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorNodeText,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeBulletList,
  EditorNodeOrderedList,
  EditorNodeTaskList,
  EditorNodeQuote,
  EditorNodeCode,
  EditorNodeTable,
  EditorTextColor,
  EditorBackgroundColor,
  EditorTableMenu,
  EditorTableGlobalMenu,
  EditorTableColumnMenu,
  EditorTableRowMenu,
  EditorTableColumnBefore,
  EditorTableColumnAfter,
  EditorTableRowBefore,
  EditorTableRowAfter,
  EditorTableColumnDelete,
  EditorTableRowDelete,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableDelete,
  EditorTableMergeCells,
  EditorTableSplitCell,
  EditorTableFix,
  EditorCharacterCount,
} from '@/components/ui/kibo-ui/editor';

const textColors = [
  { name: 'Red', color: '#b91c1c' },
  { name: 'Orange', color: '#c2410c' },
  { name: 'Amber', color: '#b45309' },
  { name: 'Yellow', color: '#a16207' },
];

const backgroundColors = [
  { name: 'Red', color: '#fca5a5' },
  { name: 'Orange', color: '#fdba74' },
  { name: 'Amber', color: '#fcd34d' },
  { name: 'Yellow', color: '#fde047' },
];

const defaultContent = {
  "type":"doc",
  "content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Notes"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Start typing your notes here..."}]},
    {"type":"taskList","content":[{"type":"taskItem","attrs":{"checked":false},"content":[{"type":"paragraph","content":[{"type":"text","text":"Add new tasks here"}]}]}]}
  ]
};

const NotesEditor = ({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const [content, setContent] = useState<JSONContent>(defaultContent);
  const [openTextMenu, setOpenTextMenu] = useState(false);
  const [openFormatMenu, setOpenFormatMenu] = useState(false);
  const [openColorMenu, setOpenColorMenu] = useState(false);
  const [openLinkMenu, setOpenLinkMenu] = useState(false);
  
  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = getUserNotes();
    if (savedNotes) {
      setContent(savedNotes.content);
    }
  }, []);

  const handleUpdate = ({ editor }: { editor: Editor }) => {
    const json = editor.getJSON();
    setContent(json);
    // Save to localStorage on each update
    saveUserNotes(json);
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
        <div className="flex-1 overflow-hidden">
          <EditorProvider
            content={content}
            placeholder="Start typing..."
            className="bg-background h-full w-full p-4 overflow-y-auto"
            onUpdate={handleUpdate}
          >
            <EditorFloatingMenu>
              <EditorNodeHeading1 hideName />
              <EditorNodeBulletList hideName />
              <EditorNodeQuote hideName />
              <EditorNodeCode hideName />
              <EditorNodeTable hideName />
            </EditorFloatingMenu>
            <EditorBubbleMenu>
              <EditorSelector 
                title="Text" 
                open={openTextMenu} 
                onOpenChange={setOpenTextMenu}
              >
                <EditorNodeText />
                <EditorNodeHeading1 />
                <EditorNodeHeading2 />
                <EditorNodeHeading3 />
                <EditorNodeBulletList />
                <EditorNodeOrderedList />
                <EditorNodeTaskList />
                <EditorNodeQuote />
                <EditorNodeCode />
              </EditorSelector>
              <EditorSelector 
                title="Format"
                open={openFormatMenu}
                onOpenChange={setOpenFormatMenu}
              >
                <EditorFormatBold />
                <EditorFormatItalic />
                <EditorFormatUnderline />
                <EditorFormatStrike />
                <EditorFormatCode />
                <EditorFormatSuperscript />
                <EditorFormatSubscript />
              </EditorSelector>
              <EditorSelector 
                title="Color"
                open={openColorMenu}
                onOpenChange={setOpenColorMenu}
              >
                {textColors.map((color) => (
                  <EditorTextColor key={color.name} color={color.color} name={color.name} />
                ))}
                {backgroundColors.map((color) => (
                  <EditorBackgroundColor key={color.name} color={color.color} name={color.name} />
                ))}
              </EditorSelector>
              <EditorLinkSelector 
                open={openLinkMenu}
                onOpenChange={setOpenLinkMenu}
              />
              <EditorClearFormatting />
            </EditorBubbleMenu>
            <EditorTableMenu>
              <EditorTableColumnMenu>
                <EditorTableColumnBefore />
                <EditorTableColumnAfter />
                <EditorTableColumnDelete />
              </EditorTableColumnMenu>
              <EditorTableRowMenu>
                <EditorTableRowBefore />
                <EditorTableRowAfter />
                <EditorTableRowDelete />
              </EditorTableRowMenu>
              <EditorTableGlobalMenu>
                <EditorTableHeaderColumnToggle />
                <EditorTableHeaderRowToggle />
                <EditorTableDelete />
                <EditorTableMergeCells />
                <EditorTableSplitCell />
                <EditorTableFix />
              </EditorTableGlobalMenu>
            </EditorTableMenu>
            <div className="border-t p-2 text-sm text-slate-500">
              <EditorCharacterCount.Words>Words: </EditorCharacterCount.Words>
            </div>
          </EditorProvider>
        </div>
      </div>
    </div>
  );
}

export default NotesEditor;