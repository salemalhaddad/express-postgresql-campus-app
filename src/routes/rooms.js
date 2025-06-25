const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Room = require('../models/Room');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all rooms
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('buildingId').optional().isUUID(),
  query('type').optional().isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  query('floor').optional().isInt({ min: 1 }),
  query('minCapacity').optional().isInt({ min: 1 }),
  query('maxCapacity').optional().isInt({ min: 1 }),
  query('isAccessible').optional().isBoolean(),
  query('isBookable').optional().isBoolean(),
  query('isActive').optional().isBoolean(),
  query('search').optional().isLength({ max: 100 })
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
      buildingId: req.query.buildingId,
      type: req.query.type,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
      minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity) : undefined,
      maxCapacity: req.query.maxCapacity ? parseInt(req.query.maxCapacity) : undefined,
      isAccessible: req.query.isAccessible !== undefined ? req.query.isAccessible === 'true' : undefined,
      isBookable: req.query.isBookable !== undefined ? req.query.isBookable === 'true' : undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: req.query.search
    };

    const [rooms, total] = await Promise.all([
      Room.findAll(filters),
      Room.count(filters)
    ]);

    res.json({
      success: true,
      data: rooms.map(room => room.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Search rooms
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  query('isBookable').optional().isBoolean()
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

    const searchTerm = req.query.q;
    const filters = {
      type: req.query.type,
      isBookable: req.query.isBookable !== undefined ? req.query.isBookable === 'true' : undefined
    };

    const rooms = await Room.search(searchTerm, filters);

    res.json({
      success: true,
      data: rooms.map(room => room.toJSON())
    });

  } catch (error) {
    logger.error('Search rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get available rooms
router.get('/available', optionalAuth, [
  query('startTime').isISO8601().withMessage('Start time is required'),
  query('endTime').isISO8601().withMessage('End time is required'),
  query('buildingId').optional().isUUID(),
  query('type').optional().isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  query('floor').optional().isInt({ min: 1 }),
  query('minCapacity').optional().isInt({ min: 1 }),
  query('isAccessible').optional().isBoolean(),
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

    const startTime = new Date(req.query.startTime);
    const endTime = new Date(req.query.endTime);

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    // Check if start time is in the future
    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be in the future'
      });
    }

    const filters = {
      buildingId: req.query.buildingId,
      type: req.query.type,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
      minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity) : undefined,
      isAccessible: req.query.isAccessible !== undefined ? req.query.isAccessible === 'true' : undefined,
      limit: parseInt(req.query.limit) || 50
    };

    const rooms = await Room.findAvailable(startTime, endTime, filters);

    res.json({
      success: true,
      data: rooms.map(room => room.toJSON()),
      searchCriteria: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        ...filters
      }
    });

  } catch (error) {
    logger.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get room by ID
router.get('/:roomId', optionalAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room.toJSON()
    });

  } catch (error) {
    logger.error('Get room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new room (admin only)
router.post('/', authenticate, authorize('ADMINISTRATOR'), [
  body('buildingId').isUUID().withMessage('Valid building ID is required'),
  body('roomNumber').isLength({ min: 1, max: 20 }).withMessage('Room number is required (max 20 characters)'),
  body('name').optional().isLength({ max: 255 }),
  body('type').isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('floor').optional().isInt({ min: 1 }),
  body('isAccessible').optional().isBoolean(),
  body('description').optional().isLength({ max: 1000 }),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('isBookable').optional().isBoolean(),
  body('isActive').optional().isBoolean()
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

    const room = await Room.create(req.body);

    logger.info(`Room created: ${room.buildingId}-${room.roomNumber} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room.toJSON()
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Room number already exists in this building'
      });
    }
    
    logger.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update room (admin only)
router.put('/:roomId', authenticate, authorize('ADMINISTRATOR'), [
  body('roomNumber').optional().isLength({ min: 1, max: 20 }),
  body('name').optional().isLength({ max: 255 }),
  body('type').optional().isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  body('capacity').optional().isInt({ min: 1 }),
  body('floor').optional().isInt({ min: 1 }),
  body('isAccessible').optional().isBoolean(),
  body('description').optional().isLength({ max: 1000 }),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('isBookable').optional().isBoolean(),
  body('isActive').optional().isBoolean()
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

    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    await room.update(req.body);

    logger.info(`Room updated: ${room.buildingId}-${room.roomNumber} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room.toJSON()
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Room number already exists in this building'
      });
    }
    
    logger.error('Update room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete room (admin only)
router.delete('/:roomId', authenticate, authorize('ADMINISTRATOR'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    await room.delete();

    logger.info(`Room deleted: ${room.buildingId}-${room.roomNumber} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    logger.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Check room availability
router.get('/:roomId/availability', optionalAuth, [
  query('startTime').isISO8601().withMessage('Start time is required'),
  query('endTime').isISO8601().withMessage('End time is required'),
  query('excludeBookingId').optional().isUUID()
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

    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const startTime = new Date(req.query.startTime);
    const endTime = new Date(req.query.endTime);

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    const isAvailable = await room.isAvailable(startTime, endTime, req.query.excludeBookingId);

    res.json({
      success: true,
      data: {
        room: room.toJSON(),
        isAvailable,
        timeSlot: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get room bookings
router.get('/:roomId/bookings', authenticate, [
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

    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'ADMINISTRATOR' && req.user.role !== 'FACULTY' && req.user.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view room bookings'
      });
    }

    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 50
    };

    const bookings = await room.getBookings(filters);

    res.json({
      success: true,
      data: {
        room: room.toJSON(),
        bookings
      }
    });

  } catch (error) {
    logger.error('Get room bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get room equipment
router.get('/:roomId/equipment', optionalAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const equipment = await room.getEquipment();

    res.json({
      success: true,
      data: {
        room: room.toJSON(),
        equipment
      }
    });

  } catch (error) {
    logger.error('Get room equipment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add equipment to room (admin only)
router.post('/:roomId/equipment', authenticate, authorize('ADMINISTRATOR'), [
  body('name').isLength({ min: 1, max: 255 }).withMessage('Equipment name is required'),
  body('type').isLength({ min: 1, max: 100 }).withMessage('Equipment type is required'),
  body('description').optional().isLength({ max: 1000 }),
  body('isWorking').optional().isBoolean()
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

    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const equipment = await room.addEquipment(req.body);

    logger.info(`Equipment added to room ${room.roomNumber} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      data: equipment
    });

  } catch (error) {
    logger.error('Add equipment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get room utilization statistics
router.get('/:roomId/stats', authenticate, authorize('ADMINISTRATOR', 'FACULTY', 'STAFF'), [
  query('startDate').isISO8601().withMessage('Start date is required'),
  query('endDate').isISO8601().withMessage('End date is required')
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

    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    const stats = await room.getUtilizationStats(startDate, endDate);

    res.json({
      success: true,
      data: {
        room: room.toJSON(),
        stats,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Get room stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;