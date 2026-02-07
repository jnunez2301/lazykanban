"use client";

import { useGroupPermissions } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Permissions } from "@/hooks/usePermissions";

interface PermissionsEditorProps {
  groupId: number;
  readOnly?: boolean;
}

const PERMISSION_LABELS: Record<keyof Omit<Permissions, "id" | "group_id">, string> = {
  can_create_tasks: "Create Tasks",
  can_edit_tasks: "Edit Tasks",
  can_delete_tasks: "Delete Tasks",
  can_manage_tags: "Manage Tags",
  can_manage_members: "Manage Members",
  can_edit_project: "Edit Project Details",
};

export const PermissionsEditor = ({ groupId, readOnly = false }: PermissionsEditorProps) => {
  const { data: permissions, isLoading } = useGroupPermissions(groupId);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const updatePermissionMutation = useMutation({
    mutationFn: async (variables: { key: keyof Permissions; value: boolean }) => {
      const response = await fetch(`/api/groups/${groupId}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [variables.key]: variables.value }),
      });
      if (!response.ok) throw new Error("Failed to update permission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", groupId] });
    },
  });

  const handleToggle = (key: keyof Permissions, checked: boolean) => {
    if (readOnly) return;
    updatePermissionMutation.mutate({ key, value: checked });
  };

  if (isLoading) {
    return <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>;
  }

  if (!permissions) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Permissions</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(PERMISSION_LABELS) as Array<keyof typeof PERMISSION_LABELS>).map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={!!permissions[key]}
              onCheckedChange={(checked) => handleToggle(key, checked as boolean)}
              disabled={readOnly || updatePermissionMutation.isPending}
            />
            <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
              {PERMISSION_LABELS[key]}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
