#!/usr/bin/env node

require('dotenv').config();

const database = require('../config/database');
const logger = require('../utils/logger');

// Sample campus data for demo  
const sampleBuildings = [
  {
    building_id: '550e8400-e29b-41d4-a716-446655440001',
    code: 'LIB',
    name: 'Central Library',
    address: '123 University Ave, Dubai, UAE',
    latitude: 25.276987,
    longitude: 55.296249,
    floors: 4,
    is_accessible: true,
    description: 'Main campus library with study rooms and computer labs',
    operating_hours: JSON.stringify({
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true }
    })
  },
  {
    building_id: '550e8400-e29b-41d4-a716-446655440002',
    code: 'SCI',
    name: 'Science Building',
    address: '456 Research Blvd, Dubai, UAE',
    latitude: 25.277500,
    longitude: 55.297000,
    floors: 6,
    is_accessible: true,
    description: 'Science labs, lecture halls, and faculty offices',
    operating_hours: JSON.stringify({
      monday: { open: '06:00', close: '20:00' },
      tuesday: { open: '06:00', close: '20:00' },
      wednesday: { open: '06:00', close: '20:00' },
      thursday: { open: '06:00', close: '20:00' },
      friday: { open: '08:00', close: '16:00' },
      saturday: { closed: true },
      sunday: { closed: true }
    })
  },
  {
    building_id: '550e8400-e29b-41d4-a716-446655440003',
    code: 'ENG',
    name: 'Engineering Complex',
    address: '789 Innovation Dr, Dubai, UAE',
    latitude: 25.275500,
    longitude: 55.298500,
    floors: 5,
    is_accessible: true,
    description: 'Engineering labs, workshop spaces, and project rooms',
    operating_hours: JSON.stringify({
      monday: { open: '06:00', close: '21:00' },
      tuesday: { open: '06:00', close: '21:00' },
      wednesday: { open: '06:00', close: '21:00' },
      thursday: { open: '06:00', close: '21:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '09:00', close: '15:00' },
      sunday: { closed: true }
    })
  },
  {
    building_id: '550e8400-e29b-41d4-a716-446655440004',
    code: 'STU',
    name: 'Student Center',
    address: '321 Campus Life Way, Dubai, UAE',
    latitude: 25.276200,
    longitude: 55.295800,
    floors: 3,
    is_accessible: true,
    description: 'Student services, dining, recreation, and meeting spaces',
    operating_hours: JSON.stringify({
      monday: { open: '07:00', close: '23:00' },
      tuesday: { open: '07:00', close: '23:00' },
      wednesday: { open: '07:00', close: '23:00' },
      thursday: { open: '07:00', close: '23:00' },
      friday: { open: '07:00', close: '23:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '10:00', close: '21:00' }
    })
  },
  {
    building_id: '550e8400-e29b-41d4-a716-446655440005',
    code: 'GYM',
    name: 'Sports Complex',
    address: '654 Athletic Ave, Dubai, UAE',
    latitude: 25.274800,
    longitude: 55.294500,
    floors: 2,
    is_accessible: true,
    description: 'Gymnasium, fitness center, and sports facilities',
    operating_hours: JSON.stringify({
      monday: { open: '05:00', close: '22:00' },
      tuesday: { open: '05:00', close: '22:00' },
      wednesday: { open: '05:00', close: '22:00' },
      thursday: { open: '05:00', close: '22:00' },
      friday: { open: '06:00', close: '20:00' },
      saturday: { open: '07:00', close: '19:00' },
      sunday: { open: '08:00', close: '18:00' }
    })
  }
];

const sampleRooms = [
  // Library rooms
  { room_id: '550e8400-e29b-41d4-a716-446655440101', building_id: '550e8400-e29b-41d4-a716-446655440001', code: 'LIB-101', name: 'Study Room A', floor: 1, type: 'STUDY_ROOM', capacity: 8, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440102', building_id: '550e8400-e29b-41d4-a716-446655440001', code: 'LIB-102', name: 'Study Room B', floor: 1, type: 'STUDY_ROOM', capacity: 6, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440103', building_id: '550e8400-e29b-41d4-a716-446655440001', code: 'LIB-201', name: 'Computer Lab', floor: 2, type: 'LABORATORY', capacity: 30, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440104', building_id: '550e8400-e29b-41d4-a716-446655440001', code: 'LIB-301', name: 'Lecture Hall', floor: 3, type: 'LECTURE_HALL', capacity: 100, is_bookable: true, is_accessible: true },
  
  // Science building rooms
  { room_id: '550e8400-e29b-41d4-a716-446655440105', building_id: '550e8400-e29b-41d4-a716-446655440002', code: 'SCI-101', name: 'Chemistry Lab A', floor: 1, type: 'LABORATORY', capacity: 24, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440106', building_id: '550e8400-e29b-41d4-a716-446655440002', code: 'SCI-102', name: 'Physics Lab', floor: 1, type: 'LABORATORY', capacity: 20, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440107', building_id: '550e8400-e29b-41d4-a716-446655440002', code: 'SCI-201', name: 'Lecture Hall A', floor: 2, type: 'LECTURE_HALL', capacity: 120, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440108', building_id: '550e8400-e29b-41d4-a716-446655440002', code: 'SCI-202', name: 'Lecture Hall B', floor: 2, type: 'LECTURE_HALL', capacity: 80, is_bookable: true, is_accessible: true },
  
  // Engineering rooms
  { room_id: '550e8400-e29b-41d4-a716-446655440109', building_id: '550e8400-e29b-41d4-a716-446655440003', code: 'ENG-101', name: 'Workshop A', floor: 1, type: 'LABORATORY', capacity: 16, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440110', building_id: '550e8400-e29b-41d4-a716-446655440003', code: 'ENG-201', name: 'Project Room', floor: 2, type: 'MEETING_ROOM', capacity: 12, is_bookable: true, is_accessible: true },
  
  // Student Center rooms
  { room_id: '550e8400-e29b-41d4-a716-446655440111', building_id: '550e8400-e29b-41d4-a716-446655440004', code: 'STU-101', name: 'Meeting Room A', floor: 1, type: 'MEETING_ROOM', capacity: 10, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440112', building_id: '550e8400-e29b-41d4-a716-446655440004', code: 'STU-201', name: 'Event Hall', floor: 2, type: 'CONFERENCE_ROOM', capacity: 200, is_bookable: true, is_accessible: true },
  
  // Sports Complex
  { room_id: '550e8400-e29b-41d4-a716-446655440113', building_id: '550e8400-e29b-41d4-a716-446655440005', code: 'GYM-101', name: 'Basketball Court', floor: 1, type: 'SPORTS_VENUE', capacity: 50, is_bookable: true, is_accessible: true },
  { room_id: '550e8400-e29b-41d4-a716-446655440114', building_id: '550e8400-e29b-41d4-a716-446655440005', code: 'GYM-102', name: 'Fitness Room', floor: 1, type: 'SPORTS_VENUE', capacity: 25, is_bookable: true, is_accessible: true }
];

const samplePaths = [
  { from_building: '550e8400-e29b-41d4-a716-446655440001', to_building: '550e8400-e29b-41d4-a716-446655440002', distance: 150, estimated_time: 2, path_type: 'WALKWAY', is_accessible: true },
  { from_building: '550e8400-e29b-41d4-a716-446655440001', to_building: '550e8400-e29b-41d4-a716-446655440004', distance: 120, estimated_time: 2, path_type: 'WALKWAY', is_accessible: true },
  { from_building: '550e8400-e29b-41d4-a716-446655440002', to_building: '550e8400-e29b-41d4-a716-446655440003', distance: 200, estimated_time: 3, path_type: 'WALKWAY', is_accessible: true },
  { from_building: '550e8400-e29b-41d4-a716-446655440003', to_building: '550e8400-e29b-41d4-a716-446655440004', distance: 180, estimated_time: 2, path_type: 'WALKWAY', is_accessible: true },
  { from_building: '550e8400-e29b-41d4-a716-446655440004', to_building: '550e8400-e29b-41d4-a716-446655440005', distance: 160, estimated_time: 2, path_type: 'WALKWAY', is_accessible: true },
  { from_building: '550e8400-e29b-41d4-a716-446655440002', to_building: '550e8400-e29b-41d4-a716-446655440005', distance: 300, estimated_time: 4, path_type: 'WALKWAY', is_accessible: true }
];

async function createSampleData() {
  try {
    console.log('🌱 Creating sample campus data...\n');
    
    // Insert buildings
    console.log('📍 Adding buildings...');
    for (const building of sampleBuildings) {
      const query = `
        INSERT INTO buildings (building_id, code, name, address, latitude, longitude, floors, is_accessible, description, operating_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (building_id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          updated_at = NOW()
      `;
      
      await database.query(query, [
        building.building_id,
        building.code,
        building.name,
        building.address,
        building.latitude,
        building.longitude,
        building.floors,
        building.is_accessible,
        building.description,
        building.operating_hours
      ]);
      console.log(`  ✅ ${building.code} - ${building.name}`);
    }
    
    // Insert rooms
    console.log('\n🏠 Adding rooms...');
    for (const room of sampleRooms) {
      const query = `
        INSERT INTO rooms (room_id, building_id, code, name, floor, type, capacity, is_bookable, is_accessible, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (room_id) DO UPDATE SET
          name = EXCLUDED.name,
          capacity = EXCLUDED.capacity,
          updated_at = NOW()
      `;
      
      await database.query(query, [
        room.room_id,
        room.building_id,
        room.code,
        room.name,
        room.floor,
        room.type,
        room.capacity,
        room.is_bookable,
        room.is_accessible,
        true
      ]);
      console.log(`  ✅ ${room.code} - ${room.name}`);
    }
    
    // Insert paths
    console.log('\n🛤️  Adding campus paths...');
    for (const path of samplePaths) {
      const query = `
        INSERT INTO map_paths (from_building, to_building, distance, estimated_time, path_type, is_accessible)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (from_building, to_building) DO UPDATE SET
          distance = EXCLUDED.distance,
          estimated_time = EXCLUDED.estimated_time,
          updated_at = NOW()
      `;
      
      await database.query(query, [
        path.from_building,
        path.to_building,
        path.distance,
        path.estimated_time,
        path.path_type,
        path.is_accessible
      ]);
      console.log(`  ✅ ${path.from_building} → ${path.to_building} (${path.distance}m)`);
    }
    
    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${sampleBuildings.length} buildings`);
    console.log(`  • ${sampleRooms.length} rooms`);
    console.log(`  • ${samplePaths.length} walking paths`);
    
  } catch (error) {
    console.error('\n❌ Error creating sample data:', error);
    process.exit(1);
  } finally {
    await database.close();
    process.exit(0);
  }
}

createSampleData();