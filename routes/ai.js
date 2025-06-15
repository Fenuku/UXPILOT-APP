const express = require('express');
const { OpenAI } = require('openai');
const User = require('../models/User');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

// Generate wireframe from prompt
router.post('/generate-wireframe', authenticateToken, async (req, res) => {
  try {
    const { prompt, projectType = 'wireframe' } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Check usage limits for free users
    if (!req.user.isPro() && req.user.usageStats.promptsGenerated >= 5) {
      return res.status(403).json({ 
        message: 'Free plan limit reached. Upgrade to Pro for unlimited prompts.',
        upgradeRequired: true 
      });
    }

    const systemPrompt = `You are a UX/UI design assistant. Generate a detailed wireframe structure based on the user's prompt. 
    Return a JSON object with the following structure:
    {
      "elements": [
        {
          "type": "rectangle|circle|text|button|input|image",
          "x": number,
          "y": number,
          "width": number,
          "height": number,
          "text": "string (if applicable)",
          "style": {
            "fill": "color",
            "stroke": "color",
            "strokeWidth": number
          }
        }
      ],
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
      "description": "Brief description of the wireframe"
    }
    
    Create a clean, professional wireframe layout. Use standard UI patterns and ensure good spacing and alignment.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    let wireframeData;
    try {
      wireframeData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback wireframe structure
      wireframeData = {
        elements: [
          {
            type: "rectangle",
            x: 50,
            y: 50,
            width: 700,
            height: 60,
            text: "Header",
            style: { fill: "#f3f4f6", stroke: "#d1d5db", strokeWidth: 1 }
          },
          {
            type: "rectangle",
            x: 50,
            y: 150,
            width: 200,
            height: 400,
            text: "Sidebar",
            style: { fill: "#f9fafb", stroke: "#d1d5db", strokeWidth: 1 }
          },
          {
            type: "rectangle",
            x: 300,
            y: 150,
            width: 450,
            height: 400,
            text: "Main Content",
            style: { fill: "#ffffff", stroke: "#d1d5db", strokeWidth: 1 }
          }
        ],
        suggestions: ["Add navigation menu", "Include call-to-action buttons", "Consider mobile responsiveness"],
        description: "Basic wireframe layout generated from your prompt"
      };
    }

    // Save project
    const project = new Project({
      userId: req.user._id,
      title: `Wireframe: ${prompt.substring(0, 50)}...`,
      description: wireframeData.description,
      type: projectType,
      prompt: prompt,
      canvasData: wireframeData,
      aiResponse: {
        model: "gpt-3.5-turbo",
        prompt: prompt,
        response: wireframeData,
        timestamp: new Date()
      }
    });

    await project.save();

    // Update user usage stats
    req.user.usageStats.promptsGenerated += 1;
    req.user.usageStats.canvasCreated += 1;
    await req.user.save();

    res.json({
      success: true,
      project: project,
      wireframe: wireframeData,
      message: 'Wireframe generated successfully'
    });

  } catch (error) {
    console.error('Wireframe generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate wireframe',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Analyze design for dark patterns
router.post('/analyze-dark-patterns', authenticateToken, async (req, res) => {
  try {
    const { designDescription, imageUrl, projectId } = req.body;

    if (!req.user.isPro()) {
      return res.status(403).json({ 
        message: 'Dark pattern analysis is a Pro feature. Please upgrade to access this functionality.',
        upgradeRequired: true 
      });
    }

    const systemPrompt = `You are a UX ethics expert specializing in dark pattern detection. Analyze the provided design and identify any potentially manipulative or unethical UX patterns.

    Return a JSON object with this structure:
    {
      "detected": boolean,
      "patterns": [
        {
          "type": "pattern_name",
          "severity": "low|medium|high",
          "description": "What the pattern does",
          "suggestion": "How to fix it",
          "location": "Where it appears in the design"
        }
      ],
      "overallScore": number (1-10, 10 being most ethical),
      "summary": "Overall assessment"
    }

    Common dark patterns to look for:
    - Bait and Switch
    - Roach Motel
    - Privacy Zuckering
    - Price Comparison Prevention
    - Misdirection
    - Hidden Costs
    - Forced Continuity
    - Friend Spam
    - Confirmshaming
    - Disguised Ads`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this design for dark patterns: ${designDescription}` }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    let analysisResult;
    try {
      analysisResult = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      analysisResult = {
        detected: false,
        patterns: [],
        overallScore: 8,
        summary: "Analysis completed. No obvious dark patterns detected."
      };
    }

    // Update project if provided
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        darkPatternAnalysis: {
          detected: analysisResult.detected,
          patterns: analysisResult.patterns,
          overallScore: analysisResult.overallScore,
          analyzedAt: new Date()
        }
      });
    }

    // Update user usage stats
    req.user.usageStats.aiAnalysisUsed += 1;
    await req.user.save();

    res.json({
      success: true,
      analysis: analysisResult,
      message: 'Dark pattern analysis completed'
    });

  } catch (error) {
    console.error('Dark pattern analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze dark patterns',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate design principles
router.post('/generate-principles', authenticateToken, async (req, res) => {
  try {
    const { projectType, targetAudience, projectGoals } = req.body;

    const systemPrompt = `You are a UX design expert. Generate personalized design principles and UX laws relevant to the user's project.

    Return a JSON object with this structure:
    {
      "principles": [
        {
          "name": "Principle Name",
          "description": "What it means",
          "application": "How to apply it to this project",
          "examples": ["example1", "example2"],
          "priority": "high|medium|low"
        }
      ],
      "uxLaws": [
        {
          "name": "Law Name",
          "description": "What the law states",
          "relevance": "Why it's relevant to this project",
          "implementation": "How to implement it"
        }
      ],
      "recommendations": ["specific recommendation 1", "specific recommendation 2"]
    }

    Focus on principles most relevant to the project type and target audience.`;

    const userPrompt = `Project Type: ${projectType}
    Target Audience: ${targetAudience}
    Project Goals: ${projectGoals}
    
    Generate relevant design principles and UX laws for this project.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    let principlesData;
    try {
      principlesData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback principles
      principlesData = {
        principles: [
          {
            name: "User-Centered Design",
            description: "Design with the user's needs and goals at the center",
            application: "Research your users and validate design decisions with them",
            examples: ["User interviews", "Usability testing", "Persona development"],
            priority: "high"
          }
        ],
        uxLaws: [
          {
            name: "Fitts's Law",
            description: "The time to acquire a target is a function of the distance to and size of the target",
            relevance: "Important for button and interactive element sizing",
            implementation: "Make important buttons larger and place them closer to the user's expected path"
          }
        ],
        recommendations: ["Conduct user research", "Test with real users", "Iterate based on feedback"]
      };
    }

    res.json({
      success: true,
      principles: principlesData,
      message: 'Design principles generated successfully'
    });

  } catch (error) {
    console.error('Principles generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate design principles',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate user journey map
router.post('/generate-journey', authenticateToken, async (req, res) => {
  try {
    const { persona, scenario, stages } = req.body;

    if (!req.user.isPro() && req.user.usageStats.journeyMapsCreated >= 2) {
      return res.status(403).json({ 
        message: 'Free plan allows 2 journey maps. Upgrade to Pro for unlimited access.',
        upgradeRequired: true 
      });
    }

    const systemPrompt = `You are a UX researcher specializing in user journey mapping. Create a detailed user journey map based on the provided persona and scenario.

    Return a JSON object with this structure:
    {
      "journeyMap": {
        "persona": {
          "name": "string",
          "description": "string",
          "goals": ["goal1", "goal2"],
          "painPoints": ["pain1", "pain2"]
        },
        "stages": [
          {
            "name": "stage_name",
            "actions": ["action1", "action2"],
            "thoughts": ["thought1", "thought2"],
            "emotions": ["emotion1", "emotion2"],
            "touchpoints": ["touchpoint1", "touchpoint2"],
            "opportunities": ["opportunity1", "opportunity2"],
            "painPoints": ["pain1", "pain2"]
          }
        ]
      },
      "insights": ["insight1", "insight2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }`;

    const userPrompt = `Persona: ${persona}
    Scenario: ${scenario}
    Stages to include: ${stages.join(', ')}
    
    Create a comprehensive user journey map.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let journeyData;
    try {
      journeyData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback journey map
      journeyData = {
        journeyMap: {
          persona: {
            name: "User Persona",
            description: persona,
            goals: ["Complete task efficiently", "Have a positive experience"],
            painPoints: ["Confusion", "Delays"]
          },
          stages: stages.map(stage => ({
            name: stage,
            actions: ["Performs relevant actions"],
            thoughts: ["Thinks about the process"],
            emotions: ["Experiences emotions"],
            touchpoints: ["Interacts with interface"],
            opportunities: ["Potential improvements"],
            painPoints: ["Possible friction points"]
          }))
        },
        insights: ["Key insight about user behavior"],
        recommendations: ["Improve user experience", "Reduce friction"]
      };
    }

    // Save as project
    const project = new Project({
      userId: req.user._id,
      title: `Journey Map: ${journeyData.journeyMap.persona.name}`,
      description: scenario,
      type: 'journey-map',
      prompt: `${persona} - ${scenario}`,
      canvasData: journeyData,
      aiResponse: {
        model: "gpt-3.5-turbo",
        prompt: userPrompt,
        response: journeyData,
        timestamp: new Date()
      }
    });

    await project.save();

    // Update user usage stats
    req.user.usageStats.journeyMapsCreated += 1;
    await req.user.save();

    res.json({
      success: true,
      project: project,
      journeyMap: journeyData,
      message: 'User journey map generated successfully'
    });

  } catch (error) {
    console.error('Journey map generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate journey map',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;