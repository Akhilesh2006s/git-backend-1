const jwt = require('jsonwebtoken');
const Faculty = require('../models/Faculty');

exports.facultyAuth = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Find faculty
    const faculty = await Faculty.findOne({
      _id: decoded.id,
      'tokens.token': token
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // 4. Attach faculty and token to request
    req.token = token;
    req.user = faculty;
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};