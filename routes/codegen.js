const express = require('express');
const Project = require('../models/Project');
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

// Generate HTML/CSS from wireframe
router.post('/generate-html/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { framework = 'html', responsive = true } = req.body;

    if (!req.user.isPro()) {
      return res.status(403).json({ 
        message: 'Code generation is a Pro feature',
        upgradeRequired: true 
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const codeGeneration = generateCode(project.canvasData, framework, responsive);

    res.json({
      success: true,
      code: codeGeneration,
      message: 'Code generated successfully'
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ message: 'Failed to generate code' });
  }
});

// Generate design specifications
router.get('/specs/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const specifications = generateDesignSpecs(project);

    res.json({
      success: true,
      specifications,
      message: 'Design specifications generated successfully'
    });
  } catch (error) {
    console.error('Specs generation error:', error);
    res.status(500).json({ message: 'Failed to generate specifications' });
  }
});

// Generate component code
router.post('/component-code/:componentId', authenticateToken, async (req, res) => {
  try {
    const { componentId } = req.params;
    const { framework = 'react' } = req.body;

    const component = await Component.findById(componentId);
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Check if user has access to component
    if (component.creator.toString() !== req.user._id.toString() && !component.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const componentCode = generateComponentCode(component, framework);

    res.json({
      success: true,
      code: componentCode,
      message: 'Component code generated successfully'
    });
  } catch (error) {
    console.error('Component code generation error:', error);
    res.status(500).json({ message: 'Failed to generate component code' });
  }
});

// Helper function to generate code from canvas data
function generateCode(canvasData, framework, responsive) {
  const elements = canvasData.elements || [];
  
  let html = '';
  let css = '';
  let js = '';

  // Generate HTML structure
  html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Design</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
`;

  elements.forEach((element, index) => {
    const className = `element-${index}`;
    
    switch (element.type) {
      case 'rectangle':
        html += `        <div class="${className}">${element.text || ''}</div>\n`;
        break;
      case 'text':
        html += `        <p class="${className}">${element.text || 'Text content'}</p>\n`;
        break;
      case 'button':
        html += `        <button class="${className}">${element.text || 'Button'}</button>\n`;
        break;
      case 'input':
        html += `        <input type="text" class="${className}" placeholder="${element.text || 'Enter text'}">\n`;
        break;
      case 'image':
        html += `        <img src="placeholder.jpg" alt="${element.text || 'Image'}" class="${className}">\n`;
        break;
      default:
        html += `        <div class="${className}">${element.text || ''}</div>\n`;
    }
  });

  html += `    </div>
</body>
</html>`;

  // Generate CSS
  css = `/* Generated CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

`;

  elements.forEach((element, index) => {
    const className = `.element-${index}`;
    
    css += `${className} {
    position: absolute;
    left: ${element.x}px;
    top: ${element.y}px;
    width: ${element.width}px;
    height: ${element.height}px;`;

    if (element.style) {
      if (element.style.fill && element.style.fill !== 'transparent') {
        css += `\n    background-color: ${element.style.fill};`;
      }
      if (element.style.stroke) {
        css += `\n    border: ${element.style.strokeWidth || 1}px solid ${element.style.stroke};`;
      }
    }

    // Add element-specific styles
    switch (element.type) {
      case 'button':
        css += `\n    cursor: pointer;
    border-radius: 4px;
    border: none;
    font-weight: 500;
    transition: all 0.2s ease;`;
        break;
      case 'input':
        css += `\n    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;`;
        break;
      case 'text':
        css += `\n    font-size: 16px;
    line-height: 1.5;`;
        break;
    }

    css += `\n}\n\n`;
  });

  // Add responsive styles if requested
  if (responsive) {
    css += `/* Responsive Design */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    /* Make elements responsive */
`;

    elements.forEach((element, index) => {
      css += `    .element-${index} {
        position: relative;
        width: 100%;
        margin-bottom: 10px;
    }
    `;
    });

    css += `}\n`;
  }

  // Generate framework-specific code
  if (framework === 'react') {
    const reactComponent = generateReactComponent(elements);
    js = reactComponent;
  } else if (framework === 'vue') {
    const vueComponent = generateVueComponent(elements);
    js = vueComponent;
  }

  return {
    html,
    css,
    js,
    framework,
    responsive
  };
}

// Helper function to generate React component
function generateReactComponent(elements) {
  let component = `import React from 'react';
import './styles.css';

const GeneratedComponent = () => {
  return (
    <div className="container">
`;

  elements.forEach((element, index) => {
    const className = `element-${index}`;
    
    switch (element.type) {
      case 'button':
        component += `      <button className="${className}" onClick={() => console.log('Button clicked')}>
        ${element.text || 'Button'}
      </button>\n`;
        break;
      case 'input':
        component += `      <input 
        type="text" 
        className="${className}" 
        placeholder="${element.text || 'Enter text'}"
        onChange={(e) => console.log(e.target.value)}
      />\n`;
        break;
      case 'text':
        component += `      <p className="${className}">${element.text || 'Text content'}</p>\n`;
        break;
      default:
        component += `      <div className="${className}">${element.text || ''}</div>\n`;
    }
  });

  component += `    </div>
  );
};

export default GeneratedComponent;`;

  return component;
}

// Helper function to generate Vue component
function generateVueComponent(elements) {
  let template = `<template>
  <div class="container">
`;

  elements.forEach((element, index) => {
    const className = `element-${index}`;
    
    switch (element.type) {
      case 'button':
        template += `    <button class="${className}" @click="handleClick">
      ${element.text || 'Button'}
    </button>\n`;
        break;
      case 'input':
        template += `    <input 
      type="text" 
      class="${className}" 
      :placeholder="'${element.text || 'Enter text'}'"
      v-model="inputValue"
    />\n`;
        break;
      case 'text':
        template += `    <p class="${className}">${element.text || 'Text content'}</p>\n`;
        break;
      default:
        template += `    <div class="${className}">${element.text || ''}</div>\n`;
    }
  });

  template += `  </div>
</template>

<script>
export default {
  name: 'GeneratedComponent',
  data() {
    return {
      inputValue: ''
    };
  },
  methods: {
    handleClick() {
      console.log('Button clicked');
    }
  }
};
</script>

<style scoped>
/* Component styles will be imported from external CSS */
</style>`;

  return template;
}

// Helper function to generate design specifications
function generateDesignSpecs(project) {
  const elements = project.canvasData?.elements || [];
  
  // Extract design tokens
  const colors = new Set();
  const fonts = new Set();
  const spacing = new Set();
  
  elements.forEach(element => {
    if (element.style?.fill) colors.add(element.style.fill);
    if (element.style?.stroke) colors.add(element.style.stroke);
    if (element.style?.fontFamily) fonts.add(element.style.fontFamily);
    if (element.x) spacing.add(element.x);
    if (element.y) spacing.add(element.y);
  });

  return {
    project: {
      title: project.title,
      type: project.type,
      createdAt: project.createdAt
    },
    designTokens: {
      colors: Array.from(colors).map(color => ({
        value: color,
        usage: 'Primary color usage'
      })),
      typography: Array.from(fonts).map(font => ({
        fontFamily: font,
        usage: 'Body text'
      })),
      spacing: {
        values: Array.from(spacing).sort((a, b) => a - b),
        scale: 'Custom spacing scale'
      }
    },
    elements: elements.map((element, index) => ({
      id: `element-${index}`,
      type: element.type,
      dimensions: {
        width: element.width,
        height: element.height
      },
      position: {
        x: element.x,
        y: element.y
      },
      styles: element.style || {},
      content: element.text || ''
    })),
    accessibility: {
      score: project.accessibilityScore || 'Not analyzed',
      recommendations: [
        'Add alt text to images',
        'Ensure sufficient color contrast',
        'Provide keyboard navigation support'
      ]
    },
    notes: [
      'This specification was auto-generated from your UXPilot design',
      'Review and adjust measurements as needed for your implementation',
      'Consider responsive breakpoints for mobile devices'
    ]
  };
}

// Helper function to generate component code
function generateComponentCode(component, framework) {
  const designData = component.designData || {};
  
  switch (framework) {
    case 'react':
      return `import React from 'react';
import PropTypes from 'prop-types';
import './styles.css';

const ${component.name.replace(/\s+/g, '')} = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  ...props 
}) => {
  const className = \`component-\${component.name.toLowerCase().replace(/\s+/g, '-')} \${variant} \${size}\`;
  
  return (
    <div 
      className={className}
      onClick={!disabled ? onClick : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

${component.name.replace(/\s+/g, '')}.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default ${component.name.replace(/\s+/g, '')};`;

    case 'vue':
      return `<template>
  <div 
    :class="componentClass"
    @click="handleClick"
    v-bind="$attrs"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: '${component.name.replace(/\s+/g, '')}',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'secondary', 'outline'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    componentClass() {
      return \`component-\${this.$options.name.toLowerCase()} \${this.variant} \${this.size}\`;
    }
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        this.$emit('click', event);
      }
    }
  }
};
</script>

<style scoped>
/* Component styles */
</style>`;

    default:
      return component.codeSnippets?.html || `<!-- ${component.name} Component -->
<div class="component-${component.name}`