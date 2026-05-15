const multer = require('multer');
const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => {
//       const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, unique + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// Thay đổi từ diskStorage sang memoryStorage
// File sẽ được lưu tạm thời trong RAM (dưới dạng Buffer) thay vì ghi xuống ổ đĩa
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB (tùy chọn)
    }
});

module.exports = upload;