const express = require('express');
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Component = require('../models/Component');
const DesignSystem = require('../models/DesignSystem');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Create team
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, plan = 'team' } = req.body;

    const team = new Team({
      name,
      description,
      owner: req.user._id,
      members: [{
        user: req.user._id,
        role: 'owner',
        permissions: {
          canEdit: true,
          canComment: true,
          canExport: true,
          canInvite: true,
          canManageMembers: true
        }
      }],
      subscription: {
        plan,
        maxMembers: plan === 'enterprise' ? 100 : 10,
        features: {
          realTimeCollaboration: true,
          advancedAnalytics: plan === 'enterprise',
          ssoIntegration: plan === 'enterprise',
          whiteLabel: plan === 'enterprise',
          apiAccess: plan === 'enterprise'
        }
      }
    });

    await team.save();

    res.json({
      success: true,
      team,
      message: 'Team created successfully'
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Failed to create team' });
  }
});

// Get user teams
router.get('/my-teams', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar');

    res.json({
      success: true,
      teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Failed to get teams' });
  }
});

// Invite team member
router.post('/:teamId/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role = 'editor' } = req.body;
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has permission to invite
    const userMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!userMember || !userMember.permissions.canInvite) {
      return res.status(403).json({ message: 'No permission to invite members' });
    }

    // Check if user already exists
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found. They need to create an account first.' });
    }

    // Check if already a member
    const existingMember = team.members.find(m => m.user.toString() === invitedUser._id.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Check team member limit
    if (team.members.length >= team.subscription.maxMembers) {
      return res.status(400).json({ message: 'Team member limit reached' });
    }

    // Add member to team
    const permissions = {
      canEdit: role !== 'viewer',
      canComment: true,
      canExport: role !== 'viewer',
      canInvite: role === 'admin' || role === 'owner',
      canManageMembers: role === 'admin' || role === 'owner'
    };

    team.members.push({
      user: invitedUser._id,
      role,
      permissions
    });

    await team.save();

    // Send invitation email (if email service is configured)
    if (process.env.EMAIL_HOST) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `You've been invited to join ${team.name} on UXPilot`,
          html: `
            <h2>Team Invitation</h2>
            <p>You've been invited to join the team "${team.name}" on UXPilot.</p>
            <p>Role: ${role}</p>
            <p><a href="${process.env.FRONTEND_URL}/dashboard">Login to UXPilot</a> to start collaborating!</p>
          `
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Team member invited successfully'
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Failed to invite team member' });
  }
});

// Get team projects
router.get('/:teamId/projects', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { page = 1, limit = 10, type, search } = req.query;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is team member
    const isMember = team.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    // Get team member IDs
    const memberIds = team.members.map(m => m.user);

    const query = { userId: { $in: memberIds } };
    if (type && type !== 'all') {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get team projects error:', error);
    res.status(500).json({ message: 'Failed to get team projects' });
  }
});

// Add comment to project
router.post('/projects/:projectId/comments', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, position, type = 'general', mentions = [] } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const comment = new Comment({
      project: projectId,
      author: req.user._id,
      content,
      position,
      type,
      mentions
    });

    await comment.save();
    await comment.populate('author', 'name avatar');

    res.json({
      success: true,
      comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Get project comments
router.get('/projects/:projectId/comments', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const query = { project: projectId };
    if (status) {
      query.status = status;
    }

    const comments = await Comment.find(query)
      .populate('author', 'name avatar')
      .populate('replies.author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to get comments' });
  }
});

// Create component library
router.post('/:teamId/components', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, category, designData, codeSnippets, designTokens, tags = [] } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const component = new Component({
      name,
      description,
      category,
      tags,
      creator: req.user._id,
      team: teamId,
      designData,
      codeSnippets,
      designTokens
    });

    await component.save();

    res.json({
      success: true,
      component,
      message: 'Component created successfully'
    });
  } catch (error) {
    console.error('Create component error:', error);
    res.status(500).json({ message: 'Failed to create component' });
  }
});

// Get team components
router.get('/:teamId/components', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { category, search } = req.query;

    const query = { team: teamId };
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const components = await Component.find(query)
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      components
    });
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({ message: 'Failed to get components' });
  }
});

// Create design system
router.post('/:teamId/design-system', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, brandGuidelines, tokens, documentation } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const designSystem = new DesignSystem({
      name,
      description,
      team: teamId,
      creator: req.user._id,
      brandGuidelines,
      tokens,
      documentation
    });

    await designSystem.save();

    res.json({
      success: true,
      designSystem,
      message: 'Design system created successfully'
    });
  } catch (error) {
    console.error('Create design system error:', error);
    res.status(500).json({ message: 'Failed to create design system' });
  }
});

module.exports = router;
