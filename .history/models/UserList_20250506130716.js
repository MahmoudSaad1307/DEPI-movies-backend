const mongoose = require("mongoose");

const UserListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  descr
  movies: { type: [Number], default: [] },
});
module.exports = mongoose.model("UserList", UserListSchema);
