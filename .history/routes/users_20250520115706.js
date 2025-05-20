const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../auth");


  
router.post("/google-login", async (req, res) => {
  const { idToken, email, displayName, uid, photoURL } = req.body;
  
  try {
    // Verify the token here if needed using Firebase Admin SDK
    // In a production app, you should validate the token server-side
    
    // Check if user exists in your MongoDB database
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user in your MongoDB database
      user = new User({
        name: displayName,
        email: email,
        googleId: uid,
        photoURL: photoURL || "",
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
    
    // Create JWT token for your app using your existing method
    const token = jwt.sign({ id: user._id }, "your_jwt_secret_key", {
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    const saved = await user.save();

    // Create token
    const token = jwt.sign({ id: saved._id }, "your_jwt_secret_key", {
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

router.put("/update", verifyToken,async (req, res) => {
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
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Errr" });
  }
});
router.get("/findUser/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
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
router.patch("/favorites",verifyToken, async (req, res) => {
  try {
    // const userId = req.params.id;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.movies.favorites.includes(movieId)) {
      user.movies.favorites.push(movieId);
      await user.save();
      return res.json({ success: true, favorites: user.movies.favorites });
    } else {
      const updatedMovies = user.movies.favorites.filter((e) => e !== movieId);

      user.movies.favorites = updatedMovies;

      await user.save();
      return res.json({ success: true, favorites: user.movies.favorites });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.patch("/watchList", verifyToken,async (req, res) => {
  try {
    // const userId = req.params.id;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.movies.watchlist.some((movie) => movie.movieId === movieId)) {
      user.movies.watchlist = user.movies.watchlist.filter(
        (movie) => movie.movieId !== movieId
      );
      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });
    } else {
      // user.movies.watchlist=[{}]

      user.movies.watchlist.push({ movieId });
      await user.save();
      return res.json({ success: true, watchlist: user.movies.watchlist });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/watched", verifyToken,async (req, res) => {
  try {
    // const userId = req.params.id;
    const { movieId, rating, ratingProvided = false } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: "movieId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const currentMovie = user.movies.watched.find(
      (movie) => movie.movieId == movieId
    );
    // const currentRate=currentMovie.rating;
    if (
      user.movies.watched.some((movie) => movie.movieId === movieId) &&
      !ratingProvided
    ) {
      user.movies.watched = user.movies.watched.filter(
        (movie) => movie.movieId !== movieId
      );
      await user.save();
      return res.json({ success: true, watched: user.movies.watched });
    } else {
      user.movies.watched = user.movies.watched.filter(
        (movie) => movie.movieId !== movieId
      );
      user.movies.watched.push({ movieId, rating, ratingProvided });
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
