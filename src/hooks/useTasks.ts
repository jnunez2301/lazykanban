import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  owner_id: number;
  owner_name?: string;
  assignee_id: number | null;
  assignee_name?: string;
  tag_id: number | null;
  tag_name?: string;
  tag_color?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  assigneeId?: number | null;
  tagId?: number | null;
}

const fetchTasks = async (projectId: string, token: string): Promise<Task[]> => {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
};

const createTask = async (projectId: string, data: TaskFormData, token: string): Promise<Task> => {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create task");
  }
  return response.json();
};

const updateTask = async (taskId: number, data: Partial<TaskFormData>, token: string): Promise<Task> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }
  return response.json();
};

const deleteTask = async (taskId: number, token: string): Promise<void> => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }
};

export const useTasks = (projectId: string) => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId, token!),
    enabled: !!token && !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskFormData) => createTask(projectId, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TaskFormData> }) => updateTask(id, data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });

  return {
    ...query,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
