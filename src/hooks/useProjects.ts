import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  owner_name?: string;
  is_pinned: boolean;
  pinned_at: string | null;
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

const updateProject = async (id: number, data: Partial<ProjectFormData> & { isPinned?: boolean }, token: string): Promise<Project> => {
  const response = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update project");
  }
  return response.json();
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
      toast.success("Project created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProject(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectFormData> & { isPinned?: boolean } }) =>
      updateProject(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update project");
    },
  });

  return {
    ...query,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
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

export const useProject = (id: string | null) => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => {
      if (!id) return Promise.reject("No project ID");
      return fetchProject(id, token!);
    },
    enabled: !!token && !!id,
  });
};
