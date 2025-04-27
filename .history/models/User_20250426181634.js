const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  photoURL:{type: String,default:"https://docs.gravatar.com/wp-content/uploads/2025/02/avatar-mysteryperson-20250210-256.png?w=256"},
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