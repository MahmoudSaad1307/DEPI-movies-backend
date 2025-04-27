const mongoose = require("mongoose");
const ReviewInteractionSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review",required:true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,required:true},
  action: {type:String,default:"like"},
  createdAt: { type: Date, default: Date.now },
});
