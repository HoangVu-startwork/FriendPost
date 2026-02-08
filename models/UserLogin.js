const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserLogin = sequelize.define('UserLogin', {

    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deviceInfo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    loggedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_logins',
    timestamps: false
});


module.exports = UserLogin;