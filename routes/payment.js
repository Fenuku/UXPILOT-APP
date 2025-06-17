const express = require('express');
const User = require('../models/User');
const crypto = require('crypto');
const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const authenticateToken = require('./middleware/authenticateToken');

const router = express.Router();

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

/**
 * @route POST /api/payment/paystack/initialize
 * @description Initialize a payment with Paystack
 * @access Private
 */
router.post('/paystack/initialize', authenticateToken, async (req, res) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ message: 'Email and amount are required' });
  }

  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      metadata: {
        userId: req.user._id,
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({ message: 'Failed to initialize payment with Paystack' });
  }
});

/**
 * @route POST /api/payment/paystack/webhook
 * @description Handle Paystack webhook events
 * @access Public
 */
router.post('/paystack/webhook', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.sendStatus(401);
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { userId } = event.data.metadata;

    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      await User.findByIdAndUpdate(userId, {
        subscription: 'pro',
        subscriptionExpiry: expiryDate,
        referenceCode: event.data.reference
      });

      console.log(`User ${userId} successfully subscribed to Pro plan.`);
    } catch (error) {
      console.error('Webhook subscription update error:', error);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
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
