"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

interface Permissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageMembers: boolean;
  canManageTags: boolean;
  canEditProject: boolean;
}

export function useProjectPermissions(projectId: string | null) {
  const { token, user } = useAuthStore();

  return useQuery({
    queryKey: ["projectPermissions", projectId, user?.id],
    queryFn: async () => {
      if (!projectId || !token) return null;

      const response = await fetch(`/api/projects/${projectId}/my-permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // If user is not in any group, return no permissions
        if (response.status === 404) {
          return {
            canCreateTasks: false,
            canEditTasks: false,
            canDeleteTasks: false,
            canManageMembers: false,
            canManageTags: false,
            canEditProject: false,
          };
        }
        throw new Error("Failed to fetch permissions");
      }

      return response.json() as Promise<Permissions>;
    },
    enabled: !!token && !!projectId,
  });
}
