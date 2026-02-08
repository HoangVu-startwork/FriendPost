// models/Post.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mediaUrl: { // URL Cloudinary
        type: DataTypes.STRING,
        allowNull: true
    },
    mediaType: {
        type: DataTypes.STRING, // image | video
        allowNull: true,
    },
    backgroundColor: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    display: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // ⭐ Thêm phần file
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fileType: {
        type: DataTypes.STRING,  // pdf | docx | xlsx | txt
        allowNull: true
    },
    // public: công khai 
    // friends: bạn bè
    // only_me: chỉ mình tôi
    // exclude: loại trừ
    // specific: cụ thể là chỉ định cho người mình muốn nhìn thấy còn những người khác thì không
    privacy: {
        type: DataTypes.ENUM('public', 'friends', 'only_me', 'exclude', 'specific'),
        defaultValue: 'public',
    },
    createdAt: { // thời gian đăng
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'posts',
    timestamps: false // vì ta đã tự có createdAt rồi
})

module.exports = Post;