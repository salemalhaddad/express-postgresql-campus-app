const database = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.userId = data.user_id;
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.role = data.role;
    this.phone = data.phone;
    this.studentId = data.student_id;
    this.employeeId = data.employee_id;
    this.isActive = data.is_active;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async create(userData) {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = 'STUDENT',
      phone,
      studentId,
      employeeId
    } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, role, 
        phone, student_id, employee_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      username,
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      phone,
      studentId,
      employeeId
    ];

    const result = await database.query(query, values);
    return new User(result.rows[0]);
  }

  static async findById(userId) {
    const query = 'SELECT * FROM users WHERE user_id = $1';
    const result = await database.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await database.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await database.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      values.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.isActive);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR username ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

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
    return result.rows.map(row => new User(row));
  }

  async update(updateData) {
    const allowedFields = [
      'username', 'email', 'first_name', 'last_name', 'role',
      'phone', 'student_id', 'employee_id', 'is_active'
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
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramCount}
      RETURNING *
    `;
    values.push(this.userId);

    const result = await database.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Update current instance
    Object.assign(this, new User(result.rows[0]));
    return this;
  }

  async updatePassword(newPassword) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING user_id
    `;

    const result = await database.query(query, [passwordHash, this.userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return true;
  }

  async verifyPassword(password) {
    const query = 'SELECT password_hash FROM users WHERE user_id = $1';
    const result = await database.query(query, [this.userId]);
    
    if (result.rows.length === 0) {
      return false;
    }

    return await bcrypt.compare(password, result.rows[0].password_hash);
  }

  async updateLastLogin() {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    
    await database.query(query, [this.userId]);
    this.lastLogin = new Date();
  }

  async delete() {
    // Soft delete by setting is_active to false
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING user_id
    `;

    const result = await database.query(query, [this.userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    this.isActive = false;
    return true;
  }

  async getBookings(filters = {}) {
    let query = `
      SELECT b.*, r.room_number, r.name as room_name, 
             bld.name as building_name, bld.code as building_code
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN buildings bld ON r.building_id = bld.building_id
      WHERE b.user_id = $1
    `;
    
    const values = [this.userId];
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

  async getBookingStats() {
    const query = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'PENDING')) as active_bookings,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show_bookings
      FROM bookings
      WHERE user_id = $1
    `;

    const result = await database.query(query, [this.userId]);
    return result.rows[0];
  }

  hasPermission(permission) {
    const rolePermissions = {
      ADMINISTRATOR: ['*'],
      FACULTY: [
        'booking:create', 'booking:read', 'booking:update', 'booking:delete',
        'facility:read', 'navigation:read', 'user:read'
      ],
      STAFF: [
        'booking:create', 'booking:read', 'booking:update', 'booking:delete',
        'facility:read', 'navigation:read', 'user:read'
      ],
      STUDENT: [
        'booking:create', 'booking:read', 'booking:update', 'booking:delete',
        'facility:read', 'navigation:read'
      ],
      VISITOR: ['facility:read', 'navigation:read']
    };

    const permissions = rolePermissions[this.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: `${this.firstName} ${this.lastName}`,
      role: this.role,
      phone: this.phone,
      studentId: this.studentId,
      employeeId: this.employeeId,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      values.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.isActive);
    }

    const result = await database.query(query, values);
    return parseInt(result.rows[0].count);
  }
}

module.exports = User;