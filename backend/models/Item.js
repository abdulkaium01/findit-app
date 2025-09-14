const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'accessories', 'documents', 'jewelry', 'other']
  },
  type: {
    type: String,
    required: true,
    enum: ['lost', 'found']
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);