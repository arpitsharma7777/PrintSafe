require("dotenv").config();

const pool = require("./db");

const testDbConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Database connected successfully:", result.rows[0].now);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
};

testDbConnection();
