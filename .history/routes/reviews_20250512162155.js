const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const User = require("../models/User");
const mongoose = require("mongoose"); // Add this line
const verifyToken = require("../auth");
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch reviews
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

router.post("/:type", verifyToken,async (req, res) => {
  const { movieId,content } = req.body;
  const {type}=req.params;
  const isMovie=type=='movie';
  // const {text}=content;
  try {
    const review = new Review({req.user.id,movieId,content,isMovie});
    const saved = await review.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:type/:movieId", async (req, res) => {
  const { type,movieId } = req.params;
  const isMovie=type=='movie';
  const reviews = await Review.find({ movieId:movieId,isMovie });
  res.json(reviews);
});

module.exports = router;
