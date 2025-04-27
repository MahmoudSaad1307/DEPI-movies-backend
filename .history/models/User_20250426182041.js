const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: true,
  },,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: true,
  },
  photoURL: {
    type: String,
    default:
      "https://docs.gravatar.com/wp-content/uploads/2025/02/avatar-mysteryperson-20250210-256.png?w=256",
  },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  preferences: {
    favoriteGenres: [String],
    adultContent: Boolean,
  },
  movies: {
    favorites: [Number],
    watchlist: [
      {
        tmdbId: Number,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    watched: [
      {
        tmdbId: Number,
        rating: Number,
        watchedAt: { type: Date, default: Date.now },
      },
    ],
  },
});

module.exports = mongoose.model("User", UserSchema);
