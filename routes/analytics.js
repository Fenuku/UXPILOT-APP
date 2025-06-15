const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Team = require('../models/Team');
const Comment = require('../models/Comment');
const Component = require('../models/Component');
const jwt = require('jsonwebtoken');

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

// Get user analytics dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get project statistics
    const projectStats = await Project.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          totalCount: { $sum: '$count' },
          dailyData: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          }
        }
      }
    ]);

    // Get accessibility scores
    const accessibilityStats = await Project.aggregate([
      {
        $match: {
          userId: req.user._id,
          accessibilityScore: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$accessibilityScore' },
          minScore: { $min: '$accessibilityScore' },
          maxScore: { $max: '$accessibilityScore' },
          totalProjects: { $sum: 1 }
        }
      }
    ]);

    // Get dark pattern detection stats
    const darkPatternStats = await Project.aggregate([
      {
        $match: {
          userId: req.user._id,
          'darkPatternAnalysis.detected': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$darkPatternAnalysis.detected',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get collaboration stats
    const collaborationStats = await Comment.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'projectData'
        }
      },
      {
        $match: {
          'projectData.userId': req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get component usage stats
    const componentStats = await Component.aggregate([
      {
        $match: {
          creator: req.user._id
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usage.timesUsed' }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        timeRange,
        projects: {
          stats: projectStats,
          total: await Project.countDocuments({ userId: req.user._id })
        },
        accessibility: accessibilityStats[0] || {
          averageScore: 0,
          minScore: 0,
          maxScore: 0,
          totalProjects: 0
        },
        darkPatterns: darkPatternStats,
        collaboration: collaborationStats,
        components: componentStats,
        summary: {
          projectsCreated: projectStats.reduce((sum, stat) => sum + stat.totalCount, 0),
          commentsReceived: collaborationStats.reduce((sum, stat) => sum + stat.count, 0),
          componentsCreated: componentStats.reduce((sum, stat) => sum + stat.count, 0),
          avgAccessibilityScore: accessibilityStats[0]?.averageScore || 0
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

// Get team analytics (Pro feature)
router.get('/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { timeRange = '30d' } = req.query;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has access to team analytics
    const isMember = team.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!team.subscription.features.advancedAnalytics) {
      return res.status(403).json({ 
        message: 'Advanced analytics is an Enterprise feature',
        upgradeRequired: true 
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const memberIds = team.members.map(m => m.user);

    // Team project statistics
    const teamProjectStats = await Project.aggregate([
      {
        $match: {
          userId: { $in: memberIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $group: {
          _id: {
            creator: { $arrayElemAt: ['$creator.name', 0] },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Team collaboration metrics
    const collaborationMetrics = await Comment.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'projectData'
        }
      },
      {
        $match: {
          'projectData.userId': { $in: memberIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      {
        $group: {
          _id: {
            author: { $arrayElemAt: ['$authorData.name', 0] },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Component library usage
    const componentUsage = await Component.aggregate([
      {
        $match: {
          team: team._id
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usage.timesUsed' },
          avgUsage: { $avg: '$usage.timesUsed' }
        }
      }
    ]);

    res.json({
      success: true,
      teamAnalytics: {
        team: {
          name: team.name,
          memberCount: team.members.length
        },
        projects: teamProjectStats,
        collaboration: collaborationMetrics,
        components: componentUsage,
        summary: {
          totalProjects: teamProjectStats.reduce((sum, stat) => sum + stat.count, 0),
          totalComments: collaborationMetrics.reduce((sum, stat) => sum + stat.count, 0),
          totalComponents: componentUsage.reduce((sum, stat) => sum + stat.count, 0),
          avgComponentUsage: componentUsage.reduce((sum, stat) => sum + stat.avgUsage, 0) / (componentUsage.length || 1)
        }
      }
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({ message: 'Failed to get team analytics' });
  }
});

// Generate design performance report
router.post('/performance-report', authenticateToken, async (req, res) => {
  try {
    const { projectIds, metrics = ['accessibility', 'usability', 'consistency'] } = req.body;

    if (!req.user.isPro()) {
      return res.status(403).json({ 
        message: 'Performance reports are a Pro feature',
        upgradeRequired: true 
      });
    }

    const projects = await Project.find({
      _id: { $in: projectIds },
      userId: req.user._id
    });

    const report = {
      generatedAt: new Date(),
      projectCount: projects.length,
      metrics: {}
    };

    if (metrics.includes('accessibility')) {
      const accessibilityScores = projects
        .filter(p => p.accessibilityScore)
        .map(p => p.accessibilityScore);
      
      report.metrics.accessibility = {
        average: accessibilityScores.reduce((a, b) => a + b, 0) / accessibilityScores.length || 0,
        min: Math.min(...accessibilityScores) || 0,
        max: Math.max(...accessibilityScores) || 0,
        distribution: {
          excellent: accessibilityScores.filter(s => s >= 90).length,
          good: accessibilityScores.filter(s => s >= 70 && s < 90).length,
          needsImprovement: accessibilityScores.filter(s => s < 70).length
        }
      };
    }

    if (metrics.includes('usability')) {
      // Simulate usability scoring based on project complexity and feedback
      const usabilityScores = projects.map(project => {
        let score = 85; // Base score
        
        // Adjust based on dark pattern analysis
        if (project.darkPatternAnalysis?.detected) {
          score -= project.darkPatternAnalysis.patterns.length * 10;
        }
        
        // Adjust based on project complexity (element count)
        const elementCount = project.canvasData?.elements?.length || 0;
        if (elementCount > 20) score -= 5;
        if (elementCount > 50) score -= 10;
        
        return Math.max(0, Math.min(100, score));
      });

      report.metrics.usability = {
        average: usabilityScores.reduce((a, b) => a + b, 0) / usabilityScores.length || 0,
        min: Math.min(...usabilityScores) || 0,
        max: Math.max(...usabilityScores) || 0
      };
    }

    if (metrics.includes('consistency')) {
      // Analyze design consistency across projects
      const colorUsage = new Map();
      const fontUsage = new Map();
      
      projects.forEach(project => {
        if (project.canvasData?.elements) {
          project.canvasData.elements.forEach(element => {
            if (element.style?.fill) {
              colorUsage.set(element.style.fill, (colorUsage.get(element.style.fill) || 0) + 1);
            }
            if (element.style?.fontFamily) {
              fontUsage.set(element.style.fontFamily, (fontUsage.get(element.style.fontFamily) || 0) + 1);
            }
          });
        }
      });

      report.metrics.consistency = {
        colorVariations: colorUsage.size,
        fontVariations: fontUsage.size,
        consistencyScore: Math.max(0, 100 - (colorUsage.size * 2) - (fontUsage.size * 3))
      };
    }

    // Generate recommendations
    report.recommendations = [];
    
    if (report.metrics.accessibility?.average < 80) {
      report.recommendations.push({
        type: 'accessibility',
        priority: 'high',
        message: 'Focus on improving accessibility scores by adding alt text, improving color contrast, and ensuring keyboard navigation.'
      });
    }

    if (report.metrics.consistency?.consistencyScore < 70) {
      report.recommendations.push({
        type: 'consistency',
        priority: 'medium',
        message: 'Consider creating a design system to maintain consistency across projects.'
      });
    }

    res.json({
      success: true,
      report,
      message: 'Performance report generated successfully'
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate performance report' });
  }
});

module.exports = router;
