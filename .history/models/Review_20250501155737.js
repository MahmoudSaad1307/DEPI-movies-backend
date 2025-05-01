const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  isMovie
  movieId: {type:Number,required:true},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required:true},
  content: {
      text: String,
    spoilerAlert: {type:Boolean,default:false},
  },
  stats: {
    likes: { type: Number, default: 0 },
  },
  timestamps: {
    createdAt: { type: Date, default: Date.now },
  }
});

module.exports = mongoose.model('Review', ReviewSchema);