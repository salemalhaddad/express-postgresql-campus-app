const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Room {
  constructor(data) {
    this.roomId = data.room_id;
    this.buildingId = data.building_id;
    this.roomNumber = data.room_number;
    this.name = data.name;
    this.type = data.type;
    this.capacity = data.capacity;
    this.floor = data.floor;
    this.isAccessible = data.is_accessible;
    this.description = data.description;
    this.hourlyRate = data.hourly_rate;
    this.isBookable = data.is_bookable;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(roomData) {
    const {
      buildingId,
      roomNumber,
      name,
      type,
      capacity,
      floor = 1,
      isAccessible = true,
      description,
      hourlyRate = 0.00,
      isBookable = true,
      isActive = true
    } = roomData;

    const query = `
      INSERT INTO rooms (
        building_id, room_number, name, type, capacity, floor,
        is_accessible, description, hourly_rate, is_bookable, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      buildingId, roomNumber, name, type, capacity, floor,
      isAccessible, description, hourlyRate, isBookable, isActive
    ];

    const result = await database.query(query, values);
    return new Room(result.rows[0]);
  }

  static async findById(roomId) {
    const query = `
      SELECT r.*, b.name as building_name, b.code as building_code
      FROM rooms r
      JOIN buildings b ON r.building_id = b.building_id
      WHERE r.room_id = $1
    `;
    const result = await database.query(query, [roomId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const roomData = new Room(result.rows[0]);
    roomData.buildingName = result.rows[0].building_name;
    roomData.buildingCode = result.rows[0].building_code;
    return roomData;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT r.*, b.name as building_name, b.code as building_code,
             COUNT(e.equipment_id) as equipment_count
      FROM rooms r
      JOIN buildings b ON r.building_id = b.building_id
      LEFT JOIN equipment e ON r.room_id = e.room_id AND e.is_working = true
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (filters.buildingId) {
      paramCount++;
      query += ` AND r.building_id = $${paramCount}`;
      values.push(filters.buildingId);
    }

    if (filters.type) {
      paramCount++;
      query += ` AND r.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters.isBookable !== undefined) {
      paramCount++;
      query += ` AND r.is_bookable = $${paramCount}`;
      values.push(filters.isBookable);
    }

    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND r.is_active = $${paramCount}`;
      values.push(filters.isActive);
    }

    if (filters.floor) {
      paramCount++;
      query += ` AND r.floor = $${paramCount}`;
      values.push(filters.floor);
    }

    if (filters.minCapacity) {
      paramCount++;
      query += ` AND r.capacity >= $${paramCount}`;
      values.push(filters.minCapacity);
    }

    if (filters.maxCapacity) {
      paramCount++;
      query += ` AND r.capacity <= $${paramCount}`;
      values.push(filters.maxCapacity);
    }

    if (filters.isAccessible !== undefined) {
      paramCount++;
      query += ` AND r.is_accessible = $${paramCount}`;
      values.push(filters.isAccessible);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (r.name ILIKE $${paramCount} OR r.room_number ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    query += ' GROUP BY r.room_id, b.building_id';
    query += ' ORDER BY b.name ASC, r.room_number ASC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    const result = await database.query(query, values);
    return result.rows.map(row => {
      const room = new Room(row);
      room.buildingName = row.building_name;
      room.buildingCode = row.building_code;
      room.equipmentCount = parseInt(row.equipment_count);
      return room;
    });
  }

  static async findAvailable(startTime, endTime, filters = {}) {
    let query = `
      SELECT DISTINCT r.*, b.name as building_name, b.code as building_code,
             COUNT(e.equipment_id) as equipment_count
      FROM rooms r
      JOIN buildings b ON r.building_id = b.building_id
      LEFT JOIN equipment e ON r.room_id = e.room_id AND e.is_working = true
      WHERE r.is_bookable = true 
        AND r.is_active = true
        AND r.room_id NOT IN (
          SELECT DISTINCT room_id 
          FROM bookings 
          WHERE status IN ('CONFIRMED', 'PENDING')
            AND (
              (start_time <= $1 AND end_time > $1) OR
              (start_time < $2 AND end_time >= $2) OR
              (start_time >= $1 AND end_time <= $2)
            )
        )
    `;
    
    const values = [startTime, endTime];
    let paramCount = 2;

    if (filters.buildingId) {
      paramCount++;
      query += ` AND r.building_id = $${paramCount}`;
      values.push(filters.buildingId);
    }

    if (filters.type) {
      paramCount++;
      query += ` AND r.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters.minCapacity) {
      paramCount++;
      query += ` AND r.capacity >= $${paramCount}`;
      values.push(filters.minCapacity);
    }

    if (filters.floor) {
      paramCount++;
      query += ` AND r.floor = $${paramCount}`;
      values.push(filters.floor);
    }

    if (filters.isAccessible !== undefined) {
      paramCount++;
      query += ` AND r.is_accessible = $${paramCount}`;
      values.push(filters.isAccessible);
    }

    query += ' GROUP BY r.room_id, b.building_id';
    query += ' ORDER BY b.name ASC, r.room_number ASC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await database.query(query, values);
    return result.rows.map(row => {
      const room = new Room(row);
      room.buildingName = row.building_name;
      room.buildingCode = row.building_code;
      room.equipmentCount = parseInt(row.equipment_count);
      return room;
    });
  }

  async update(updateData) {
    const allowedFields = [
      'room_number', 'name', 'type', 'capacity', 'floor',
      'is_accessible', 'description', 'hourly_rate', 'is_bookable', 'is_active'
    ];

    const updates = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        paramCount++;
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    const query = `
      UPDATE rooms 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE room_id = $${paramCount}
      RETURNING *
    `;
    values.push(this.roomId);

    const result = await database.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Room not found');
    }

    Object.assign(this, new Room(result.rows[0]));
    return this;
  }

  async delete() {
    const query = 'DELETE FROM rooms WHERE room_id = $1 RETURNING room_id';
    const result = await database.query(query, [this.roomId]);
    
    if (result.rows.length === 0) {
      throw new Error('Room not found');
    }

    return true;
  }

  async isAvailable(startTime, endTime, excludeBookingId = null) {
    let query = `
      SELECT COUNT(*) as conflict_count
      FROM bookings
      WHERE room_id = $1
        AND status IN ('CONFIRMED', 'PENDING')
        AND (
          (start_time <= $2 AND end_time > $2) OR
          (start_time < $3 AND end_time >= $3) OR
          (start_time >= $2 AND end_time <= $3)
        )
    `;
    
    const values = [this.roomId, startTime, endTime];

    if (excludeBookingId) {
      query += ' AND booking_id != $4';
      values.push(excludeBookingId);
    }

    const result = await database.query(query, values);
    return parseInt(result.rows[0].conflict_count) === 0;
  }

  async getBookings(filters = {}) {
    let query = `
      SELECT b.*, u.first_name, u.last_name, u.email
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.room_id = $1
    `;
    
    const values = [this.roomId];
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

    const result = await database.query(query, values);
    return result.rows;
  }

  async getEquipment() {
    const query = `
      SELECT * FROM equipment 
      WHERE room_id = $1 
      ORDER BY is_working DESC, name ASC
    `;
    
    const result = await database.query(query, [this.roomId]);
    return result.rows;
  }

  async addEquipment(equipmentData) {
    const { name, type, description, isWorking = true } = equipmentData;

    const query = `
      INSERT INTO equipment (room_id, name, type, description, is_working)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [this.roomId, name, type, description, isWorking];
    const result = await database.query(query, values);
    return result.rows[0];
  }

  async getUtilizationStats(startDate, endDate) {
    const query = `
      SELECT 
        COUNT(b.booking_id) as total_bookings,
        COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0) as total_hours_booked,
        COALESCE(AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0) as avg_booking_duration,
        COUNT(b.booking_id) FILTER (WHERE b.status = 'COMPLETED') as completed_bookings,
        COUNT(b.booking_id) FILTER (WHERE b.status = 'CANCELLED') as cancelled_bookings,
        COUNT(b.booking_id) FILTER (WHERE b.status = 'NO_SHOW') as no_show_bookings
      FROM bookings b
      WHERE b.room_id = $1
        AND b.start_time >= $2
        AND b.end_time <= $3
    `;

    const result = await database.query(query, [this.roomId, startDate, endDate]);
    return result.rows[0];
  }

  toJSON() {
    return {
      roomId: this.roomId,
      buildingId: this.buildingId,
      roomNumber: this.roomNumber,
      name: this.name,
      type: this.type,
      capacity: this.capacity,
      floor: this.floor,
      isAccessible: this.isAccessible,
      description: this.description,
      hourlyRate: parseFloat(this.hourlyRate),
      isBookable: this.isBookable,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      buildingName: this.buildingName,
      buildingCode: this.buildingCode,
      equipmentCount: this.equipmentCount
    };
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM rooms r WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.buildingId) {
      paramCount++;
      query += ` AND r.building_id = $${paramCount}`;
      values.push(filters.buildingId);
    }

    if (filters.type) {
      paramCount++;
      query += ` AND r.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters.isBookable !== undefined) {
      paramCount++;
      query += ` AND r.is_bookable = $${paramCount}`;
      values.push(filters.isBookable);
    }

    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND r.is_active = $${paramCount}`;
      values.push(filters.isActive);
    }

    const result = await database.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async search(searchTerm, filters = {}) {
    let query = `
      SELECT r.*, b.name as building_name, b.code as building_code
      FROM rooms r
      JOIN buildings b ON r.building_id = b.building_id
      WHERE (r.name ILIKE $1 OR r.room_number ILIKE $1 OR b.name ILIKE $1 OR b.code ILIKE $1)
        AND r.is_active = true
    `;
    
    const values = [`%${searchTerm}%`];
    let paramCount = 1;

    if (filters.type) {
      paramCount++;
      query += ` AND r.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters.isBookable !== undefined) {
      paramCount++;
      query += ` AND r.is_bookable = $${paramCount}`;
      values.push(filters.isBookable);
    }

    query += ` ORDER BY 
      CASE 
        WHEN r.room_number ILIKE $1 THEN 1
        WHEN r.name ILIKE $1 THEN 2
        WHEN b.code ILIKE $1 THEN 3
        ELSE 4
      END,
      b.name ASC, r.room_number ASC
      LIMIT 20
    `;

    const result = await database.query(query, values);
    return result.rows.map(row => {
      const room = new Room(row);
      room.buildingName = row.building_name;
      room.buildingCode = row.building_code;
      return room;
    });
  }
}

module.exports = Room;