// scripts/sync.js
require('dotenv').config();
const { sequelize, User, FriendRequest, Conversation, Participant, Message } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected ✅');

    // force: true sẽ xoá toàn bộ bảng và tạo lại từ đầu, tất cả dữ liệu trước đó sẽ mất.
    // alter: true Thêm cột mới, Cập nhật cấu trúc bảng, Không xoá dữ liệu, Không khuyến khích dùng ở môi trường production
    await sequelize.sync({ alter: true });
    console.log('Models synced ✅');
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
})();
