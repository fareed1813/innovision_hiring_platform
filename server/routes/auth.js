import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate admin and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    
    // Find user (+password field which is excluded by default)
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    
    // Constant-time comparison via bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    
    // Generate JWT (24h expiry)
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, displayName: user.displayName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
});

/**
 * GET /api/auth/me
 * Verify token and return current user info
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
