// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const caCert = process.env.PG_CA_CERT; // lấy CA từ env

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true, // verify chứng chỉ
      ca: caCert,
    },
  },
});

// Railway (và nhiều hosted Postgres) yêu cầu SSL; cấu hình sau đảm bảo kết nối OK.
// const sequelize = new Sequelize(connectionString, {
//   dialect: 'postgres',
//   protocol: 'postgres',
//   logging: false, // set true nếu muốn thấy query
//   pool: {
//     max: 10,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
//   dialectOptions: {
//     // Với một số provider (Railway) cần SSL. rejectUnauthorized:false nếu provider dùng self-signed cert.
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     },
//   },
// });

module.exports = sequelize;
