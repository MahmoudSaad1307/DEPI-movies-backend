const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    required: true
    minlength: 6,
  },
  photoURL: {
    type: String,
    default:
      "https://firebasestorage.googleapis.com/v0/b/social-app-834ec.appspot.com/o/Screenshot_2025-04-26_200917-removebg-preview.png?alt=media&token=ed309263-af79-4a99-bba1-13ee7ff0fa4a",
  },
  // createdAt: { type: Date, default: Date.now },
  // lastLoginAt: Date,
  preferences: {
    favoriteGenres: { type: [String], default: [] },
    adultContent: { type: Boolean, default: false },
  },
  movies: {
    favorites: { type: [Number], default: [] },
    watchlist: [
      {
        tmdbId: { type: Number, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    watched: [
      {
        tmdbId: { type: Number, required: true },
        rating: Number,
        watchedAt: { type: Date, default: Date.now },
      },
    ],
  },
});

module.exports = mongoose.model("User", UserSchema);
