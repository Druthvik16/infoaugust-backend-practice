const mysql = require('mysql2');
let obj = 
{
  password: process.env.DB_PASS,
  user: process.env.DB_USER,
  database: process.env.MYSQL_DB,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  // connectTimeout: 2147483647,
  // connectionLimit: 500000,
  // acquireTimeout  : 2147483647,
  // timeout         : 2147483647,
} 
const pool = mysql.createPool(obj);
console.log("database pool created")
// pool.acquireConnection(50000000,(err,conn)=>{
//   console.log(err)
//   console.log(conn)
// })
//  console.log(pool)
// return 

pool.on('error', (err) => 
{
    console.error('Pool error:', err);
    handleDisconnect();
    // if (err.code === 'PROTOCOL_CONNECTION_LOST') 
    // {
    //   handleDisconnect();
    // }
});

function handleDisconnect() {
    console.log('Reconnecting to the database...');
    pool = mysql.createPool(obj);
}

module.exports = pool