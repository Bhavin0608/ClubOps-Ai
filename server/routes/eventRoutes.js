import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  getEventHealth 
} from '../controllers/eventController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getEvents)
  .post(protect, requireOrganizer, createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, requireOrganizer, updateEvent);

router.get('/:id/health', protect, getEventHealth);

export default router;
