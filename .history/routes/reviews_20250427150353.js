const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

router.post('/', async (req, res) => {
  try {
    const review = new Review(req.body);
    const saved = await review.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/movie/:movieId', async (req, res) => {
  const {movieId }=req.params;
  const reviews = await Review.find().populate('userId');
  res.json(reviews);
});

module.exports = router;