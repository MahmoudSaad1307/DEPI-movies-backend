const pool = require("../db/pool");

// Shape a DB row into the original Mongoose UserList response shape
function rowToUserList(row) {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || null,
    movies: row.movies || [],
  };
}

async function findByUserId(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM user_lists WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows.map(rowToUserList);
}

async function findOne({ id, userId }) {
  const { rows } = await pool.query(
    "SELECT * FROM user_lists WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return rows[0] ? rowToUserList(rows[0]) : null;
}

async function createList({ userId, title, description, movies }) {
  const { rows } = await pool.query(
    `INSERT INTO user_lists (user_id, title, description, movies)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, description || null, movies || []]
  );
  return rowToUserList(rows[0]);
}

async function deleteOne({ id, userId }) {
  const { rows } = await pool.query(
    "DELETE FROM user_lists WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, userId]
  );
  return rows[0] ? rowToUserList(rows[0]) : null;
}

async function updateMovies(id, movies) {
  const { rows } = await pool.query(
    "UPDATE user_lists SET movies = $1 WHERE id = $2 RETURNING *",
    [movies, id]
  );
  return rows[0] ? rowToUserList(rows[0]) : null;
}

module.exports = { findByUserId, findOne, createList, deleteOne, updateMovies };
