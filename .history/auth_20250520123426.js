const jwt = require('jsonwebtoken');

 const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];


  try {
    const decoded = jwt.verify(token, 'your_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Authenticate the user by verifying the token in the Authorization header
 * and finding the user in the database.
 * @function authenticateUser
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
/*******  246979b4-34f0-4d03-8b6b-e550b279c7af  *******/const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, 'your_jwt_secret_key');
    
    // Find user by id
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Add user to request object
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};


module.exports = verifyToken;
