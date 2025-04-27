const mongoose = require("mongoose");

const UserListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  movies: [Number],
});
module.exports=mongoose.model("UserList",)