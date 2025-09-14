const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    
    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }
    
    req.user = {
      id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      avatarColor: currentUser.avatarColor
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};