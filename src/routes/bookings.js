const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Building = require('../models/Building');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all bookings for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;
    
    const filters = {};
    if (status) filters.status = status.toUpperCase();
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const bookings = await Booking.findByUser(req.user.userId, filters);

    res.json({
      success: true,
      data: bookings.map(item => ({
        ...item.booking.toJSON(),
        roomNumber: item.room_number,
        roomName: item.room_name,
        roomType: item.room_type,
        buildingName: item.building_name,
        buildingCode: item.building_code
      })),
      meta: {
        count: bookings.length,
        filters
      }
    });
  } catch (error) {
    logger.error('Failed to get user bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bookings'
    });
  }
});

// Get specific booking by ID
router.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await Booking.findById(bookingId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (result.booking.userId !== req.user.userId && req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        ...result.booking.toJSON(),
        user: {
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          username: result.username
        },
        room: {
          roomNumber: result.room_number,
          roomName: result.room_name,
          roomType: result.room_type
        },
        building: {
          buildingName: result.building_name,
          buildingCode: result.building_code
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve booking'
    });
  }
});

// Create new booking
router.post('/',
  authenticate,
  [
    body('roomId').isUUID().withMessage('Valid room ID is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('purpose').trim().isLength({ min: 5, max: 500 }).withMessage('Purpose must be 5-500 characters'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { roomId, startTime, endTime, purpose, notes } = req.body;
      const userId = req.user.userId;

      // Prepare booking data
      const bookingData = {
        userId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose: purpose.trim(),
        notes: notes?.trim() || null
      };

      // Validate booking data
      const validation = await Booking.validateBooking(bookingData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking data',
          details: validation.errors
        });
      }

      // Check if room exists and is bookable
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found'
        });
      }

      if (!room.isBookable || !room.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Room is not available for booking'
        });
      }

      // Check room availability
      const isAvailable = await room.isAvailable(startTime, endTime);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          error: 'Room is not available for the selected time slot'
        });
      }

      // Create the booking
      const booking = await Booking.create(bookingData);

      // Get complete booking data for email
      const bookingDetails = await Booking.findById(booking.bookingId);
      
      // Send confirmation email
      try {
        await emailService.sendBookingConfirmation({
          user: {
            first_name: req.user.firstName,
            last_name: req.user.lastName,
            email: req.user.email
          },
          booking: booking.toJSON(),
          room: {
            roomNumber: bookingDetails.room_number,
            name: bookingDetails.room_name,
            type: bookingDetails.room_type
          },
          building: {
            name: bookingDetails.building_name,
            code: bookingDetails.building_code
          }
        });
        
        logger.info(`Booking confirmation email sent for booking ${booking.bookingId}`);
      } catch (emailError) {
        logger.error('Failed to send confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      logger.info(`New booking created: ${booking.bookingId} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: {
          ...booking.toJSON(),
          roomNumber: bookingDetails.room_number,
          roomName: bookingDetails.room_name,
          roomType: bookingDetails.room_type,
          buildingName: bookingDetails.building_name,
          buildingCode: bookingDetails.building_code
        },
        message: 'Booking created successfully'
      });

    } catch (error) {
      logger.error('Failed to create booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create booking'
      });
    }
  }
);

// Update booking
router.put('/:bookingId',
  authenticate,
  [
    body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
    body('endTime').optional().isISO8601().withMessage('Valid end time is required'),
    body('purpose').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Purpose must be 5-500 characters'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    body('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { bookingId } = req.params;
      const result = await Booking.findById(bookingId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const booking = result.booking;

      // Check if user owns this booking or is admin
      if (booking.userId !== req.user.userId && req.user.role !== 'ADMINISTRATOR') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Don't allow updates to completed or cancelled bookings
      if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          error: 'Cannot modify completed or cancelled bookings'
        });
      }

      const updates = {};
      if (req.body.startTime) updates.startTime = new Date(req.body.startTime);
      if (req.body.endTime) updates.endTime = new Date(req.body.endTime);
      if (req.body.purpose) updates.purpose = req.body.purpose.trim();
      if (req.body.notes !== undefined) updates.notes = req.body.notes?.trim() || null;
      if (req.body.status && req.user.role === 'ADMINISTRATOR') {
        updates.status = req.body.status;
      }

      // If time is being updated, validate availability
      if (updates.startTime || updates.endTime) {
        const startTime = updates.startTime || booking.startTime;
        const endTime = updates.endTime || booking.endTime;
        
        // Validate time logic
        if (startTime >= endTime) {
          return res.status(400).json({
            success: false,
            error: 'End time must be after start time'
          });
        }

        const room = await Room.findById(booking.roomId);
        const isAvailable = await room.isAvailable(startTime, endTime, booking.bookingId);
        if (!isAvailable) {
          return res.status(409).json({
            success: false,
            error: 'Room is not available for the selected time slot'
          });
        }
      }

      const updatedBooking = await booking.update(updates);

      logger.info(`Booking updated: ${bookingId} by user ${req.user.userId}`);

      res.json({
        success: true,
        data: updatedBooking.toJSON(),
        message: 'Booking updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update booking'
      });
    }
  }
);

// Cancel booking
router.post('/:bookingId/cancel',
  authenticate,
  [
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Cancellation reason cannot exceed 500 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { bookingId } = req.params;
      const { reason } = req.body;
      
      const result = await Booking.findById(bookingId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const booking = result.booking;

      // Check if user owns this booking or is admin
      if (booking.userId !== req.user.userId && req.user.role !== 'ADMINISTRATOR') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Don't allow cancellation of already cancelled or completed bookings
      if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel completed or already cancelled bookings'
        });
      }

      const cancelledBooking = await booking.cancel(reason?.trim());

      // Send cancellation email
      try {
        await emailService.sendBookingCancellation({
          user: {
            first_name: result.first_name,
            last_name: result.last_name,
            email: result.email
          },
          booking: cancelledBooking.toJSON(),
          room: {
            roomNumber: result.room_number,
            name: result.room_name,
            type: result.room_type
          },
          building: {
            name: result.building_name,
            code: result.building_code
          }
        });
        
        logger.info(`Cancellation email sent for booking ${bookingId}`);
      } catch (emailError) {
        logger.error('Failed to send cancellation email:', emailError);
        // Don't fail the cancellation if email fails
      }

      logger.info(`Booking cancelled: ${bookingId} by user ${req.user.userId}`);

      res.json({
        success: true,
        data: cancelledBooking.toJSON(),
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      logger.error('Failed to cancel booking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel booking'
      });
    }
  }
);

// Delete booking (admin only)
router.delete('/:bookingId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { bookingId } = req.params;
    const result = await Booking.findById(bookingId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    await result.booking.delete();

    logger.info(`Booking deleted: ${bookingId} by admin ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking'
    });
  }
});

// Get upcoming bookings (for reminders, admin only)
router.get('/admin/upcoming', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { hours = 24 } = req.query;
    const bookings = await Booking.getUpcomingBookings(parseInt(hours));

    res.json({
      success: true,
      data: bookings.map(item => ({
        ...item.booking.toJSON(),
        user: {
          firstName: item.first_name,
          lastName: item.last_name,
          email: item.email,
          username: item.username
        },
        room: {
          roomNumber: item.room_number,
          roomName: item.room_name,
          roomType: item.room_type
        },
        building: {
          buildingName: item.building_name,
          buildingCode: item.building_code
        }
      })),
      meta: {
        count: bookings.length,
        hoursAhead: parseInt(hours)
      }
    });

  } catch (error) {
    logger.error('Failed to get upcoming bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve upcoming bookings'
    });
  }
});

module.exports = router;