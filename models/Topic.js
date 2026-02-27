const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Topic = sequelize.define('Topic', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    label: {
        type: DataTypes.STRING
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    img: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    color_1: {
        type: DataTypes.STRING
    },
    color_2: {
        type: DataTypes.STRING
    },
    color_icon: {
        type: DataTypes.STRING
    },
}, {
    tableName: 'topics',
    timestamps: false
});

module.exports = Topic;