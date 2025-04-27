const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");

const app = express();
app.use(express.json());
app.use(cors());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message, error.stack);
    process.exit(1);
  }
};

app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Vercel!');
});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;