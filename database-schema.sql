-- Smart Campus Navigation and Facility Booking System (SCNFBS)
-- Database Schema - PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'STAFF', 'ADMINISTRATOR', 'VISITOR');
CREATE TYPE room_type AS ENUM ('STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM', 'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE path_type AS ENUM ('WALKING', 'ACCESSIBLE', 'INDOOR', 'OUTDOOR', 'MIXED');
CREATE TYPE notification_type AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLATION', 'SYSTEM_MAINTENANCE', 'FACILITY_UPDATE');
CREATE TYPE report_type AS ENUM ('FACILITY_UTILIZATION', 'USER_ACTIVITY', 'BOOKING_STATISTICS', 'PEAK_HOURS', 'REVENUE');

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    phone VARCHAR(20),
    student_id VARCHAR(20),
    employee_id VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings table
CREATE TABLE buildings (
    building_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    floors INTEGER DEFAULT 1,
    is_accessible BOOLEAN DEFAULT TRUE,
    description TEXT,
    operating_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entrances table
CREATE TABLE entrances (
    entrance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    floor INTEGER DEFAULT 1,
    is_accessible BOOLEAN DEFAULT TRUE,
    is_main BOOLEAN DEFAULT FALSE,
    operating_hours JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(building_id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    type room_type NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    floor INTEGER NOT NULL DEFAULT 1,
    is_accessible BOOLEAN DEFAULT TRUE,
    description TEXT,
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    is_bookable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, room_number)
);

-- Equipment table
CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    is_working BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking rules table
CREATE TABLE booking_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_role user_role,
    room_type room_type,
    max_duration_hours INTEGER DEFAULT 24,
    max_advance_days INTEGER DEFAULT 30,
    max_concurrent_bookings INTEGER DEFAULT 5,
    min_advance_hours INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    purpose TEXT,
    status booking_status DEFAULT 'PENDING',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    parent_booking_id UUID REFERENCES bookings(booking_id),
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- Locations table (for navigation)
CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES buildings(building_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    floor INTEGER DEFAULT 1,
    description TEXT,
    is_accessible BOOLEAN DEFAULT TRUE,
    location_type VARCHAR(50), -- 'entrance', 'elevator', 'stairs', 'room', 'landmark'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Map paths table
CREATE TABLE map_paths (
    path_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_location_id UUID NOT NULL REFERENCES locations(location_id),
    end_location_id UUID NOT NULL REFERENCES locations(location_id),
    path_type path_type NOT NULL DEFAULT 'WALKING',
    distance_meters DECIMAL(8, 2),
    estimated_time_minutes INTEGER,
    is_accessible BOOLEAN DEFAULT TRUE,
    waypoints JSONB, -- Array of coordinate objects
    instructions JSONB, -- Array of turn-by-turn instructions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(booking_id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Reports table
CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type report_type NOT NULL,
    generated_by UUID NOT NULL REFERENCES users(user_id),
    date_range_start DATE,
    date_range_end DATE,
    parameters JSONB,
    data JSONB,
    file_path VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for authentication)
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_buildings_code ON buildings(code);
CREATE INDEX idx_rooms_building_id ON rooms(building_id);
CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_locations_building_id ON locations(building_id);
CREATE INDEX idx_map_paths_start_location ON map_paths(start_location_id);
CREATE INDEX idx_map_paths_end_location ON map_paths(end_location_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create composite indexes
CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_rules_updated_at BEFORE UPDATE ON booking_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_paths_updated_at BEFORE UPDATE ON map_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts(
    p_room_id UUID,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP,
    p_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM bookings
    WHERE room_id = p_room_id
    AND status IN ('CONFIRMED', 'PENDING')
    AND (p_booking_id IS NULL OR booking_id != p_booking_id)
    AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < p_end_time AND end_time >= p_end_time) OR
        (start_time >= p_start_time AND end_time <= p_end_time)
    );
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for booking validation
CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for booking conflicts
    IF NOT check_booking_conflicts(NEW.room_id, NEW.start_time, NEW.end_time, NEW.booking_id) THEN
        RAISE EXCEPTION 'Booking conflict detected for room % during the requested time period', NEW.room_id;
    END IF;
    
    -- Check if booking is in the future
    IF NEW.start_time <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Booking start time must be in the future';
    END IF;
    
    -- Check if end time is after start time (already handled by constraint but good to have)
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'Booking end time must be after start time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking validation
CREATE TRIGGER validate_booking_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION validate_booking();

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('max_booking_duration_hours', '8', 'Maximum booking duration in hours'),
('max_advance_booking_days', '30', 'Maximum days in advance a booking can be made'),
('booking_reminder_hours', '[24, 1]', 'Hours before booking to send reminders'),
('system_timezone', '"UTC"', 'System default timezone'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('email_notifications_enabled', 'true', 'Enable/disable email notifications'),
('max_concurrent_bookings_student', '3', 'Maximum concurrent bookings for students'),
('max_concurrent_bookings_faculty', '10', 'Maximum concurrent bookings for faculty'),
('booking_cancellation_hours', '2', 'Minimum hours before booking to allow cancellation');

-- Insert default booking rules
INSERT INTO booking_rules (name, description, user_role, room_type, max_duration_hours, max_advance_days, max_concurrent_bookings) VALUES
('Student Study Room Rule', 'Default rules for student study room bookings', 'STUDENT', 'STUDY_ROOM', 4, 7, 2),
('Faculty Lab Rule', 'Default rules for faculty lab bookings', 'FACULTY', 'LABORATORY', 8, 30, 5),
('Staff Meeting Room Rule', 'Default rules for staff meeting room bookings', 'STAFF', 'MEETING_ROOM', 6, 14, 3),
('Lecture Hall Rule', 'Default rules for lecture hall bookings', 'FACULTY', 'LECTURE_HALL', 4, 60, 10);

-- Create views for common queries
CREATE VIEW available_rooms AS
SELECT 
    r.room_id,
    r.room_number,
    r.name,
    r.type,
    r.capacity,
    r.floor,
    r.is_accessible,
    b.name as building_name,
    b.code as building_code
FROM rooms r
JOIN buildings b ON r.building_id = b.building_id
WHERE r.is_active = TRUE AND r.is_bookable = TRUE;

CREATE VIEW booking_summary AS
SELECT 
    b.booking_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    r.room_number,
    building.name as building_name,
    b.start_time,
    b.end_time,
    b.status,
    b.purpose,
    b.created_at
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN rooms r ON b.room_id = r.room_id
JOIN buildings building ON r.building_id = building.building_id;

-- Create function to get user booking statistics
CREATE OR REPLACE FUNCTION get_user_booking_stats(p_user_id UUID)
RETURNS TABLE (
    total_bookings BIGINT,
    active_bookings BIGINT,
    completed_bookings BIGINT,
    cancelled_bookings BIGINT,
    no_show_bookings BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'PENDING')) as active_bookings,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show_bookings
    FROM bookings
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;