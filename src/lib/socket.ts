import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
};

export interface CursorPosition {
  x: number;
  y: number;
  userId: number;
  userName: string;
  avatar?: string;
  projectId: string;
}

export const initializeSocketIO = (httpServer: HTTPServer) => {
  if (!(httpServer as any).io) {
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_APP_URL
          : "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join a project room
      socket.on("join-project", (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`Socket ${socket.id} joined project:${projectId}`);
      });

      // Leave a project room
      socket.on("leave-project", (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`Socket ${socket.id} left project:${projectId}`);
      });

      // Handle cursor movement
      socket.on("cursor-move", (data: CursorPosition) => {
        socket.to(`project:${data.projectId}`).emit("cursor-update", {
          ...data,
          socketId: socket.id,
        });
      });

      // Handle user disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    (httpServer as any).io = io;
  }

  return (httpServer as any).io;
};
