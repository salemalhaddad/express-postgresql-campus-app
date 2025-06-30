const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Booking {
  constructor(data) {
    this.bookingId = data.booking_id || data.bookingId;
    this.userId = data.user_id || data.userId;
    this.roomId = data.room_id || data.roomId;
    this.startTime = data.start_time || data.startTime;
    this.endTime = data.end_time || data.endTime;
    this.purpose = data.purpose;
    this.status = data.status || 'PENDING';
    this.isRecurring = data.is_recurring || data.isRecurring || false;
    this.recurrencePattern = data.recurrence_pattern || data.recurrencePattern;
    this.parentBookingId = data.parent_booking_id || data.parentBookingId;
    this.totalCost = data.total_cost || data.totalCost || 0.00;
    this.notes = data.notes;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  static async create(bookingData) {
    const bookingId = uuidv4();
    const query = `
      INSERT INTO bookings (
        booking_id, user_id, room_id, start_time, end_time, purpose, 
        status, is_recurring, recurrence_pattern, parent_booking_id, 
        total_cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      bookingId,
      bookingData.userId,
      bookingData.roomId,
      bookingData.startTime,
      bookingData.endTime,
      bookingData.purpose,
      bookingData.status || 'PENDING',
      bookingData.isRecurring || false,
      bookingData.recurrencePattern || null,
      bookingData.parentBookingId || null,
      bookingData.totalCost || 0.00,
      bookingData.notes || null
    ];

    try {
      const result = await database.query(query, values);
      return new Booking(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }

  static async findById(bookingId) {
    const query = `
      SELECT b.*, u.first_name, u.last_name, u.email, u.username,
             r.room_number, r.name as room_name, r.type as room_type,
             bld.name as building_name, bld.code as building_code
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN rooms r ON b.room_id = r.room_id
      JOIN buildings bld ON r.building_id = bld.building_id
      WHERE b.booking_id = $1
    `;

    try {
      const result = await database.query(query, [bookingId]);
      if (result.rows.length === 0) {
        return null;
      }
      return { booking: new Booking(result.rows[0]), ...result.rows[0] };
    } catch (error) {
      throw new Error(`Failed to find booking: ${error.message}`);
    }
  }

  static async findByUser(userId, filters = {}) {
    let query = `
      SELECT b.*, r.room_number, r.name as room_name, r.type as room_type,
             bld.name as building_name, bld.code as building_code
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN buildings bld ON r.building_id = bld.building_id
      WHERE b.user_id = $1
    `;
    const values = [userId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND b.start_time >= $${paramCount}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND b.end_time <= $${paramCount}`;
      values.push(filters.endDate);
    }

    query += ' ORDER BY b.start_time DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    try {
      const result = await database.query(query, values);
      return result.rows.map(row => ({ booking: new Booking(row), ...row }));
    } catch (error) {
      throw new Error(`Failed to find user bookings: ${error.message}`);
    }
  }

  static async findByRoom(roomId, filters = {}) {
    let query = `
      SELECT b.*, u.first_name, u.last_name, u.email, u.username
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.room_id = $1
    `;
    const values = [roomId];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.startDate) {
      paramCount++;
      query += ` AND b.start_time >= $${paramCount}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND b.end_time <= $${paramCount}`;
      values.push(filters.endDate);
    }

    query += ' ORDER BY b.start_time ASC';

    try {
      const result = await database.query(query, values);
      return result.rows.map(row => ({ booking: new Booking(row), ...row }));
    } catch (error) {
      throw new Error(`Failed to find room bookings: ${error.message}`);
    }
  }

  async update(updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    const allowedFields = [
      'start_time', 'end_time', 'purpose', 'status', 'notes', 'total_cost'
    ];

    allowedFields.forEach(field => {
      const jsField = field.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      if (updates[field] !== undefined || updates[jsField] !== undefined) {
        paramCount++;
        fields.push(`${field} = $${paramCount}`);
        values.push(updates[field] || updates[jsField]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(this.bookingId);

    const query = `
      UPDATE bookings 
      SET ${fields.join(', ')}
      WHERE booking_id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await database.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Booking not found');
      }
      
      // Update instance properties
      const updated = result.rows[0];
      Object.keys(updated).forEach(key => {
        if (this[key] !== undefined) {
          this[key] = updated[key];
        }
      });

      return this;
    } catch (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }
  }

  async cancel(reason = null) {
    return await this.update({ 
      status: 'CANCELLED',
      notes: reason ? `${this.notes || ''}\nCancellation reason: ${reason}`.trim() : this.notes
    });
  }

  async confirm() {
    return await this.update({ status: 'CONFIRMED' });
  }

  async complete() {
    return await this.update({ status: 'COMPLETED' });
  }

  async markNoShow() {
    return await this.update({ status: 'NO_SHOW' });
  }

  async delete() {
    const query = 'DELETE FROM bookings WHERE booking_id = $1';
    try {
      await database.query(query, [this.bookingId]);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete booking: ${error.message}`);
    }
  }

  static async getUpcomingBookings(hoursAhead = 24) {
    const query = `
      SELECT b.*, u.first_name, u.last_name, u.email, u.username,
             r.room_number, r.name as room_name, r.type as room_type,
             bld.name as building_name, bld.code as building_code
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN rooms r ON b.room_id = r.room_id
      JOIN buildings bld ON r.building_id = bld.building_id
      WHERE b.status IN ('CONFIRMED', 'PENDING')
        AND b.start_time <= NOW() + INTERVAL '${hoursAhead} hours'
        AND b.start_time > NOW()
      ORDER BY b.start_time ASC
    `;

    try {
      const result = await database.query(query);
      return result.rows.map(row => ({ booking: new Booking(row), ...row }));
    } catch (error) {
      throw new Error(`Failed to get upcoming bookings: ${error.message}`);
    }
  }

  static async validateBooking(bookingData) {
    const errors = [];

    // Validate required fields
    if (!bookingData.userId) errors.push('User ID is required');
    if (!bookingData.roomId) errors.push('Room ID is required');
    if (!bookingData.startTime) errors.push('Start time is required');
    if (!bookingData.endTime) errors.push('End time is required');
    if (!bookingData.purpose || bookingData.purpose.trim().length === 0) {
      errors.push('Purpose is required');
    }

    // Validate time logic
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);
    const now = new Date();

    if (startTime >= endTime) {
      errors.push('End time must be after start time');
    }

    if (startTime <= now) {
      errors.push('Start time must be in the future');
    }

    // Validate max duration (24 hours)
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    if (durationHours > 24) {
      errors.push('Booking duration cannot exceed 24 hours');
    }

    if (durationHours < 0.5) {
      errors.push('Minimum booking duration is 30 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isActive() {
    return ['PENDING', 'CONFIRMED'].includes(this.status);
  }

  isUpcoming() {
    return this.isActive() && new Date(this.startTime) > new Date();
  }

  isPast() {
    return new Date(this.endTime) < new Date();
  }

  getDurationHours() {
    return (new Date(this.endTime) - new Date(this.startTime)) / (1000 * 60 * 60);
  }

  toJSON() {
    return {
      bookingId: this.bookingId,
      userId: this.userId,
      roomId: this.roomId,
      startTime: this.startTime,
      endTime: this.endTime,
      purpose: this.purpose,
      status: this.status,
      isRecurring: this.isRecurring,
      recurrencePattern: this.recurrencePattern,
      parentBookingId: this.parentBookingId,
      totalCost: this.totalCost,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Booking;