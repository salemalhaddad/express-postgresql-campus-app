const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, authorize, ownerOrAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('ADMINISTRATOR'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['STUDENT', 'FACULTY', 'STAFF', 'ADMINISTRATOR', 'VISITOR']),
  query('search').optional().isLength({ max: 100 }),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filters = {
      limit,
      offset,
      role: req.query.role,
      search: req.query.search,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
    };

    const [users, total] = await Promise.all([
      User.findAll(filters),
      User.count(filters)
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:userId', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user
router.put('/:userId', authenticate, ownerOrAdmin, [
  body('firstName').optional().isLength({ min: 1, max: 100 }).trim(),
  body('lastName').optional().isLength({ min: 1, max: 100 }).trim(),
  body('username').optional().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/),
  body('role').optional().isIn(['STUDENT', 'FACULTY', 'STAFF', 'ADMINISTRATOR', 'VISITOR']),
  body('isActive').optional().isBoolean(),
  body('studentId').optional().isLength({ max: 20 }),
  body('employeeId').optional().isLength({ max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Only admins can change role and isActive
    if (req.user.role !== 'ADMINISTRATOR') {
      delete req.body.role;
      delete req.body.isActive;
    }

    // Check if email/username are available if being updated
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use'
        });
      }
    }

    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken'
        });
      }
    }

    await user.update(req.body);

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete user (soft delete)
router.delete('/:userId', authenticate, authorize('ADMINISTRATOR'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user.userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    await user.delete();

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user bookings
router.get('/:userId/bookings', authenticate, ownerOrAdmin, [
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 50
    };

    const bookings = await user.getBookings(filters);

    res.json({
      success: true,
      data: {
        bookings
      }
    });

  } catch (error) {
    logger.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user booking statistics
router.get('/:userId/stats', authenticate, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const stats = await user.getBookingStats();

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;