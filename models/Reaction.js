const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reaction = sequelize.define('Reaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    label: {
        type: DataTypes.STRING
    },
    icon: {
        type: DataTypes.STRING
    },
    color: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'reactions',
    timestamps: false
});

module.exports = Reaction;