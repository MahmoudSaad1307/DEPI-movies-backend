const express = require("express");
const router = express.Router();
const {
  findByUserId,
  findOne,
  createList,
  deleteOne,
  updateMovies,
} = require("../models/UserList");
const verifyToken = require("../auth");

// Parse and validate a positive integer ID from route params
function parseId(id) {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

// POST / — create a new list
router.post("/", verifyToken, async (req, res) => {
  const { title, movies, description } = req.body;
  try {
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const newList = await createList({
      userId: req.user.id,
      title,
      movies: Array.isArray(movies)
        ? movies.map(Number).filter((id) => !Number.isNaN(id))
        : [],
      description,
    });

    res.json(newList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /my-lists/ — get all lists for the logged-in user
router.get("/my-lists/", verifyToken, async (req, res) => {
  try {
    const lists = await findByUserId(req.user.id);
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — delete a list (must be owner)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const listId = parseId(req.params.id);
    if (!listId) {
      return res.status(400).json({ error: "Invalid list id" });
    }

    const deletedList = await deleteOne({ id: listId, userId: req.user.id });
    if (!deletedList) {
      return res
        .status(404)
        .json({ error: "List not found or not authorized" });
    }

    res.json({ message: "List deleted successfully", deletedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — add or remove a movie from a list
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

    const listId = parseId(req.params.id);
    if (!listId) {
      return res.status(400).json({ error: "Invalid list id" });
    }

    const list = await findOne({ id: listId, userId: req.user.id });
    if (!list) {
      return res
        .status(404)
        .json({ error: "List not found or not authorized" });
    }

    const movies = [...list.movies];

    if (action === "add") {
      if (!movies.includes(normalizedMovieId)) {
        movies.push(normalizedMovieId);
      } else {
        return res.status(400).json({ error: "Movie already in the list" });
      }
    }

    if (action === "remove") {
      const idx = movies.indexOf(normalizedMovieId);
      if (idx !== -1) {
        movies.splice(idx, 1);
      } else {
        return res.status(400).json({ error: "Movie not found in the list" });
      }
    }

    const updatedList = await updateMovies(listId, movies);
    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
