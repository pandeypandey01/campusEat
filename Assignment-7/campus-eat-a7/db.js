const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'PARpan@1005',
  database: process.env.DB_NAME || 'campuseats',
  waitForConnections: true,
  connectionLimit: 5,
});
