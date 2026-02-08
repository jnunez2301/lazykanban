"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Users, LogOut } from "lucide-react";

interface UserGroup {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  role: "owner" | "admin" | "member";
  membership_id: number;
}

export function TeamMembersPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["userGroups"],
    queryFn: async () => {
      const response = await fetch("/api/user/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch groups");
      return response.json() as Promise<UserGroup[]>;
    },
    enabled: !!token,
  });

  const leaveMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
      toast.success("Successfully left the group");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Group by project
  const groupedByProject = groups?.reduce((acc, group) => {
    if (!acc[group.project_name]) {
      acc[group.project_name] = [];
    }
    acc[group.project_name].push(group);
    return acc;
  }, {} as Record<string, UserGroup[]>);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Memberships</CardTitle>
        <CardDescription>
          All groups you are part of across all projects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!groupedByProject || Object.keys(groupedByProject).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            You are not part of any groups yet.
          </p>
        ) : (
          Object.entries(groupedByProject).map(([projectName, projectGroups]) => (
            <div key={projectName} className="space-y-3">
              <h3 className="font-semibold text-lg">{projectName}</h3>
              <div className="space-y-2">
                {projectGroups.map((group) => (
                  <div
                    key={group.group_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{group.group_name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {group.role}
                        </Badge>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to leave "{group.group_name}"? You will lose
                            access to all tasks and data associated with this group.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => leaveMutation.mutate(group.group_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Leave Group
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
