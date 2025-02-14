import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("findMatch", ({ interests }) => {
    if (waitingUsers.length > 0) {
      const matchedUser = waitingUsers.shift();
      const room = `room-${matchedUser.id}`;

      socket.join(room);
      io.sockets.sockets.get(matchedUser.id)?.join(room);

      io.to(room).emit("matched", { room });
    } else {
      waitingUsers.push({ id: socket.id });
    }
  });

  socket.on("offer", ({ offer, room }) => {
    socket.broadcast.to(room).emit("offer", { offer });
  });

  socket.on("answer", ({ answer, room }) => {
    socket.broadcast.to(room).emit("answer", { answer });
  });

  socket.on("candidate", ({ candidate, room }) => {
    socket.broadcast.to(room).emit("candidate", { candidate });
  });

  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);
  });
});

server.listen(4000, () => {
  console.log("🚀 WebSocket server running on port 4000");
});
