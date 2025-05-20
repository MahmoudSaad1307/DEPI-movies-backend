const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../auth");


  

  

// CLIENT-SIDE IMPLEMENTATION

// 1. Add this function to your Firebase service file (e.g., firebaseService.js)
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase"; // Your existing Firebase imports

// Google Sign-in function for client-side
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    
    const result = await signInWithPopup(auth, provider);
    
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.idToken;
    const user = result.user;
    
    // Send the token to your backend
    const backendResponse = await sendTokenToBackend(user, token);
    return backendResponse;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Function to send the token to your backend
const sendTokenToBackend = async (firebaseUser, idToken) => {
  try {
    const response = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to authenticate with backend');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Backend authentication error:", error);
    throw error;
  }
};
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
