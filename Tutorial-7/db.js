const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'PARpan@1005',
  database: 'gqldemo',
});

module.exports = pool;