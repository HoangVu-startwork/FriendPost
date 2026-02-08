const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Công việc của user
const UserJob = sequelize.define('UserJob', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING
    },
    startYear: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endYear: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'user_jobs',
    timestamps: true
});

module.exports = UserJob;