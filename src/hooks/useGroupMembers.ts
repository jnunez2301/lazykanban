"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: "admin" | "manager" | "member" | "viewer";
  joined_at: string;
  user_name: string;
  user_email: string;
}

const fetchMembers = async (groupId: number, token: string): Promise<GroupMember[]> => {
  const response = await fetch(`/api/groups/${groupId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch members");
  return response.json();
};

const addMember = async (groupId: number, email: string, role: string, token: string): Promise<GroupMember> => {
  const response = await fetch(`/api/groups/${groupId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add member");
  }
  return response.json();
};

const removeMember = async (groupId: number, userId: number, token: string): Promise<void> => {
  const response = await fetch(`/api/groups/${groupId}/members?userId=${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove member");
  }
};

export const useGroupMembers = (groupId: number | null) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => fetchMembers(groupId!, token!),
    enabled: !!token && !!groupId,
  });

  const addMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => addMember(groupId!, email, role, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", groupId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeMember(groupId!, userId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", groupId] });
    },
  });

  return {
    ...query,
    addMember: addMutation.mutateAsync,
    removeMember: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
};
