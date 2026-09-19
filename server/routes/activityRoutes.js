import express from 'express';
import { getEventActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.get('/', protect, getEventActivity);

export default router;
