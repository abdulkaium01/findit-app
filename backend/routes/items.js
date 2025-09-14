const express = require('express');
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all items with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, category, search, status } = req.query;
    let filter = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    const items = await Item.find(filter)
      .populate('reportedBy', 'name email avatarColor')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      results: items.length,
      data: { items }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email avatarColor');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new item (protected)
router.post('/', [
  auth,
  body('name').not().isEmpty().withMessage('Item name is required'),
  body('description').not().isEmpty().withMessage('Description is required'),
  body('category').isIn(['electronics', 'clothing', 'accessories', 'documents', 'jewelry', 'other']).withMessage('Invalid category'),
  body('type').isIn(['lost', 'found']).withMessage('Type must be either lost or found'),
  body('location').not().isEmpty().withMessage('Location is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('contact').not().isEmpty().withMessage('Contact information is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const itemData = req.body;
    itemData.reportedBy = req.user.id;
    
    const item = await Item.create(itemData);
    
    // Populate the user data
    await item.populate('reportedBy', 'name email avatarColor');
    
    res.status(201).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an item (protected - only owner or admin)
router.patch('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user is owner or admin
    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email avatarColor');
    
    res.json({
      status: 'success',
      data: { item: updatedItem }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an item (protected - only owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user is owner or admin
    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    
    await Item.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stats for admin dashboard
router.get('/stats/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const totalItems = await Item.countDocuments();
    const lostItems = await Item.countDocuments({ type: 'lost' });
    const foundItems = await Item.countDocuments({ type: 'found' });
    const resolvedCases = await Item.countDocuments({ status: 'resolved' });
    
    res.json({
      status: 'success',
      data: {
        totalItems,
        lostItems,
        foundItems,
        resolvedCases
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;