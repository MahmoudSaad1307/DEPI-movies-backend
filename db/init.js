const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("Database schema initialized successfully");
  } catch (err) {
    console.error("Error initializing database schema:", err);
    throw err;
  }
}

module.exports = initDb;
