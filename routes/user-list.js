const express = require("express");
const router = express.Router();
const UserList = require("../models/UserList");
const verifyToken = require("../auth");
const mongoose = require("mongoose");
// const jwt = require('jsonwebtoken');
// const verifyToken = require('../auth');

router.post("/", verifyToken, async (req, res) => {
  const { title, movies, description } = req.body;
  try {
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const newList = new UserList({
      userId: req.user.id,
      title,
      movies: Array.isArray(movies) ? movies.map(Number).filter((id) => !Number.isNaN(id)) : [],
      description,
    });

    const savedList = await newList.save();
    res.json(savedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/my-lists/", verifyToken, async (req, res) => {
  try {
    const lists = await UserList.find({ userId: req.user.id });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid list id" });
    }
    const deletedList = await UserList.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedList) {
      return res.status(404).json({ error: "List not found or not authorized" });
    }

    res.json({ message: "List deleted successfully", deletedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { movieId, action } = req.body;

    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId) || !action) {
      return res
        .status(400)
        .json({ error: "UserId, movieId, and action are required" });
    }

    if (action !== "add" && action !== "remove") {
      return res
        .status(400)
        .json({ error: 'Action must be either "add" or "remove"' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid list id" });
    }
    const list = await UserList.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!list) {
      return res
        .status(404)
        .json({ error: "List not found or not authorized" });
    }

    if (action === "add") {
      if (!list.movies.includes(normalizedMovieId)) {
        list.movies.push(normalizedMovieId);
      } else {
        return res.status(400).json({ error: "Movie already in the list" });
      }
    }

    if (action === "remove") {
      const movieIndex = list.movies.indexOf(normalizedMovieId);
      if (movieIndex !== -1) {
        list.movies.splice(movieIndex, 1);
      } else {
        return res.status(400).json({ error: "Movie not found in the list" });
      }
    }

    const updatedList = await list.save();
    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



module.exports = router;
