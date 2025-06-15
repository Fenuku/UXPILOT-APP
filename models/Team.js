const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canEdit: { type: Boolean, default: true },
      canComment: { type: Boolean, default: true },
      canExport: { type: Boolean, default: true },
      canInvite: { type: Boolean, default: false },
      canManageMembers: { type: Boolean, default: false }
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestComments: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['team', 'enterprise'],
      default: 'team'
    },
    maxMembers: {
      type: Number,
      default: 10
    },
    features: {
      realTimeCollaboration: { type: Boolean, default: true },
      advancedAnalytics: { type: Boolean, default: false },
      ssoIntegration: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false }
    }
  },
  brandSettings: {
    logo: String,
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    customDomain: String
  }
}, {
  timestamps: true
});

// Index for better query performance
teamSchema.index({ owner: 1 });
teamSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Team', teamSchema);
