const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Building = require('../models/Building');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all buildings
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ max: 100 }),
  query('isAccessible').optional().isBoolean()
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
      search: req.query.search,
      isAccessible: req.query.isAccessible !== undefined ? req.query.isAccessible === 'true' : undefined
    };

    const [buildings, total] = await Promise.all([
      Building.findAll(filters),
      Building.count(filters)
    ]);

    res.json({
      success: true,
      data: buildings.map(building => building.toJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get buildings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Search buildings
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required')
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
    const buildings = await Building.search(searchTerm);

    res.json({
      success: true,
      data: buildings
    });

  } catch (error) {
    logger.error('Search buildings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get building by ID
router.get('/:buildingId', optionalAuth, async (req, res) => {
  try {
    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    res.json({
      success: true,
      data: building.toJSON()
    });

  } catch (error) {
    logger.error('Get building error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new building (admin only)
router.post('/', authenticate, authorize('ADMINISTRATOR'), [
  body('code').isLength({ min: 1, max: 10 }).withMessage('Building code is required (max 10 characters)'),
  body('name').isLength({ min: 1, max: 255 }).withMessage('Building name is required (max 255 characters)'),
  body('address').optional().isLength({ max: 500 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('floors').optional().isInt({ min: 1 }),
  body('isAccessible').optional().isBoolean(),
  body('description').optional().isLength({ max: 1000 }),
  body('operatingHours').optional().isJSON()
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

    // Check if building code already exists
    const existingBuilding = await Building.findByCode(req.body.code);
    if (existingBuilding) {
      return res.status(400).json({
        success: false,
        error: 'Building with this code already exists'
      });
    }

    const building = await Building.create(req.body);

    logger.info(`Building created: ${building.code} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building.toJSON()
    });

  } catch (error) {
    logger.error('Create building error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update building (admin only)
router.put('/:buildingId', authenticate, authorize('ADMINISTRATOR'), [
  body('code').optional().isLength({ min: 1, max: 10 }),
  body('name').optional().isLength({ min: 1, max: 255 }),
  body('address').optional().isLength({ max: 500 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('floors').optional().isInt({ min: 1 }),
  body('isAccessible').optional().isBoolean(),
  body('description').optional().isLength({ max: 1000 }),
  body('operatingHours').optional().isJSON()
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

    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    // Check if new code is available if being updated
    if (req.body.code && req.body.code !== building.code) {
      const existingBuilding = await Building.findByCode(req.body.code);
      if (existingBuilding) {
        return res.status(400).json({
          success: false,
          error: 'Building code is already in use'
        });
      }
    }

    await building.update(req.body);

    logger.info(`Building updated: ${building.code} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Building updated successfully',
      data: building.toJSON()
    });

  } catch (error) {
    logger.error('Update building error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete building (admin only)
router.delete('/:buildingId', authenticate, authorize('ADMINISTRATOR'), async (req, res) => {
  try {
    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    await building.delete();

    logger.info(`Building deleted: ${building.code} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Building deleted successfully'
    });

  } catch (error) {
    logger.error('Delete building error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get building rooms
router.get('/:buildingId/rooms', optionalAuth, [
  query('type').optional().isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  query('floor').optional().isInt({ min: 1 }),
  query('minCapacity').optional().isInt({ min: 1 }),
  query('isAccessible').optional().isBoolean(),
  query('isBookable').optional().isBoolean(),
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

    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    const filters = {
      type: req.query.type,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
      minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity) : undefined,
      isAccessible: req.query.isAccessible !== undefined ? req.query.isAccessible === 'true' : undefined,
      isBookable: req.query.isBookable !== undefined ? req.query.isBookable === 'true' : undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined
    };

    const rooms = await building.getRooms(filters);

    res.json({
      success: true,
      data: rooms
    });

  } catch (error) {
    logger.error('Get building rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get available rooms in building
router.get('/:buildingId/rooms/available', optionalAuth, [
  query('startTime').isISO8601().withMessage('Start time is required'),
  query('endTime').isISO8601().withMessage('End time is required'),
  query('type').optional().isIn(['STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM']),
  query('floor').optional().isInt({ min: 1 }),
  query('minCapacity').optional().isInt({ min: 1 }),
  query('isAccessible').optional().isBoolean()
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

    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
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

    const filters = {
      type: req.query.type,
      floor: req.query.floor ? parseInt(req.query.floor) : undefined,
      minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity) : undefined,
      isAccessible: req.query.isAccessible !== undefined ? req.query.isAccessible === 'true' : undefined
    };

    const rooms = await building.getAvailableRooms(startTime, endTime, filters);

    res.json({
      success: true,
      data: rooms
    });

  } catch (error) {
    logger.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get building entrances
router.get('/:buildingId/entrances', optionalAuth, async (req, res) => {
  try {
    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    const entrances = await building.getEntrances();

    res.json({
      success: true,
      data: entrances
    });

  } catch (error) {
    logger.error('Get building entrances error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add building entrance (admin only)
router.post('/:buildingId/entrances', authenticate, authorize('ADMINISTRATOR'), [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Entrance name is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('floor').optional().isInt({ min: 1 }),
  body('isAccessible').optional().isBoolean(),
  body('isMain').optional().isBoolean(),
  body('operatingHours').optional().isJSON()
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

    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    const entrance = await building.addEntrance(req.body);

    logger.info(`Entrance added to building ${building.code} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Entrance added successfully',
      data: entrance
    });

  } catch (error) {
    logger.error('Add entrance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get building utilization stats (admin/faculty/staff only)
router.get('/:buildingId/stats', authenticate, authorize('ADMINISTRATOR', 'FACULTY', 'STAFF'), [
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

    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({
        success: false,
        error: 'Building not found'
      });
    }

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    const stats = await building.getUtilizationStats(startDate, endDate);

    res.json({
      success: true,
      data: {
        building: building.toJSON(),
        stats,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Get building stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;