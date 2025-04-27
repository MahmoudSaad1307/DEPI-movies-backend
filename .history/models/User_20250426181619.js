const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  photoURL:{type: String},
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  preferences: {
    favoriteGenres: [String],
    adultContent: Boolean,
  },
  movies: {
    favorites: [Number],
    watchlist: [{
      tmdbId: Number,
      addedAt: Date,
    }],
    watched: [{
      tmdbId: Number,
      rating: Number,
      watchedAt: Date,
    }],
  }
});

module.exports = mongoose.model('User', UserSchema);