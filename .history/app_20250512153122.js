const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv)
const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const MONGO_URI =
  "mongodb+srv://Malik:Malik20@cluster0.49odtnt.mongodb.net/movieApp";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Use your routes
app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
