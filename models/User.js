const pool = require("../db/pool");

// Fallback avatar — uses UI Avatars (free, no auth required)
// Generates a letter-based avatar from the user's name
function getDefaultPhoto(name) {
  const encoded = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${encoded}&background=1a1a2e&color=00bcd4&size=200&bold=true`;
}

const DEFAULT_PHOTO = getDefaultPhoto("User");

// Parse JSONB column safely (pg auto-parses, but be defensive)
function parseJson(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

// Shape a DB row into the API response object (matches original Mongoose shape)
function rowToUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    googleId: row.google_id || null,
    bio: row.bio || "",
    photoURL: row.photo_url || getDefaultPhoto(row.name),
    preferences: {
      favoriteGenres: row.fav_genres || [],
      adultContent: row.adult_content || false,
    },
    movies: {
      favorites: row.favorites || [],
      watchlist: parseJson(row.watchlist, []),
      watched: parseJson(row.watched, []),
    },
    password: row.password, // stripped before sending in routes
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

async function findById(id) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

async function findAll() {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY id");
  return rows.map(rowToUser);
}

async function createUser({ name, email, password, googleId, photoURL }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, google_id, photo_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, email, password || null, googleId || null, photoURL || null]
  );
  return rowToUser(rows[0]);
}

// Update arbitrary DB columns by user id (keys must be valid column names)
async function updateUser(id, columns) {
  const keys = Object.keys(columns);
  if (keys.length === 0) return findById(id);
  const values = keys.map((k) => columns[k]);
  const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

// Toggle a movieId in the favorites INTEGER[] column
async function toggleFavorite(userId, movieId) {
  const { rows: [check] } = await pool.query(
    "SELECT ($1 = ANY(favorites)) AS \"inFav\" FROM users WHERE id = $2",
    [movieId, userId]
  );
  if (!check) throw new Error("User not found");

  if (check.inFav) {
    const { rows } = await pool.query(
      "UPDATE users SET favorites = array_remove(favorites, $1) WHERE id = $2 RETURNING favorites",
      [movieId, userId]
    );
    return rows[0].favorites;
  } else {
    const { rows } = await pool.query(
      "UPDATE users SET favorites = array_append(favorites, $1) WHERE id = $2 RETURNING favorites",
      [movieId, userId]
    );
    return rows[0].favorites;
  }
}

// Overwrite the watchlist JSONB column
async function updateWatchlist(userId, watchlist) {
  const { rows } = await pool.query(
    "UPDATE users SET watchlist = $1 WHERE id = $2 RETURNING watchlist",
    [JSON.stringify(watchlist), userId]
  );
  return parseJson(rows[0].watchlist, []);
}

// Overwrite the watched JSONB column
async function updateWatched(userId, watched) {
  const { rows } = await pool.query(
    "UPDATE users SET watched = $1 WHERE id = $2 RETURNING watched",
    [JSON.stringify(watched), userId]
  );
  return parseJson(rows[0].watched, []);
}

module.exports = {
  findByEmail,
  findById,
  findAll,
  createUser,
  updateUser,
  toggleFavorite,
  updateWatchlist,
  updateWatched,
};
