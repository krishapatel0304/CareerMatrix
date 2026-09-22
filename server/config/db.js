require("dotenv").config();
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : null;

// Use DATABASE_URL with SSL for Supabase / Render production if provided.
// Otherwise, fall back to individual local PostgreSQL parameters.
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ...(isProduction && { ssl: { rejectUnauthorized: false } }),
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("PostgreSQL connected successfully!");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

module.exports = pool;