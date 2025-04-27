// app.js

require('dotenv').config(); // <<< لتحميل متغيرات البيئة من ملف .env (محلياً)

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');

const usersRoute = require("./routes/users");
const reviewsRoute = require("./routes/reviews");
const userListRoute = require("./routes/user-list");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// قراءة MONGO_URI من متغيرات البيئة
MONGO_URI=mongodb+srv://Malik:Malik20@cluster0.49odtnt.mongodb.net/yourDatabaseName

// اتصال مع قاعدة البيانات
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// استخدام الراوترات
app.use("/api/users", usersRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/userList", userListRoute);

// تحديد البورت
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
