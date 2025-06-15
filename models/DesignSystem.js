const mongoose = require('mongoose');

const designSystemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandGuidelines: {
    logo: {
      primary: String,
      secondary: String,
      variations: [String]
    },
    colors: {
      primary: [{
        name: String,
        hex: String,
        rgb: String,
        hsl: String,
        usage: String
      }],
      secondary: [{
        name: String,
        hex: String,
        rgb: String,
        hsl: String,
        usage: String
      }],
      neutral: [{
        name: String,
        hex: String,
        rgb: String,
        hsl: String,
        usage: String
      }],
      semantic: [{
        name: String,
        hex: String,
        rgb: String,
        hsl: String,
        usage: String
      }]
    },
    typography: {
      fontFamilies: [{
        name: String,
        primary: Boolean,
        fallbacks: [String],
        weights: [String],
        usage: String
      }],
      scales: [{
        name: String,
        size: String,
        lineHeight: String,
        usage: String
      }]
    },
    spacing: {
      scale: [String],
      usage: [{
        name: String,
        value: String,
        description: String
      }]
    },
    elevation: [{
      name: String,
      value: String,
      usage: String
    }],
    borderRadius: [{
      name: String,
      value: String,
      usage: String
    }]
  },
  components: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component'
  }],
  tokens: {
    colors: mongoose.Schema.Types.Mixed,
    typography: mongoose.Schema.Types.Mixed,
    spacing: mongoose.Schema.Types.Mixed,
    shadows: mongoose.Schema.Types.Mixed,
    borders: mongoose.Schema.Types.Mixed
  },
  documentation: {
    principles: [String],
    guidelines: [String],
    doAndDonts: [{
      do: String,
      dont: String,
      example: String
    }]
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  changelog: [{
    version: String,
    changes: [String],
    date: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true
});

designSystemSchema.index({ team: 1 });
designSystemSchema.index({ creator: 1 });

module.exports = mongoose.model('DesignSystem', designSystemSchema);
