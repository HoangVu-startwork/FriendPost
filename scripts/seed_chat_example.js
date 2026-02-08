// scripts/seed_chat_example.js
require('dotenv').config();
const { sequelize, User, FriendRequest, Conversation, Participant, Message } = require('../models');

async function run() {
  await sequelize.authenticate();
  console.log('DB connected');

  // Dùng transaction để atomic
  const t = await sequelize.transaction();
  try {
    // 1) Tạo 2 user
    const user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password1'
    }, { transaction: t });

    const user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password2'
    }, { transaction: t });

    // 2) Tạo FriendRequest và accepted (để minh hoạ flow)
    const fr = await FriendRequest.create({
      senderId: user1.id,
      receiverId: user2.id,
      status: 'accepted',
      acceptedAt: new Date()
    }, { transaction: t });

    // 3) Tạo conversation 1:1 và participants
    const conv = await Conversation.create({ isGroup: false, createdBy: user1.id }, { transaction: t });
    await Participant.bulkCreate([
      { conversationId: conv.id, userId: user1.id },
      { conversationId: conv.id, userId: user2.id }
    ], { transaction: t });

    // 4) Tạo các tin nhắn theo kịch bản (lưu lần lượt vào biến)
    // T1: user1 -> "xin chào"
    const t1 = await Message.create({
      conversationId: conv.id,
      senderId: user1.id,
      content: 'xin chào',
      contentType: 'text'
    }, { transaction: t });

    // T2: user2 reply -> "xin chào bạn" (replyTo t1)
    const t2 = await Message.create({
      conversationId: conv.id,
      senderId: user2.id,
      content: 'xin chào bạn',
      replyToId: t1.id,
      contentType: 'text'
    }, { transaction: t });

    // T3: user1 reply -> "bạn tên là gì?" (replyTo t2)
    const t3 = await Message.create({
      conversationId: conv.id,
      senderId: user1.id,
      content: 'bạn tên là gì?',
      replyToId: t2.id,
      contentType: 'text'
    }, { transaction: t });

    // T4: user1 thêm 1 tin nhắn nữa -> "mình tên là nguyen minh a"
    const t4 = await Message.create({
      conversationId: conv.id,
      senderId: user1.id,
      content: 'mình tên là nguyen minh a',
      contentType: 'text'
    }, { transaction: t });

    // T5: user2 "chọn" tin nhắn "bạn tên là gì?" (t3) và trả lời:
    // nội dung: "mình tên là nguyen van b"
    // -> replyToId = t3.id
    const t5 = await Message.create({
      conversationId: conv.id,
      senderId: user2.id,
      content: 'mình tên là nguyen van b',
      replyToId: t3.id,
      contentType: 'text'
    }, { transaction: t });

    await t.commit();

    console.log('Seed finished. IDs:');
    console.log({ user1: user1.id, user2: user2.id, conv: conv.id, t1: t1.id, t2: t2.id, t3: t3.id, t4: t4.id, t5: t5.id });

    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Seed failed', err);
    process.exit(1);
  }
}

run();
