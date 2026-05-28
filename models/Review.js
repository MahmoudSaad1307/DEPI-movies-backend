const pool = require("../db/pool");

// Shape a DB row into the original Mongoose Review response shape
function rowToReview(row) {
  if (!row) return null;
  return {
    _id: row.id,
    isMovie: row.is_movie,
    movieId: row.movie_id,
    userId: row.user_id,
    content: {
      text: row.text || null,
      spoilerAlert: row.spoiler_alert || false,
    },
    stats: {
      likes: row.likes || 0,
    },
    timestamps: {
      createdAt: row.created_at,
    },
  };
}

async function findByUserId(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows.map(rowToReview);
}

async function findByMovieId(movieId, isMovie) {
  const { rows } = await pool.query(
    "SELECT * FROM reviews WHERE movie_id = $1 AND is_movie = $2 ORDER BY created_at DESC",
    [movieId, isMovie]
  );
  return rows.map(rowToReview);
}

async function createReview({ userId, movieId, content, isMovie }) {
  const text = content ? content.text || null : null;
  const spoilerAlert = content ? content.spoilerAlert || false : false;
  const { rows } = await pool.query(
    `INSERT INTO reviews (user_id, movie_id, is_movie, text, spoiler_alert)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, movieId, isMovie, text, spoilerAlert]
  );
  return rowToReview(rows[0]);
}

module.exports = { findByUserId, findByMovieId, createReview };
