const express = require('express');
const router = express.Router();

// Placeholder for admin routes
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes not yet implemented',
    data: []
  });
});

module.exports = router;