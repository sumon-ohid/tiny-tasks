"use client";

import { useState } from "react";
import { Card } from "../card";
import NotesEditor from "./notes-editor";
import { Button } from "../button";
import { Pencil } from "lucide-react";

export function Nav() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditorOpen(true)}
        className="flex items-center gap-2"
      >
        <Pencil size={16} />
        <span>Notes</span>
      </Button>

      {isEditorOpen && (
        <NotesEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </>
  );
}
