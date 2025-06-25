const express = require('express');
const { query, validationResult } = require('express-validator');
const database = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Get all buildings for map display
router.get('/buildings', async (req, res) => {
  try {
    const result = await database.query(`
      SELECT building_id, code, name, address, latitude, longitude, floors, is_accessible, description
      FROM buildings 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY name
    `);

    const buildings = result.rows.map(row => ({
      id: row.building_id,
      code: row.code,
      name: row.name,
      address: row.address,
      coordinates: {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude)
      },
      floors: row.floors,
      isAccessible: row.is_accessible,
      description: row.description
    }));

    res.json({
      success: true,
      data: buildings
    });

  } catch (error) {
    logger.error('Get navigation buildings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get directions between two buildings
router.get('/directions', [
  query('from').notEmpty().withMessage('From building is required'),
  query('to').notEmpty().withMessage('To building is required'),
  query('accessible').optional().isBoolean()
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

    const { from, to, accessible } = req.query;
    const requireAccessible = accessible === 'true';

    // Get building details
    const buildingsQuery = `
      SELECT building_id, code, name, latitude, longitude, is_accessible
      FROM buildings 
      WHERE code = $1 OR code = $2
    `;
    
    const buildingsResult = await database.query(buildingsQuery, [from, to]);
    
    if (buildingsResult.rows.length < 2) {
      return res.status(404).json({
        success: false,
        error: 'One or both buildings not found'
      });
    }

    const fromBuilding = buildingsResult.rows.find(b => b.code === from);
    const toBuilding = buildingsResult.rows.find(b => b.code === to);

    // Check accessibility requirements
    if (requireAccessible && (!fromBuilding.is_accessible || !toBuilding.is_accessible)) {
      return res.status(400).json({
        success: false,
        error: 'One or both buildings are not accessible'
      });
    }

    // Calculate direct distance (simplified for demo)
    const distance = calculateDistance(
      parseFloat(fromBuilding.latitude),
      parseFloat(fromBuilding.longitude),
      parseFloat(toBuilding.latitude),
      parseFloat(toBuilding.longitude)
    );
    
    const route = {
      distance: Math.round(distance),
      estimatedTime: Math.ceil(distance / 75), // Assume 75m/min walking speed
      pathType: 'WALKWAY',
      isAccessible: fromBuilding.is_accessible && toBuilding.is_accessible,
      waypoints: [
        {
          lat: parseFloat(fromBuilding.latitude),
          lng: parseFloat(fromBuilding.longitude),
          name: fromBuilding.name
        },
        {
          lat: parseFloat(toBuilding.latitude),
          lng: parseFloat(toBuilding.longitude),
          name: toBuilding.name
        }
      ]
    };

    res.json({
      success: true,
      data: {
        from: {
          id: fromBuilding.building_id,
          code: fromBuilding.code,
          name: fromBuilding.name,
          coordinates: {
            lat: parseFloat(fromBuilding.latitude),
            lng: parseFloat(fromBuilding.longitude)
          }
        },
        to: {
          id: toBuilding.building_id,
          code: toBuilding.code,
          name: toBuilding.name,
          coordinates: {
            lat: parseFloat(toBuilding.latitude),
            lng: parseFloat(toBuilding.longitude)
          }
        },
        route
      }
    });

  } catch (error) {
    logger.error('Get directions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Search for buildings and rooms
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['building', 'room', 'all'])
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

    const searchQuery = req.query.q.toLowerCase();
    const searchType = req.query.type || 'all';
    const results = [];

    // Search buildings
    if (searchType === 'building' || searchType === 'all') {
      const buildingQuery = `
        SELECT building_id, code, name, address, latitude, longitude, description
        FROM buildings 
        WHERE LOWER(name) LIKE $1 
           OR LOWER(code) LIKE $1 
           OR LOWER(address) LIKE $1
           OR LOWER(description) LIKE $1
        ORDER BY name
        LIMIT 10
      `;
      
      const buildingResult = await database.query(buildingQuery, [`%${searchQuery}%`]);
      
      buildingResult.rows.forEach(row => {
        results.push({
          type: 'building',
          id: row.building_id,
          code: row.code,
          name: row.name,
          address: row.address,
          coordinates: row.latitude && row.longitude ? {
            lat: parseFloat(row.latitude),
            lng: parseFloat(row.longitude)
          } : null,
          description: row.description
        });
      });
    }

    // Room search disabled for demo - only buildings for now

    res.json({
      success: true,
      data: {
        query: req.query.q,
        results,
        total: results.length
      }
    });

  } catch (error) {
    logger.error('Navigation search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = router;