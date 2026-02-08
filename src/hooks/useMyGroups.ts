import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export interface UserGroup {
  group_id: number;
  group_name: string;
  project_id: number;
  project_name: string;
  role: 'owner' | 'admin' | 'member';
  membership_id: number;
}

const fetchUserGroups = async (token: string): Promise<UserGroup[]> => {
  const response = await fetch("/api/user/groups", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch user groups");
  return response.json();
};

const leaveGroup = async (groupId: number, token: string): Promise<void> => {
  const response = await fetch(`/api/groups/${groupId}/leave`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to leave group");
  }
};

export const useMyGroups = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-groups"],
    queryFn: () => fetchUserGroups(token!),
    enabled: !!token,
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: number) => leaveGroup(groupId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      // We also invalidate fetching specific project groups if needed, 
      // but we don't know the project ID easily here without passing it.
      // Usually "user-groups" invalidation is enough for this list.
      queryClient.invalidateQueries({ queryKey: ["userGroup"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    ...query,
    leaveGroup: leaveGroupMutation.mutateAsync,
    isLeaving: leaveGroupMutation.isPending,
  };
};
