const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['buttons', 'forms', 'navigation', 'cards', 'modals', 'layouts', 'icons', 'custom']
  },
  tags: [String],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  designData: {
    fabricObject: mongoose.Schema.Types.Mixed,
    preview: String, // Base64 image
    dimensions: {
      width: Number,
      height: Number
    }
  },
  codeSnippets: {
    html: String,
    css: String,
    react: String,
    vue: String,
    angular: String
  },
  designTokens: {
    colors: [{
      name: String,
      value: String,
      usage: String
    }],
    typography: [{
      name: String,
      fontFamily: String,
      fontSize: String,
      fontWeight: String,
      lineHeight: String
    }],
    spacing: [{
      name: String,
      value: String
    }],
    shadows: [{
      name: String,
      value: String
    }]
  },
  usage: {
    timesUsed: { type: Number, default: 0 },
    lastUsed: Date,
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessibility: {
    score: Number,
    issues: [String],
    recommendations: [String]
  }
}, {
  timestamps: true
});

componentSchema.index({ creator: 1, team: 1 });
componentSchema.index({ category: 1, tags: 1 });
componentSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Component', componentSchema);
