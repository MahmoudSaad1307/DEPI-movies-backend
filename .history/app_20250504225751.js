const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

console.log("Starting app...");

// Import routes
console.log("Importing routes...");
const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");
console.log("Routes imported successfully");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
console.log("Middleware set up");

const MONGO_URI = "mongodb+srv://Malik:Malik20@cluster0.49odtnt.mongodb.net/movieApp";
console.log("MONGO_URI loaded");

// MongoDB Connection
console.log("Connecting to MongoDB...");
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
    useNewUrlParser: true, // Remove duplicate
    useUnifiedTopology: true, // Remove duplicate
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit on connection failure
  });

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Use your routes
console.log("Setting up routes...");
app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);
console.log("Routes set up");

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
console.log("Starting server...");
app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});