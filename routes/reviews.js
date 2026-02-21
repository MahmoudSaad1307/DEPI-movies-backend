const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const User = require("../models/User");
const mongoose = require("mongoose");
const verifyToken = require("../auth");
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const reviews = await Review.find({ userId });
    res.json(reviews);
  } catch (error) {
    console.error('Error in POST /myReviews:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.post("/:type", verifyToken, async (req, res) => {
  const { movieId, content } = req.body;
  const { type } = req.params;
  const isMovie = type === "movie";
  if (type !== "movie" && type !== "tv") {
    return res.status(400).json({ error: "Invalid type" });
  }
  const normalizedMovieId = Number(movieId);
  if (!movieId || Number.isNaN(normalizedMovieId)) {
    return res.status(400).json({ error: "movieId is required" });
  }
  try {
    const review = new Review({
      userId: req.user.id,
      movieId: normalizedMovieId,
      content,
      isMovie,
    });
    const saved = await review.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:type/:movieId", async (req, res) => {
  const { type, movieId } = req.params;
  const isMovie = type === "movie";
  if (type !== "movie" && type !== "tv") {
    return res.status(400).json({ error: "Invalid type" });
  }
  const normalizedMovieId = Number(movieId);
  if (!movieId || Number.isNaN(normalizedMovieId)) {
    return res.status(400).json({ error: "movieId is required" });
  }
  const reviews = await Review.find({ movieId: normalizedMovieId, isMovie });
  res.json(reviews);
});

module.exports = router;
