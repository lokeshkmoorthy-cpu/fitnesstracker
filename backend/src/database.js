import mysql from "mysql2/promise";
import { env } from "./config/env.js";
const pool = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  port: env.dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  // adjust this value based on your RDS instance size
  queueLimit: 0,
  dateStrings: true,
  // fail fast instead of hanging when RDS is unreachable (e.g. security group / network)
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 1e4
});
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("\u2705 Successfully connected to AWS RDS Database!");
    connection.release();
  } catch (error) {
    console.error("\u274C Database connection failed:", error.message);
  }
};
testConnection();
var stdin_default = pool;
export {
  stdin_default as default
};
