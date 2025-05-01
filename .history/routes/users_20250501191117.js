const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../auth");

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    const saved = await user.save();

    const userWithoutPassword = saved.toObject();
    delete userWithoutPassword.password;

    res.json(userWithoutPassword);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, "your_jwt_secret_key", {
      expiresIn: "7d",
    });
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ token, userWithoutPassword });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Prevent updating sensitive fields like _id or password here (optional)
    if (updates._id || updates.password) {
      return res
        .status(400)
        .json({ error: "Cannot update _id or password via this route." });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update only provided fields
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
    const users = await User.find();
    res.json(users);
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
router.patch("/:id/favorites", async (req, res) => {
  try {
    const userId = req.params.id;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.movies.favorites.includes(movieId)) {
      user.movies.favorites.push(movieId);
      await user.save();
      return res.json({ success: true, favorites: user.movies.favorites });
    } else {
const updatedMovies=user.movies.favorites.filter();

      user.movies.favorites.remove(movieId);

      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });    }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch("/:id/watchList", async (req, res) => {
  try {
    const userId = req.params.id;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.movies.watchlist.includes(movieId)) {
      user.movies.watchlist.push(movieId);
      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });
    } else {
      user.movies.watchlist.push(movieId);

      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });    }
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
