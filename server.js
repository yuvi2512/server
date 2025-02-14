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
  console.log("✅ Client connected:", socket.id);

  // Matchmaking logic
  socket.on("findMatch", () => {
    if (waitingUsers.length > 0) {
      // Get the first waiting user
      const matchedUser = waitingUsers.shift(); 
      const room = matchedUser.id; // Use the first user's ID as the room

      // Join both users to the same room
      socket.join(room);
      io.sockets.sockets.get(matchedUser.id)?.join(room);

      console.log(`🔗 Match found! Room: ${room}`);

      // Notify both users that they are matched
      io.to(room).emit("matched", { room });
    } else {
      // No users waiting, push this user into the queue
      waitingUsers.push({ id: socket.id });
      console.log(`🕐 User added to waiting list: ${socket.id}`);
    }
  });

  // Handle WebRTC offer
  socket.on("offer", ({ offer, room }) => {
    console.log(`📩 Offer received from ${socket.id}, forwarding to room: ${room}`);
    socket.broadcast.to(room).emit("offer", { offer });
  });

  // Handle WebRTC answer
  socket.on("answer", ({ answer, room }) => {
    console.log(`📩 Answer received from ${socket.id}, forwarding to room: ${room}`);
    socket.broadcast.to(room).emit("answer", { answer });
  });

  socket.on("candidate", ({ candidate, room }) => {
    console.log(`📡 ICE Candidate from ${socket.id}, forwarding to room: ${room}`);
    socket.broadcast.to(room).emit("candidate", { candidate }); // Use broadcast.to
  });
  

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    // Remove from waiting list
    waitingUsers = waitingUsers.filter((user) => user.id !== socket.id);
  });
});

server.listen(4000, () => {
  console.log("🚀 WebSocket server running on port 4000");
});
