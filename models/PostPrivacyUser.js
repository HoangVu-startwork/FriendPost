const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostPrivacyUser = sequelize.define('PostPrivacyUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('exclude', 'specific'),
        allowNull: false
    }
}, {
    tableName: 'post_privacy_users',
    timestamps: false
});

module.exports = PostPrivacyUser;