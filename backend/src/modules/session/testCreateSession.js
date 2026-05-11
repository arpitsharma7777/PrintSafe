require("dotenv").config();

const pool = require("../../config/db");
const { createSession } = require("./session.model");

const testCreateSession = async () => {
  try {
    const session = await createSession();
    console.log("Session created:", session);
  } catch (error) {
    console.error("Failed to create session:", error.message);
  } finally {
    await pool.end();
  }
};

testCreateSession();
