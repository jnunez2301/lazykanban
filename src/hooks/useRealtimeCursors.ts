import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

export interface CursorData {
  x: number;
  y: number;
  userId: number;
  userName: string;
  avatar?: string;
  socketId?: string;
}

export const useRealtimeCursors = (projectId: string) => {
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!projectId || !user) return;

    // Initialize socket connection
    const socket = io({
      path: "/api/socket",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join-project", projectId);
    });

    socket.on("cursor-update", (data: CursorData & { socketId: string }) => {
      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(data.socketId, data);
        return newCursors;
      });

      // Remove cursor after 3 seconds of inactivity
      setTimeout(() => {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.delete(data.socketId);
          return newCursors;
        });
      }, 3000);
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.disconnect();
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [projectId, user]);

  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!socketRef.current || !user) return;

      // Throttle cursor updates to avoid overwhelming the server
      if (throttleRef.current) return;

      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
      }, 50); // Update at most every 50ms (20 times per second)

      socketRef.current.emit("cursor-move", {
        x,
        y,
        userId: user.id,
        userName: user.name,
        avatar: user.avatar,
        projectId,
      });
    },
    [projectId, user]
  );

  return { cursors, updateCursor };
};
