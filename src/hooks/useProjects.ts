import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  name: string;
  description?: string;
}

const fetchProjects = async (token: string): Promise<Project[]> => {
  const response = await fetch("/api/projects", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
};

const createProject = async (data: ProjectFormData, token: string): Promise<Project> => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create project");
  }
  return response.json();
};

const deleteProject = async (id: number, token: string): Promise<void> => {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete project");
  }
};

export const useProjects = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) => createProject(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProject(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    ...query,
    createProject: createMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Hook for single project details
const fetchProject = async (id: string, token: string): Promise<Project> => {
  const response = await fetch(`/api/projects/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch project");
  return response.json();
};

export const useProject = (id: string) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id, token!),
    enabled: !!token && !!id,
  });
};
