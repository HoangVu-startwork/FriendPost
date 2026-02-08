// src/socket.js
const jwt = require('jsonwebtoken'); // nếu dùng JWT

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    socket.on("joinUser", (userId) => {
      if (!userId) return console.log("❗ Missing userId");
      socket.join(userId.toString());
      console.log(`📌 User ${userId} joined room. Socket: ${socket.id}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};