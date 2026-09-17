import "server-only";
import mysql from "mysql2/promise";

// Shared connection pool for the dialer app's own tables (app_contacts,
// app_chats, app_messages, app_call_history). This database also hosts an
// unrelated, pre-existing dialer_* schema for a different application — do
// not touch those tables from here.
declare global {
  var __dialerAppDbPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DEV_DB_HOST,
    port: Number(process.env.DEV_DB_PORT ?? 3306),
    user: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    connectTimeout: Number(process.env.DEV_DB_CONNECT_TIMEOUT ?? 10000),
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
}

// Cached on globalThis so Next.js dev's module reloading doesn't leak a new
// pool (and new TCP connections) on every request.
export const db = globalThis.__dialerAppDbPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__dialerAppDbPool = db;
}
