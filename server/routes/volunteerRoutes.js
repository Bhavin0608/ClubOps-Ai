import express from 'express';
import { 
  getEventVolunteers, 
  addVolunteer, 
  getVolunteerRecommendations 
} from '../controllers/volunteerController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getEventVolunteers)
  .post(protect, requireOrganizer, addVolunteer);

router.get('/recommendations', protect, getVolunteerRecommendations);

export default router;
