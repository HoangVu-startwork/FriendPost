const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    content: { // nội dung bình luận
        type: DataTypes.TEXT,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: { // thời gian bình luận
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    postId: {  // Liên kết bài viết
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {  // Ai là người bình luận
        type: DataTypes.INTEGER,
        allowNull: false
    },
    parentId: { // Bình luận cha (nếu là trả lời)
        type: DataTypes.INTEGER,
        allowNull: true
    },
}, {
    tableName: 'comments',
    timestamps: false,
    indexes: [
        {
            name: 'idx_postId_parentId',
            fields: ['postId', 'parentId']
        },
        {
            name: 'idx_userId',
            fields: ['userId']
        }
    ]
})


module.exports = Comment;