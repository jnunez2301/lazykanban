import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export interface Tag {
  id: number;
  project_id: number;
  name: string;
  color: string;
  is_default: boolean;
  display_order: number;
}

export interface TagFormData {
  name: string;
  color: string;
}

const fetchTags = async (projectId: string, token: string): Promise<Tag[]> => {
  const response = await fetch(`/api/projects/${projectId}/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch tags");
  return response.json();
};

const createTag = async (projectId: string, data: TagFormData, token: string): Promise<Tag> => {
  const response = await fetch(`/api/projects/${projectId}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create tag");
  }
  return response.json();
};

export const useTags = (projectId: string) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tags", projectId],
    queryFn: () => fetchTags(projectId, token!),
    enabled: !!token && !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: TagFormData) => createTag(projectId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] });
    },
  });

  return {
    ...query,
    createTag: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};
