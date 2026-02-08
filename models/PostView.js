const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostView = sequelize.define('PostView', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  
    postId: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
  
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
  
    viewedAt: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    }
  }, {
    tableName: 'post_views',
    timestamps: false,
  });
  module.exports = PostView;