const express = require('express');
const multer = require('multer');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Upload design for analysis
router.post('/upload', authenticateToken, upload.single('design'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// Export project
router.post('/export/:id', authenticateToken, async (req, res) => {
  try {
    const { format } = req.body; // 'pdf', 'notion', 'figma'
    
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Add export to history
    project.exportHistory.push({
      format: format,
      exportedAt: new Date()
    });
    
    await project.save();
    
    // In a real implementation, you would generate the actual export file
    // For now, we'll return export data
    let exportData;
    
    switch (format) {
      case 'pdf':
        exportData = {
          type: 'pdf',
          downloadUrl: `/api/design/download/${project._id}/pdf`,
          message: 'PDF export ready for download'
        };
        break;
      case 'notion':
        exportData = {
          type: 'notion',
          notionBlocks: this.generateNotionBlocks(project),
          message: 'Notion blocks generated. Copy and paste into your Notion page.'
        };
        break;
      case 'figma':
        exportData = {
          type: 'figma',
          figmaUrl: `https://figma.com/import?data=${encodeURIComponent(JSON.stringify(project.canvasData))}`,
          message: 'Figma import URL generated'
        };
        break;
      default:
        return res.status(400).json({ message: 'Invalid export format' });
    }
    
    res.json({
      success: true,
      export: exportData,
      message: `Project exported to ${format} successfully`
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export project' });
  }
});

// Save canvas data
router.post('/save-canvas', authenticateToken, async (req, res) => {
  try {
    const { projectId, canvasData, title } = req.body;
    
    if (projectId) {
      // Update existing project
      const project = await Project.findOneAndUpdate(
        { _id: projectId, userId: req.user._id },
        { 
          canvasData: canvasData,
          ...(title && { title })
        },
        { new: true }
      );
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json({
        success: true,
        project,
        message: 'Canvas saved successfully'
      });
    } else {
      // Create new project
      const project = new Project({
        userId: req.user._id,
        title: title || 'Untitled Canvas',
        type: 'wireframe',
        prompt: 'Manual canvas creation',
        canvasData: canvasData
      });
      
      await project.save();
      
      res.json({
        success: true,
        project,
        message: 'Canvas created and saved successfully'
      });
    }
  } catch (error) {
    console.error('Save canvas error:', error);
    res.status(500).json({ message: 'Failed to save canvas' });
  }
});

// Helper function to generate Notion blocks
function generateNotionBlocks(project) {
  return [
    {
      type: 'heading_1',
      heading_1: {
        rich_text: [{ type: 'text', text: { content: project.title } }]
      }
    },
    {
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: project.description || 'No description provided.' } }]
      }
    },
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Project Details' } }]
      }
    },
    {
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: `Type: ${project.type}` } }]
      }
    },
    {
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: `Created: ${project.createdAt.toDateString()}` } }]
      }
    }
  ];
}

module.exports = router;
