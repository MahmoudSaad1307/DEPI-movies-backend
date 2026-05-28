const express = require("express");
const multer = require("multer");
const { uploadBuffer } = require("../lib/cloudinary");

// Accept image files only, max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});
const router = express.Router();
const {
  findByEmail,
  findById,
  findAll,
  createUser,
  updateUser,
  toggleFavorite,
  updateWatchlist,
  updateWatched,
} = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../auth");

const JWT_SECRET = process.env.JWT_SECRET;

// Strip password from user object before sending to client
function withoutPassword(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

// POST /google-login
router.post("/google-login", async (req, res) => {
  const { email, displayName, uid, photoURL } = req.body;
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "JWT secret is not set" });
  }
  if (!email || !uid || !displayName) {
    return res.status(400).json({ error: "name, email, and uid are required" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    let user = await findByEmail(normalizedEmail);

    if (!user) {
      user = await createUser({
        name: displayName,
        email: normalizedEmail,
        googleId: uid,
        photoURL,
      });
    } else if (!user.googleId) {
      // Link existing email/password account with Google
      const updates = { google_id: uid };
      if (!user.photoURL && photoURL) updates.photo_url = photoURL;
      user = await updateUser(user._id, updates);
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: withoutPassword(user) });
  } catch (err) {
    console.error("Google authentication error:", err);
    res.status(400).json({ error: err.message || "Authentication failed" });
  }
});

// POST /register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret is not set" });
    }
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email, and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password too short" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: withoutPassword(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret is not set" });
    }
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password are required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await findByEmail(normalizedEmail);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    const userWithoutPassword = withoutPassword(user);
    // Note: keeping original response key "userWithoutPassword" for frontend compatibility
    res.json({ token, userWithoutPassword });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /update
router.put("/update", verifyToken, async (req, res) => {
  try {
    const updates = req.body;

    if (updates._id || updates.id || updates.password) {
      return res
        .status(400)
        .json({ error: "Cannot update _id or password via this route." });
    }

    // Map camelCase body fields to snake_case DB columns
    const columns = {};
    if (updates.name !== undefined) columns.name = updates.name;
    if (updates.bio !== undefined) columns.bio = updates.bio;
    if (updates.photoURL !== undefined) columns.photo_url = updates.photoURL;
    if (updates.googleId !== undefined) columns.google_id = updates.googleId;
    if (updates.preferences !== undefined) {
      if (updates.preferences.favoriteGenres !== undefined) {
        columns.fav_genres = updates.preferences.favoriteGenres;
      }
      if (updates.preferences.adultContent !== undefined) {
        columns.adult_content = updates.preferences.adultContent;
      }
    }

    const updatedUser = await updateUser(req.user.id, columns);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json(withoutPassword(updatedUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — all users (no passwords)
router.get("/", async (req, res) => {
  try {
    const users = await findAll();
    res.json(users.map(withoutPassword));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /findUser/:userId
router.get("/findUser/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const parsedId = parseInt(userId, 10);
    if (!userId || isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    const user = await findById(parsedId);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Return only the fields the original .select("name photoURL movies") returned
    res.json({
      _id: user._id,
      name: user.name,
      photoURL: user.photoURL,
      movies: user.movies,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(withoutPassword(user));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /favorites — toggle movie in/out of favorites
router.patch("/favorites", verifyToken, async (req, res) => {
  try {
    const { movieId } = req.body;
    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId)) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const favorites = await toggleFavorite(req.user.id, normalizedMovieId);
    return res.json({ success: true, favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /watchList — toggle movie in/out of watchlist
router.patch("/watchList", verifyToken, async (req, res) => {
  try {
    const { movieId } = req.body;
    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId)) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let watchlist = user.movies.watchlist;
    if (watchlist.some((m) => m.movieId === normalizedMovieId)) {
      watchlist = watchlist.filter((m) => m.movieId !== normalizedMovieId);
    } else {
      watchlist.push({
        movieId: normalizedMovieId,
        addedAt: new Date().toISOString(),
      });
    }

    const updated = await updateWatchlist(req.user.id, watchlist);
    return res.json({ success: true, watchlist: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /watched — toggle/update watched entry
router.patch("/watched", verifyToken, async (req, res) => {
  try {
    const { movieId, rating, ratingProvided = false } = req.body;
    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId)) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let watched = user.movies.watched;
    const alreadyWatched = watched.some(
      (m) => m.movieId === normalizedMovieId
    );

    if (alreadyWatched && !ratingProvided) {
      // Remove from watched
      watched = watched.filter((m) => m.movieId !== normalizedMovieId);
    } else {
      // Remove old entry and add/update with new data
      watched = watched.filter((m) => m.movieId !== normalizedMovieId);
      watched.push({
        movieId: normalizedMovieId,
        rating,
        ratingProvided,
        watchedAt: new Date().toISOString(),
      });
    }

    const updated = await updateWatched(req.user.id, watched);
    return res.json({ success: true, watched: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /upload-photo — upload profile photo to Cloudinary, return URL
router.post("/upload-photo", verifyToken, upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const publicId = `profile_photos/user_${req.user.id}_${Date.now()}`;
    const url = await uploadBuffer(req.file.buffer, "profile_photos", publicId);
    res.json({ url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Photo upload failed", details: err.message });
  }
});

module.exports = router;
