const express = require('express');
const http = require("http");
require('dotenv').config();
const { Server } = require("socket.io");
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const FriendRequest = require('./routes/friendRoutes');
const Message = require('./routes/messageRoutes');
const ChatStatus = require('./routes/chatStatusRoutes');
const UserIntroduce = require('./routes/userintroduceRoutes');
const Conversation = require('./routes/conversationRoutes');
const Post = require('./routes/postRoutes');
const app = express();
const cors = require('cors');
const cookieParser = require("cookie-parser");

app.use(cors({
  origin: 'https://webpostsend.click',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);


// khởi tạo xử lý socket
// socketHandler(io);
const io = new Server(server, {
  cors: { origin: "https://webpostsend.click", credentials: true }
});

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("register", (userId) => {
    socket.join(String(userId));
    console.log(`📌 User ${userId} joined room ${userId}`);
  });

    // 🔹 Thêm room theo conversationId
  socket.on("joinConversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`💬 Joined conversation_${conversationId}`);
  });

  socket.on("leaveConversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`🚪 Left conversation_${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });


});



app.use((req, res, next) => {
  req.io = io;
  next();
});



app.use('/api/users', userRoutes);
app.use('/api/ketban', FriendRequest);
app.use('/api/message', Message);
app.use('/api/chatstatus', ChatStatus);
app.use('/api', Post);
app.use('/api', UserIntroduce);
app.use('/api', Conversation);

// app.listen(process.env.PORT , async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ DB connected');
//   } catch (err) {
//     console.error('❌ DB error:', err);
//   }
//   console.log('🚀 Server chạy tại http://localhost:3000', process.env.PORT);
// });

console.log("--- Kiểm tra biến môi trường ---");
console.log("PORT:", process.env.PORT);
console.log("DB_URL:", process.env.DATABASE_URL ? "Đã nhận" : "Chưa nhận");
console.log("CLOUDINARY_KEY:", process.env.CLOUDINARY_API_KEY ? "Đã nhận" : "Chưa nhận");
server.listen(process.env.PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
  } catch (err) {
    console.error('❌ DB error:', err);
  }
  console.log('🚀 Server chạy tại http://localhost:' + process.env.PORT);
});

module.exports = app;