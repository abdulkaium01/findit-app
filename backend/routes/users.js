const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile (protected)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's items (protected)
router.get('/my-items', auth, async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user.id }).sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      results: items.length,
      data: { items }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile (protected)
router.patch('/profile', auth, async (req, res) => {
  try {
    // Filter out fields that shouldn't be updated
    const filteredBody = {};
    if (req.body.name) filteredBody.name = req.body.name;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;