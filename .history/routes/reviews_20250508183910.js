const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const User = require("../models/User");

router.post("/:type", async (req, res) => {
  const { userId, movieId,content } = req.body;
  const {type}=req.params;
  const isMovie=type=='movie';
  // const {text}=content;
  try {
    const review = new Review({userId,movieId,content,isMovie});
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
router.post("/myReviews", async (req, res) => {
  console.log("sd");
  res.json('')
  
  try {
    const { userId } = req.body;

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

module.exports = router;
