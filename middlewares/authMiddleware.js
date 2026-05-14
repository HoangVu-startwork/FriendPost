const jwt = require('jsonwebtoken');
require('dotenv').config();

// exports.verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer '))
//     return res.status(401).json({ error: 'Token không hợp lệ' });

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Lưu thông tin user vào request

//     req.user = {
//       id: Number(decoded.id), // 🔥 ép kiểu tại đây
//       email: decoded.email
//     };
//     next();
//   } catch (err) {
//     res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' });
//   }
// };

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  // 2. Kiểm tra nếu không có token
  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn"
    });
  }
  try {
    // 3. Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Kiểm tra dữ liệu trong decoded trước khi gán
    if (!decoded.id) {
      throw new Error("Token thiếu thông tin định danh");
    }

    //dòng này để trình duyệt KHÔNG ĐƯỢC lưu cache thông tin user
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    // 5. Gán vào req.user (Sử dụng Optional Chaining để an toàn)
    req.user = {
      id: Number(decoded.id),
      email: decoded.email || null,
      role: decoded.role || 'user'
    };

    next();
  } catch (err) {
    // 6. Phân loại lỗi để phản hồi chính xác cho Frontend
    let errorMessage = "Token không hợp lệ";

    if (err.name === 'TokenExpiredError') {
      errorMessage = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: errorMessage
    });
  }

  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);

  //   req.user = {
  //     id: Number(decoded.id),
  //     email: decoded.email,
  //     role: decoded.role
  //   };

  //   next();
  // } catch (err) {
  //   return res.status(401).json({ error: "Token hết hạn hoặc không hợp lệ" });
  // }
};