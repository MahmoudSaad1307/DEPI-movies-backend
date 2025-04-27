const mongoose = require("mongoose");
const ReviewInteractionSchema=new mongoose.Schema({


reviewId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
action:String,
createdAt:{type:Date,default:Data.now}





});