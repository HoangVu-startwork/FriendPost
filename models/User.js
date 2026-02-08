// models/User.js
const { DataTypes } = require('sequelize'); // là bộ kiểu dữ liệu mà Sequelize cung cấp (như STRING, INTEGER, BOOLEAN, DATE,...).
const sequelize = require('../config/database'); // là đối tượng kết nối tới cơ sở dữ liệu (PostgreSQL, MySQL, v.v.), được tạo trong file config/database.js.

const User = sequelize.define('User', {
  // Hàm sequelize.define() dùng để khai báo một model mới — tức là cách Sequelize hiểu một bảng trong DB.
  // Cụ thể ở đây:
  //   'User' là tên model (Sequelize sẽ tự hiểu là bảng users nếu không ghi tableName).
  //   { ... } là các cột trong bảng.
  //   { tableName, timestamps } là tùy chọn cấu hình cho model.
  id: {
    type: DataTypes.INTEGER,  // Kiểu dữ liệu: INTEGER
    autoIncrement: true, // tự động tăng (1, 2, 3, 4,...)
    primaryKey: true // khóa chính của bảng
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false // Không được để trống (allowNull: false)
  },
  email: {
    type: DataTypes.STRING,
    unique: true, // không được trùng lặp giữa các user.
    allowNull: false
  },
  sdt: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  giotinh: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ngaysinh: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatUrl: { // URL Cloudinary
    type: DataTypes.STRING,
    allowNull: true
  },
  avatUrlfacebook: { // URL Cloudinary
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['sdt'], unique: true } // Index giúp truy vấn nhanh theo số điện thoại
  ]
});


// Mã hoá mật khẩu
// User.beforeCreate(async (user) => {
//   const salt = await bcrypt.genSalt(10);
//   user.password = await bcrypt.hash(user.password, salt);
// })


module.exports = User;
