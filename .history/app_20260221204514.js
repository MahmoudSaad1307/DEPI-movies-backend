const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is not set");
}

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);
app.get("/api/health/db", async (req, res) => {
  const state = mongoose.connection.readyState;
  const stateLabel =
    state === 1
      ? "connected"
      : state === 2
        ? "connecting"
        : state === 0
          ? "disconnected"
          : "disconnecting";
  if (state !== 1) {
    return res.status(503).json({ ok: false, state: stateLabel });
  }
  try {
    const result = await mongoose.connection.db.admin().ping();
    return res.json({ ok: true, state: stateLabel, ping: result.ok === 1 });
  } catch (error) {
    return res
      .status(503)
      .json({ ok: false, state: stateLabel, error: error.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
