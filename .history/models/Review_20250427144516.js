const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  tmdbMovieId: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: {
      text: String,
    spoilerAlert: Boolean,
  },
  stats: {
    likes: { type: Number, default: 0 },
  },
  timestamps: {
    createdAt: { type: Date, default: Date.now },
  }
});

module.exports = mongoose.model('Review', ReviewSchema);