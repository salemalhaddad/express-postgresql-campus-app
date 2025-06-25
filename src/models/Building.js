const database = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Building {
  constructor(data) {
    this.buildingId = data.building_id;
    this.code = data.code;
    this.name = data.name;
    this.address = data.address;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.floors = data.floors;
    this.isAccessible = data.is_accessible;
    this.description = data.description;
    this.operatingHours = data.operating_hours;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(buildingData) {
    const {
      code,
      name,
      address,
      latitude,
      longitude,
      floors = 1,
      isAccessible = true,
      description,
      operatingHours
    } = buildingData;

    const query = `
      INSERT INTO buildings (
        code, name, address, latitude, longitude, floors, 
        is_accessible, description, operating_hours
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      code,
      name,
      address,
      latitude,
      longitude,
      floors,
      isAccessible,
      description,
      operatingHours
    ];

    const result = await database.query(query, values);
    return new Building(result.rows[0]);
  }

  static async findById(buildingId) {
    const query = 'SELECT * FROM buildings WHERE building_id = $1';
    const result = await database.query(query, [buildingId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Building(result.rows[0]);
  }

  static async findByCode(code) {
    const query = 'SELECT * FROM buildings WHERE code = $1';
    const result = await database.query(query, [code]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Building(result.rows[0]);
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM buildings WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    if (filters.isAccessible !== undefined) {
      paramCount++;
      query += ` AND is_accessible = $${paramCount}`;
      values.push(filters.isAccessible);
    }

    query += ' ORDER BY name ASC';

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
    return result.rows.map(row => new Building(row));
  }

  async update(updateData) {
    const allowedFields = [
      'code', 'name', 'address', 'latitude', 'longitude', 'floors',
      'is_accessible', 'description', 'operating_hours'
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
      UPDATE buildings 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE building_id = $${paramCount}
      RETURNING *
    `;
    values.push(this.buildingId);

    const result = await database.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Building not found');
    }

    Object.assign(this, new Building(result.rows[0]));
    return this;
  }

  async delete() {
    const query = 'DELETE FROM buildings WHERE building_id = $1 RETURNING building_id';
    const result = await database.query(query, [this.buildingId]);
    
    if (result.rows.length === 0) {
      throw new Error('Building not found');
    }

    return true;
  }

  async getRooms(filters = {}) {
    let query = `
      SELECT r.*, 
             COUNT(e.equipment_id) as equipment_count
      FROM rooms r
      LEFT JOIN equipment e ON r.room_id = e.room_id AND e.is_working = true
      WHERE r.building_id = $1
    `;
    
    const values = [this.buildingId];
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

    if (filters.isAccessible !== undefined) {
      paramCount++;
      query += ` AND r.is_accessible = $${paramCount}`;
      values.push(filters.isAccessible);
    }

    query += ' GROUP BY r.room_id ORDER BY r.room_number ASC';

    const result = await database.query(query, values);
    return result.rows;
  }

  async getAvailableRooms(startTime, endTime, filters = {}) {
    let query = `
      SELECT r.*, 
             COUNT(e.equipment_id) as equipment_count
      FROM rooms r
      LEFT JOIN equipment e ON r.room_id = e.room_id AND e.is_working = true
      WHERE r.building_id = $1 
        AND r.is_bookable = true 
        AND r.is_active = true
        AND r.room_id NOT IN (
          SELECT DISTINCT room_id 
          FROM bookings 
          WHERE status IN ('CONFIRMED', 'PENDING')
            AND (
              (start_time <= $2 AND end_time > $2) OR
              (start_time < $3 AND end_time >= $3) OR
              (start_time >= $2 AND end_time <= $3)
            )
        )
    `;
    
    const values = [this.buildingId, startTime, endTime];
    let paramCount = 3;

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

    query += ' GROUP BY r.room_id ORDER BY r.room_number ASC';

    const result = await database.query(query, values);
    return result.rows;
  }

  async getEntrances() {
    const query = `
      SELECT * FROM entrances 
      WHERE building_id = $1 
      ORDER BY is_main DESC, name ASC
    `;
    
    const result = await database.query(query, [this.buildingId]);
    return result.rows;
  }

  async addEntrance(entranceData) {
    const {
      name,
      latitude,
      longitude,
      floor = 1,
      isAccessible = true,
      isMain = false,
      operatingHours
    } = entranceData;

    const query = `
      INSERT INTO entrances (
        building_id, name, latitude, longitude, floor, 
        is_accessible, is_main, operating_hours
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      this.buildingId,
      name,
      latitude,
      longitude,
      floor,
      isAccessible,
      isMain,
      operatingHours
    ];

    const result = await database.query(query, values);
    return result.rows[0];
  }

  async getUtilizationStats(startDate, endDate) {
    const query = `
      SELECT 
        r.type,
        COUNT(DISTINCT r.room_id) as total_rooms,
        COUNT(b.booking_id) as total_bookings,
        COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0) as total_hours_booked,
        COALESCE(AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0) as avg_booking_duration
      FROM rooms r
      LEFT JOIN bookings b ON r.room_id = b.room_id 
        AND b.status = 'COMPLETED'
        AND b.start_time >= $2
        AND b.end_time <= $3
      WHERE r.building_id = $1
      GROUP BY r.type
      ORDER BY r.type
    `;

    const result = await database.query(query, [this.buildingId, startDate, endDate]);
    return result.rows;
  }

  toJSON() {
    return {
      buildingId: this.buildingId,
      code: this.code,
      name: this.name,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      floors: this.floors,
      isAccessible: this.isAccessible,
      description: this.description,
      operatingHours: this.operatingHours,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM buildings WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    if (filters.isAccessible !== undefined) {
      paramCount++;
      query += ` AND is_accessible = $${paramCount}`;
      values.push(filters.isAccessible);
    }

    const result = await database.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async search(searchTerm) {
    const query = `
      SELECT b.*, 
             COUNT(r.room_id) as room_count
      FROM buildings b
      LEFT JOIN rooms r ON b.building_id = r.building_id AND r.is_active = true
      WHERE b.name ILIKE $1 OR b.code ILIKE $1 OR b.address ILIKE $1
      GROUP BY b.building_id
      ORDER BY 
        CASE 
          WHEN b.code ILIKE $1 THEN 1
          WHEN b.name ILIKE $1 THEN 2
          ELSE 3
        END,
        b.name ASC
      LIMIT 10
    `;

    const result = await database.query(query, [`%${searchTerm}%`]);
    return result.rows.map(row => ({
      ...new Building(row).toJSON(),
      roomCount: parseInt(row.room_count)
    }));
  }
}

module.exports = Building;