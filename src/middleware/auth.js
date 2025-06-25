const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No valid token provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. User not found.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Account is deactivated.'
        });
      }

      // Add user to request object
      req.user = user;
      next();
      
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Token has expired.'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token.'
      });
    }
    
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.'
    });
  }
};

// Middleware to check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Middleware to check if user has specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not authenticated.'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Missing permission: ${permission}`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (jwtError) {
      // Log error but don't fail request
      logger.warn('Optional auth failed:', jwtError.message);
    }
    
    next();
    
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue without user
  }
};

// Middleware to check if user owns resource or is admin
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. User not authenticated.'
    });
  }

  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (req.user.role === 'ADMINISTRATOR' || req.user.userId === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Access denied. You can only access your own resources.'
  });
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.userId,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.userId,
    tokenType: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = (req, res, next) => {
  // This would typically use Redis or another store to track attempts
  // For now, we'll implement a simple in-memory store
  if (!global.sensitiveOpAttempts) {
    global.sensitiveOpAttempts = new Map();
  }

  const key = `${req.ip}:${req.user?.userId || 'anonymous'}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempts = global.sensitiveOpAttempts.get(key) || [];
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      error: 'Too many attempts. Please try again later.'
    });
  }

  recentAttempts.push(now);
  global.sensitiveOpAttempts.set(key, recentAttempts);

  next();
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  optionalAuth,
  ownerOrAdmin,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  sensitiveOperationLimiter
};