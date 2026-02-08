import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export interface UserGroupMembership {
  group_id: number;
  group_name: string;
  role: "owner" | "admin" | "member";
  project_id: number;
}

const fetchUserGroupsForProject = async (projectId: string, token: string): Promise<UserGroupMembership[] | null> => {
  const response = await fetch(`/api/projects/${projectId}/my-group`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 404) return null; // User not in any group for this project
    throw new Error("Failed to fetch user groups");
  }
  return response.json();
};

export const useUserGroup = (projectId: string | null) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["userGroup", projectId],
    queryFn: () => fetchUserGroupsForProject(projectId!, token!),
    enabled: !!token && !!projectId,
  });
};
