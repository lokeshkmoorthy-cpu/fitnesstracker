import mysql from 'mysql2/promise';
import { env } from "./config/env";

// It is highly recommended to use a connection pool in web applications
// rather than a single connection. This allows for concurrent requests to
// be handled efficiently and automatically manages reconnecting.
const pool = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  port: env.dbPort,
  waitForConnections: true,
  connectionLimit: 10,  // adjust this value based on your RDS instance size
  queueLimit: 0
});

// Quickly test the connection when the application starts
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to AWS RDS Database!');
    connection.release(); // Always release the connection back to the pool
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
  }
};

testConnection();

// Export the pool to be used in other files (like your controllers or routes)
export default pool;
