const express = require("express");
const router = express.Router();
const UserList = require("../models/UserList");
const verifyToken = require("../auth");
// const jwt = require('jsonwebtoken');
// const verifyToken = require('../auth');

router.post("/", verifyToken, async (req, res) => {
  const { title, movies, description } = req.body;
  try {
    if ( !title) {
      return res.status(400).json({ error: "title, are required" });
    }

    const newList = new UserList({
      userId: req.user.id,
      title,
      movies,
      description,
    });

    const savedList = await newList.save();
    res.json(savedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/my-lists/", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }

    const lists = await UserList.find({ userId });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
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


router.put("/:id", async (req, res) => {
  try {
    const { movieId, action } = req.body;

    // Validate required fields
    if (  !movieId || !action) {
      return res
        .status(400)
        .json({ error: "UserId, movieId, and action are required" });
    }

    // Validate that the action is either 'add' or 'remove'
    if (action !== "add" && action !== "remove") {
      return res
        .status(400)
        .json({ error: 'Action must be either "add" or "remove"' });
    }

    // Find the user's list by the list ID and userId
    const list = await UserList.findOne({ _id: req.params.id, userId: req.user.id });
    if (!list) {
      return res
        .status(404)
        .json({ error: "List not found or not authorized" });
    }

    if (action === "add") {
      if (!list.movies.includes(movieId)) {
        list.movies.push(movieId); 
      } else {
        return res.status(400).json({ error: "Movie already in the list" });
      }
    }

    if (action === "remove") {
      const movieIndex = list.movies.indexOf(movieId);
      if (movieIndex !== -1) {
        list.movies.splice(movieIndex, 1); 
      } else {
        return res.status(400).json({ error: "Movie not found in the list" });
      }
    }

    // Save the updated list
    const updatedList = await list.save();
    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



module.exports = router;
