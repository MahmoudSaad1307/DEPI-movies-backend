const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
// dotenv.config({
//   path: "./config.env",
// });

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect("mongodb+srv://Malik:Malik20@cluster0.49odtnt.mongodb.net/movieApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, 
    socketTimeoutMS: 45000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server running on Port ${PORT}`);
});
