import { Server } from "socket.io";
import express from "express";
import http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
  },
});

let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("findMatch", () => {
    if (waitingUsers.length > 0) {
      const matchedUser = waitingUsers.pop();
      const room = `${socket.id}-${matchedUser.id}`;

      socket.join(room);
      matchedUser.join(room);

      io.to(room).emit("matched", { room });
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on("offer", (data) => {
    socket.broadcast.to(data.room).emit("offer", data.offer);
  });

  socket.on("answer", (data) => {
    socket.broadcast.to(data.room).emit("answer", data.answer);
  });

  socket.on("candidate", (data) => {
    socket.broadcast.to(data.room).emit("candidate", data.candidate);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);
  });
});

server.listen(4000, () => {
  console.log("WebSocket server running on port 4000");
});
