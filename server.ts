import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.NEXT_PUBLIC_APP_URL,
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

    // Task locking events
    socket.on("task-lock", (data: { taskId: number; projectId: string; userId: number; userName: string }) => {
      socket.to(`project:${data.projectId}`).emit("task-locked", {
        taskId: data.taskId,
        userId: data.userId,
        userName: data.userName,
        socketId: socket.id,
      });
    });

    socket.on("task-unlock", (data: { taskId: number; projectId: string }) => {
      socket.to(`project:${data.projectId}`).emit("task-unlocked", {
        taskId: data.taskId,
        socketId: socket.id,
      });
    });

    // Task CRUD events
    socket.on("task-created", (data: { projectId: string; task: any }) => {
      socket.to(`project:${data.projectId}`).emit("task-created", data.task);
    });

    socket.on("task-updated", (data: { projectId: string; task: any }) => {
      socket.to(`project:${data.projectId}`).emit("task-updated", data.task);
    });

    socket.on("task-deleted", (data: { projectId: string; taskId: number }) => {
      socket.to(`project:${data.projectId}`).emit("task-deleted", data.taskId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server initialized`);
    });
});
