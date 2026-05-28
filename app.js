const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const pool = require("./db/pool");
const initDb = require("./db/init");

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);

app.get("/api/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, state: "connected" });
  } catch (error) {
    return res
      .status(503)
      .json({ ok: false, state: "disconnected", error: error.message });
  }
});

const PORT = process.env.PORT || 8000;

// Initialize schema then start listening
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database, shutting down:", err);
    process.exit(1);
  });
