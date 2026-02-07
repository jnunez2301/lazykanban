"use client";

import { useState } from "react";
import { useGroups, Group } from "@/hooks/useGroups";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Settings as SettingsIcon } from "lucide-react";
import { PermissionsEditor } from "./PermissionsEditor";
import { GroupMembers } from "./GroupMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GroupManagerProps {
  projectId: string;
}

export const GroupManager = ({ projectId }: GroupManagerProps) => {
  const { data: groups, isLoading, createGroup, isCreating } = useGroups(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    try {
      await createGroup({ name: newGroupName });
      setNewGroupName("");
      setCreateOpen(false);
    } catch (error) {
      console.error("Failed to create group", error);
    }
  };

  const openGroupDetails = (group: Group) => {
    setSelectedGroup(group);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Groups & Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Manage user groups and their access rights.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogDescription>
                Create a new group to organize members and assign permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Developers, Managers"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating || !newGroupName.trim()}>
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups?.map((group) => (
          <Card key={group.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => openGroupDetails(group)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                {group.name}
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Created {new Date(group.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Manage Members & Permissions</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Manage members and permissions for this group.
            </DialogDescription>
          </DialogHeader>

          {selectedGroup && (
            <Tabs defaultValue="members" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4 px-1">
                <TabsContent value="members" className="mt-0">
                  <GroupMembers groupId={selectedGroup.id} />
                </TabsContent>
                <TabsContent value="permissions" className="mt-0">
                  <PermissionsEditor groupId={selectedGroup.id} />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
