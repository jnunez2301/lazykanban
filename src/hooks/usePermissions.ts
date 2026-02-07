import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export interface Permissions {
  id: number;
  group_id: number;
  can_create_tasks: boolean;
  can_edit_tasks: boolean;
  can_delete_tasks: boolean;
  can_manage_tags: boolean;
  can_manage_members: boolean;
  can_edit_project: boolean;
}

// We need a way to get permissions for a specific project/group context.
// Usually permissions are tied to a group which is tied to a project.
// For the frontend, it's easier if we fetch permissions for the CURRENT project context.
// But wait, my API structure is `GET /api/groups/:id/permissions`. 
// To get permissions effectively, I need to know which group the user belongs to in a project.
// My `GET /api/projects` returns `owner_id`. If I am owner, I have full permissions (implicitly).
// If I am not owner, I need to know my group permissions.
// This logic might be complex to do in frontend for every action.
// 
// Alternative: A hook `useProjectPermissions(projectId)` that fetches "my permissions" for this project.
// I don't have a direct API for "my permissions in project X".
// 
// Let's create a helper in `useProjects` or a new API endpoint? 
// Actually, `GET /api/projects/:id` checks if I have access.
// Maybe I should add a backend endpoint `GET /api/projects/:id/my-permissions`?
// That would be cleaner. 
// For now, I'll assume users know their role/permissions or I'll implement `useProjectPermissions` by 
// checking if user is owner (full access) 
// OR checking the group they belong to.
// 
// Let's implement a simple version that assumes owner has all permissions, 
// and for others... we might need to fetch their member record.
// 
// Actually, I can add `GET /api/projects/:id/permissions/me`? 
// Or just let the backend handle rejection and frontend show buttons optimistically or 
// fetch group details if needed.
// 
// Let's stick to the plan: "Hook for checking user permissions".
// I'll create a hook that returns default "allow all" for now to unblock UI, 
// but really it should check against the user's role/group.
// 
// Users have `ui_mode`. 
//
// In `useProjects`, I return list of projects.
//
// Let's create a hook that fetches the user's permissions for a specific group if we know the group ID.
// But we don't always know the group ID easily on the project page without fetching project groups and finding where user is member.
// 
// TO KEEP IT SIMPLE FOR MVP:
// I will rely on the `owner_id` check on frontend for "Owner" features.
// For granular permissions, I will fetch them when entering a project context.
// 
// Let's update `usePermissions` to fetch permissions for a group.

const fetchGroupPermissions = async (groupId: number, token: string): Promise<Permissions> => {
  const response = await fetch(`/api/groups/${groupId}/permissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch permissions");
  return response.json();
};

export const useGroupPermissions = (groupId: number | null) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["permissions", groupId],
    queryFn: () => fetchGroupPermissions(groupId!, token!),
    enabled: !!token && !!groupId,
  });
};
