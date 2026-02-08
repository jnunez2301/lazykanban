"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Shield, ShieldAlert, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupMembersManager } from "@/components/groups/GroupMembersManager";

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  canCreateTasks: boolean; // 0 or 1 from DB usually comes as number, but typed as boolean in response if casted? Mysql driver usually returns 1/0. 
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageMembers: boolean;
  canManageTags: boolean;
  canEditProject: boolean;
}

const groupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

const permissionsSchema = z.object({
  canCreateTasks: z.boolean(),
  canEditTasks: z.boolean(),
  canDeleteTasks: z.boolean(),
  canManageMembers: z.boolean(),
  canManageTags: z.boolean(),
  canEditProject: z.boolean(),
});

interface GroupManagerProps {
  projectId: string;
}

export function GroupManager({ projectId }: GroupManagerProps) {
  const token = useAuthStore((state) => state.token);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [iscreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      // Map 1/0 to boolean
      return data.map((g: any) => ({
        ...g,
        canCreateTasks: !!g.canCreateTasks,
        canEditTasks: !!g.canEditTasks,
        canDeleteTasks: !!g.canDeleteTasks,
        canManageMembers: !!g.canManageMembers,
        canManageTags: !!g.canManageTags,
        canEditProject: !!g.canEditProject,
      })) as Group[];
    },
    enabled: !!projectId && !!token,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof groupSchema>) => {
      const response = await fetch(`/api/projects/${projectId}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
      toast({ title: "Group created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof groupSchema> & { id: number }) => {
      const { id, ...body } = data;
      const response = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
      toast({ title: "Group updated successfully" });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating group", description: error.message, variant: "destructive" });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof permissionsSchema> & { groupId: number }) => {
      const { groupId, ...body } = data;
      const response = await fetch(`/api/groups/${groupId}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permissions");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
      toast({ title: "Permissions updated successfully" });
      setIsPermissionsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating permissions", description: error.message, variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
      toast({ title: "Group deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    },
  });

  const createForm = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "" },
  });

  const permissionsForm = useForm<z.infer<typeof permissionsSchema>>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canManageMembers: false,
      canManageTags: false,
      canEditProject: false,
    },
  });

  const openEdit = (group: Group) => {
    setSelectedGroup(group);
    editForm.reset({ name: group.name, description: group.description });
    setIsEditDialogOpen(true);
  };

  const openPermissions = (group: Group) => {
    setSelectedGroup(group);
    permissionsForm.reset({
      canCreateTasks: group.canCreateTasks,
      canEditTasks: group.canEditTasks,
      canDeleteTasks: group.canDeleteTasks,
      canManageMembers: group.canManageMembers,
      canManageTags: group.canManageTags,
      canEditProject: group.canEditProject,
    });
    setIsPermissionsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Group Management</h2>
          <p className="text-muted-foreground">
            Create groups and manage permissions for project members.
          </p>
        </div>
        <Dialog open={iscreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createGroupMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Developers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Group description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Group
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Permissions Summary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups?.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground">{group.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{group.member_count} members</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {group.canEditProject && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">Project Admin</Badge>}
                    {group.canManageMembers && <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">Manage Members</Badge>}
                    {group.canDeleteTasks && <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">Delete Tasks</Badge>}
                    {group.canCreateTasks && <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">Create Tasks</Badge>}
                    {/* Show a summary or count if too many? */}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openPermissions(group)} title="Manage Permissions">
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(group)} title="Edit Group">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Group">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{group.name}</strong>? This action cannot be undone.
                            Members of this group may lose access to the project if they belong to no other groups.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteGroupMutation.mutate(group.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {groups?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No groups found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Group: {selectedGroup?.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit((data) => selectedGroup && updateGroupMutation.mutate({ ...data, id: selectedGroup.id }))} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateGroupMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="members" className="py-4">
              {selectedGroup && <GroupMembersManager groupId={selectedGroup.id} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Form {...permissionsForm}>
              <form onSubmit={permissionsForm.handleSubmit((data) => selectedGroup && updatePermissionsMutation.mutate({ ...data, groupId: selectedGroup.id }))} className="space-y-6">

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={permissionsForm.control}
                    name="canEditProject"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-destructive/5 border-destructive/20">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-bold text-destructive">Project Administrator</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Full control over project settings, groups, and members.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={permissionsForm.control}
                    name="canManageMembers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Manage Members</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Add or remove members from groups.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={permissionsForm.control}
                    name="canCreateTasks"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Create Tasks</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Create new tasks in the project.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={permissionsForm.control}
                    name="canEditTasks"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Edit Tasks</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Edit details of existing tasks.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={permissionsForm.control}
                    name="canDeleteTasks"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Delete Tasks</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Delete tasks permanently.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={permissionsForm.control}
                    name="canManageTags"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Manage Tags</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Create, edit, and delete tags.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={updatePermissionsMutation.isPending}>
                    Save Permissions
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
