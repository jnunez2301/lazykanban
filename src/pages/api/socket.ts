import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/lib/socket";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");

    const httpServer: HTTPServer = res.socket.server as any;
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

      socket.on("join-project", (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`Socket ${socket.id} joined project:${projectId}`);
      });

      socket.on("leave-project", (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`Socket ${socket.id} left project:${projectId}`);
      });

      socket.on("cursor-move", (data: any) => {
        socket.to(`project:${data.projectId}`).emit("cursor-update", {
          ...data,
          socketId: socket.id,
        });
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("Socket.IO server already initialized");
  }

  res.end();
}
