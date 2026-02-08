"use client";

import { useState } from "react";
import { useTags, Tag } from "@/hooks/useTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TagBadge } from "./TagBadge";
import { Plus, Trash2, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TagManagerProps {
  projectId: string;
}

export const TagManager = ({ projectId }: TagManagerProps) => {
  const { data: tags, isLoading, createTag, isCreating } = useTags(projectId);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [createOpen, setCreateOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const deleteTag = async (tagId: number) => {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to delete tag");
  };

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] });
      toast.success("Tag deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete tag");
    },
  });

  const handleCreate = async () => {
    if (!newTagName.trim()) return;

    // Validate tag name
    const tagNameRegex = /^[a-zA-Z0-9\s\-_.,!()]+$/;
    if (!tagNameRegex.test(newTagName)) {
      toast.error("Tag name can only contain letters, numbers, spaces, and basic punctuation (- _ . , ! ())");
      return;
    }

    if (newTagName.length > 50) {
      toast.error("Tag name must be less than 50 characters");
      return;
    }

    try {
      await createTag({ name: newTagName, color: newTagColor });
      setNewTagName("");
      setNewTagColor("#6B7280");
      setCreateOpen(false);
      toast.success("Tag created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tag");
    }
  };

  if (isLoading) return <div>Loading tags...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tags</h2>
          <p className="text-sm text-muted-foreground">
            Manage custom tags for your tasks.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to categorize your tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tag Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Bug, Feature"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="font-mono uppercase"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="flex">
                  <TagBadge name={newTagName || "Tag Name"} color={newTagColor} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating || !newTagName.trim()}>
                {isCreating ? "Creating..." : "Create Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 pr-2">
                <TagBadge name={tag.name} color={tag.color} />
                <span className="text-xs text-muted-foreground">
                  {tag.is_default ? "Default" : "Custom"}
                </span>
                {!tag.is_default && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive ml-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the tag "{tag.name}"? This will remove the tag from all associated tasks.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(tag.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground border rounded-lg">
            No tags found. Create your first tag to get started.
          </div>
        )}
      </div>
    </div>
  );
};
