const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token không hợp lệ' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user vào request

    req.user = {
      id: Number(decoded.id), // 🔥 ép kiểu tại đây
      email: decoded.email
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token hết hạn hoặc không hợp lệ' });
  }
};
