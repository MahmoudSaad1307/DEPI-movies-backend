const express = require("express");
const router = express.Router();
const { findByUserId, findByMovieId, createReview } = require("../models/Review");
const { findById: findUserById } = require("../models/User");
const verifyToken = require("../auth");

// GET /user/:userId — all reviews by a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedId = parseInt(userId, 10);
    if (!userId || isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const user = await findUserById(parsedId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const reviews = await findByUserId(parsedId);
    res.json(reviews);
  } catch (error) {
    console.error("Error in GET /user/:userId:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// POST /:type — create a review (movie or tv)
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
    const review = await createReview({
      userId: req.user.id,
      movieId: normalizedMovieId,
      content,
      isMovie,
    });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /:type/:movieId — all reviews for a movie/show
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
  const reviews = await findByMovieId(normalizedMovieId, isMovie);
  res.json(reviews);
});

module.exports = router;
