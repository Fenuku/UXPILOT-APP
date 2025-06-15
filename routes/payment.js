const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

// Generate payment reference
router.post('/generate-reference', authenticateToken, async (req, res) => {
  try {
    const reference = `UXP-${req.user._id}-${Date.now()}`;
    
    res.json({
      success: true,
      reference,
      amount: 29.00,
      currency: 'USD',
      bankDetails: {
        accountName: 'UXPilot Technologies',
        accountNumber: '1234567890',
        bankName: 'Example Bank',
        routingNumber: '123456789'
      }
    });
  } catch (error) {
    console.error('Generate reference error:', error);
    res.status(500).json({ message: 'Failed to generate payment reference' });
  }
});

// Activate Pro with reference code
router.post('/activate-pro', authenticateToken, async (req, res) => {
  try {
    const { referenceCode } = req.body;
    
    if (!referenceCode) {
      return res.status(400).json({ message: 'Reference code is required' });
    }
    
    // In a real implementation, you would verify the reference code
    // against your payment processor or database
    // For demo purposes, we'll accept any code that starts with 'UXP-'
    if (!referenceCode.startsWith('UXP-')) {
      return res.status(400).json({ message: 'Invalid reference code' });
    }
    
    // Check if code has already been used
    const existingUser = await User.findOne({ referenceCode });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Reference code has already been used' });
    }
    
    // Activate Pro subscription
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month from now
    
    await User.findByIdAndUpdate(req.user._id, {
      subscription: 'pro',
      subscriptionExpiry: expiryDate,
      referenceCode: referenceCode
    });
    
    res.json({
      success: true,
      message: 'Pro subscription activated successfully!',
      subscription: {
        plan: 'pro',
        expiryDate: expiryDate
      }
    });
  } catch (error) {
    console.error('Activate Pro error:', error);
    res.status(500).json({ message: 'Failed to activate Pro subscription' });
  }
});

// Get subscription status
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription subscriptionExpiry referenceCode');
    
    res.json({
      success: true,
      subscription: {
        plan: user.subscription,
        isPro: user.isPro(),
        expiryDate: user.subscriptionExpiry,
        referenceCode: user.referenceCode
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
});

// Cancel subscription (downgrade to free)
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      subscription: 'free',
      subscriptionExpiry: null
    });
    
    res.json({
      success: true,
      message: 'Subscription cancelled. You have been downgraded to the free plan.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

module.exports = router;
