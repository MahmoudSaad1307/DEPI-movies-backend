const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

/*************  ✨ Windsurf Command 🌟  *************/
  // Extract the token from the Authorization header by splitting the string
  // on spaces and taking the second element of the resulting array
  const token = authHeader.split(' ')[1];

/*******  69bdbeea-e953-4a90-908b-1839fe20c167  *******/

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = verifyToken;
