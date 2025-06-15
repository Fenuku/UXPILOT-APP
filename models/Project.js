const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['wireframe', 'journey-map', 'component', 'analysis'],
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  canvasData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  aiResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  darkPatternAnalysis: {
    detected: {
      type: Boolean,
      default: false
    },
    patterns: [{
      type: {
        type: String
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      description: String,
      suggestion: String
    }]
  },
  accessibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  tags: [{
    type: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  exportHistory: [{
    format: {
      type: String,
      enum: ['pdf', 'notion', 'figma']
    },
    exportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ type: 1 });
projectSchema.index({ tags: 1 });

module.exports = mongoose.model('Project', projectSchema);
