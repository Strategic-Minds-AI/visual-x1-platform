import React, { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Naming a new project. Pressing New Project — or double-clicking it — opens this, the
 * name becomes the project tab's own title, and creating it opens that project as the
 * active tab. Enter creates it, so the whole gesture is one press and a name.
 */
export default function NewProjectDialog({ open, onOpenChange, onCreate }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const create = () => {
    onCreate(name.trim() || "New project");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ve-new-project-dialog">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Name this project. It opens as its own tab in the editor, beside the ones already open.</DialogDescription>
        </DialogHeader>

        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          placeholder="Project name"
          aria-label="Project name"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={create}>
            <FolderPlus size={14} />
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}