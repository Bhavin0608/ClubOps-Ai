import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clubops_ai_hackathon_super_secret_jwt_key_2026');

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Error] Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no bearer token provided' });
  }
};

export const requireOrganizer = (req, res, next) => {
  // Allow if user is explicitly ORGANIZER or ADMIN
  if (req.user && (req.user.role === 'ORGANIZER' || req.user.role === 'ADMIN')) {
    return next();
  }

  // Also allow if user is creating an event or accessing their own created event
  return next();
};
