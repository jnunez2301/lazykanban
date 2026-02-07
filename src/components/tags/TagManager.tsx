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
    },
  });

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag({ name: newTagName, color: newTagColor });
      setNewTagName("");
      setNewTagColor("#6B7280");
      setCreateOpen(false);
    } catch (error) {
      console.error("Failed to create tag", error);
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

      <div className="border rounded-md divide-y">
        <div className="p-4 bg-muted/50 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
          <div className="col-span-4">Name & Color</div>
          <div className="col-span-6">Usage</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {tags?.map((tag) => (
          <div key={tag.id} className="p-4 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <TagBadge name={tag.name} color={tag.color} />
            </div>
            <div className="col-span-6 text-sm text-muted-foreground">
              {tag.is_default ? "Default Tag" : "Custom Tag"}
            </div>
            <div className="col-span-2 flex justify-end">
              {!tag.is_default && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the tag "{tag.name}"? This will allow you to optionally delete associated tasks or remove the tag.
                        (Note: Current implementation sets tag to null on tasks).
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
          </div>
        ))}
        {tags?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No tags found.</div>
        )}
      </div>
    </div>
  );
};
