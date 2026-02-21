const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../auth");

const JWT_SECRET = process.env.JWT_SECRET;

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
    // Verify the token here if needed using Firebase Admin SDK
    // In a production app, you should validate the token server-side

    // Check if user exists in your MongoDB database
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create a new user in your MongoDB database
      user = new User({
        name: displayName,
        email: normalizedEmail,
        googleId: uid,
        photoURL: photoURL,
        // Set other fields as needed
      });
      await user.save();
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId (they previously registered with email/password)
      // Link their account with Google
      user.googleId = uid;
      if (!user.profilePicture && photoURL) {
        user.profilePicture = photoURL;
      }
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data and token
    const userWithoutPassword = user.toObject();
    if (userWithoutPassword.password) delete userWithoutPassword.password;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Google authentication error:", err);
    res.status(400).json({ error: err.message || "Authentication failed" });
  }
});

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
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });
    const saved = await user.save();

    // Create token
    const token = jwt.sign({ id: saved._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password before sending user data
    const userWithoutPassword = saved.toObject();
    delete userWithoutPassword.password;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret is not set" });
    }
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ token, userWithoutPassword });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/update", verifyToken, async (req, res) => {
  try {
    const updates = req.body;

    if (updates._id || updates.password) {
      return res
        .status(400)
        .json({ error: "Cannot update _id or password via this route." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    Object.keys(updates).forEach((key) => {
      if (key in user) {
        user[key] = updates[key];
      }
    });

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Errr" });
  }
});
router.get("/findUser/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }
    const user = await User.findById(userId).select("name photoURL movies");
    res.json(user);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Errr" });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.patch("/favorites", verifyToken, async (req, res) => {
  try {
    const { movieId } = req.body;

    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId)) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.movies.favorites.includes(normalizedMovieId)) {
      user.movies.favorites.push(normalizedMovieId);
      await user.save();
      return res.json({ success: true, favorites: user.movies.favorites });
    } else {
      const updatedMovies = user.movies.favorites.filter(
        (e) => e !== normalizedMovieId,
      );

      user.movies.favorites = updatedMovies;

      await user.save();
      return res.json({ success: true, favorites: user.movies.favorites });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch("/watchList", verifyToken, async (req, res) => {
  try {
    const { movieId } = req.body;

    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId)) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      user.movies.watchlist.some((movie) => movie.movieId === normalizedMovieId)
    ) {
      user.movies.watchlist = user.movies.watchlist.filter(
        (movie) => movie.movieId !== normalizedMovieId,
      );
      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });
    } else {
      user.movies.watchlist.push({ movieId: normalizedMovieId });
      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/watched", verifyToken, async (req, res) => {
  try {
    const { movieId, rating, ratingProvided = false } = req.body;

    const normalizedMovieId = Number(movieId);
    if (!movieId || Number.isNaN(normalizedMovieId)) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const currentMovie = user.movies.watched.find(
      (movie) => movie.movieId == normalizedMovieId,
    );
    if (
      user.movies.watched.some(
        (movie) => movie.movieId === normalizedMovieId,
      ) &&
      !ratingProvided
    ) {
      user.movies.watched = user.movies.watched.filter(
        (movie) => movie.movieId !== normalizedMovieId,
      );
      await user.save();
      return res.json({ success: true, watched: user.movies.watched });
    } else {
      user.movies.watched = user.movies.watched.filter(
        (movie) => movie.movieId !== normalizedMovieId,
      );
      user.movies.watched.push({
        movieId: normalizedMovieId,
        rating,
        ratingProvided,
      });
      await user.save();
      return res.json({ success: true, watched: user.movies.watched });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// router.patch("/:id/favorites", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const { movieId } = req.body;

//     if (!movieId) {
//       return res.status(400).json({ error: "movieId is required" });
//     }

//     const user = await User.findById(userId);

//     if (!user) return res.status(404).json({ error: "User not found" });

//     if (!user.movies.favorites.includes(movieId)) {
//       user.movies.favorites.push(movieId);
//       await user.save();
//       return res.json({ success: true, favorites: user.movies.favorites });
//     } else {
//       return res.status(400).json({ error: "Movie already in favorites" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;
