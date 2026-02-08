import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { Task } from "./useTasks";

export const useRealtimeTasks = (projectId: string) => {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!projectId || !user) return;

    // Initialize socket connection
    const socket = io({
      path: "/api/socket",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Socket.IO for real-time tasks");
      socket.emit("join-project", projectId);
    });

    // Listen for task CRUD events
    socket.on("task-created", (task: Task) => {
      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) => {
        if (!old) return [task];
        // Prevent duplicates
        if (old.some((t) => t.id === task.id)) return old;
        return [...old, task];
      });
    });

    socket.on("task-updated", (updatedTask: Task) => {
      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) => {
        if (!old) return [updatedTask];
        return old.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      });
    });

    socket.on("task-deleted", (taskId: number) => {
      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) => {
        if (!old) return [];
        return old.filter((task) => task.id !== taskId);
      });
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.disconnect();
    };
  }, [projectId, user, queryClient]);

  const emitTaskCreated = useCallback(
    (task: Task) => {
      if (socketRef.current) {
        socketRef.current.emit("task-created", { projectId, task });
      }
    },
    [projectId]
  );

  const emitTaskUpdated = useCallback(
    (task: Task) => {
      if (socketRef.current) {
        socketRef.current.emit("task-updated", { projectId, task });
      }
    },
    [projectId]
  );

  const emitTaskDeleted = useCallback(
    (taskId: number) => {
      if (socketRef.current) {
        socketRef.current.emit("task-deleted", { projectId, taskId });
      }
    },
    [projectId]
  );

  return {
    emitTaskCreated,
    emitTaskUpdated,
    emitTaskDeleted,
  };
};
