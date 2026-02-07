"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export interface Group {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  user_count?: number; // Added helper for UI
}

export interface GroupFormData {
  name: string;
}

const fetchGroups = async (projectId: string, token: string): Promise<Group[]> => {
  const response = await fetch(`/api/projects/${projectId}/groups`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch groups");
  return response.json();
};

const createGroup = async (projectId: string, data: GroupFormData, token: string): Promise<Group> => {
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
};

const updateGroup = async (groupId: number, data: GroupFormData, token: string): Promise<Group> => {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update group");
  }
  return response.json();
};

const deleteGroup = async (groupId: number, token: string): Promise<void> => {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete group");
  }
};

export const useGroups = (projectId: string) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["groups", projectId],
    queryFn: () => fetchGroups(projectId, token!),
    enabled: !!token && !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: GroupFormData) => createGroup(projectId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupFormData }) => updateGroup(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGroup(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", projectId] });
    }
  });

  return {
    ...query,
    createGroup: createMutation.mutateAsync,
    updateGroup: updateMutation.mutateAsync,
    deleteGroup: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
