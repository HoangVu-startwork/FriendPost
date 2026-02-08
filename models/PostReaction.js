const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostReaction = sequelize.define('PostReaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reactionId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'post_reactions',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['postId', 'userId']
        }
    ]
});

module.exports = PostReaction;