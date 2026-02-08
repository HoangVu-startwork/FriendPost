const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
// Trường user
const UserEducation = sequelize.define('UserEducation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    schoolName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    level: {
        type: DataTypes.ENUM('Trung học', 'Cao đẳng', 'Đại học', 'Cao học'),
        allowNull: false
    },    
    startYear: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    endYear: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'user_educations',
    timestamps: true
});

module.exports = UserEducation;