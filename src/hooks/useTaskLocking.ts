import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

export interface TaskLock {
  taskId: number;
  userId: number;
  userName: string;
  socketId: string;
}

export const useTaskLocking = (projectId: string) => {
  const [lockedTasks, setLockedTasks] = useState<Map<number, TaskLock>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  const activeLocksRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!projectId || !user) return;

    // Initialize socket connection
    const socket = io({
      path: "/api/socket",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Socket.IO for task locking");
      socket.emit("join-project", projectId);
    });

    socket.on("task-locked", (data: TaskLock) => {
      setLockedTasks((prev) => {
        const newLocks = new Map(prev);
        newLocks.set(data.taskId, data);
        return newLocks;
      });
    });

    socket.on("task-unlocked", (data: { taskId: number; socketId: string }) => {
      setLockedTasks((prev) => {
        const newLocks = new Map(prev);
        newLocks.delete(data.taskId);
        return newLocks;
      });
    });

    return () => {
      // Unlock all tasks this user has locked
      activeLocksRef.current.forEach((taskId) => {
        socket.emit("task-unlock", { taskId, projectId });
      });
      socket.emit("leave-project", projectId);
      socket.disconnect();
    };
  }, [projectId, user]);

  const lockTask = useCallback(
    (taskId: number) => {
      if (!socketRef.current || !user) return;

      socketRef.current.emit("task-lock", {
        taskId,
        projectId,
        userId: user.id,
        userName: user.name,
      });

      activeLocksRef.current.add(taskId);
    },
    [projectId, user]
  );

  const unlockTask = useCallback(
    (taskId: number) => {
      if (!socketRef.current) return;

      socketRef.current.emit("task-unlock", {
        taskId,
        projectId,
      });

      activeLocksRef.current.delete(taskId);
    },
    [projectId]
  );

  const isTaskLocked = useCallback(
    (taskId: number): boolean => {
      return lockedTasks.has(taskId);
    },
    [lockedTasks]
  );

  const getTaskLock = useCallback(
    (taskId: number): TaskLock | undefined => {
      return lockedTasks.get(taskId);
    },
    [lockedTasks]
  );

  const isLockedByMe = useCallback(
    (taskId: number): boolean => {
      return activeLocksRef.current.has(taskId);
    },
    []
  );

  return {
    lockedTasks,
    lockTask,
    unlockTask,
    isTaskLocked,
    getTaskLock,
    isLockedByMe,
  };
};
