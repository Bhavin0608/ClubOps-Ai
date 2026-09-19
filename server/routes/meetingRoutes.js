import express from 'express';
import { 
  createMeeting, 
  getEventMeetings, 
  getMeetingById, 
  analyzeMeeting, 
  applyMeetingExtraction 
} from '../controllers/meetingController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getEventMeetings)
  .post(protect, requireOrganizer, createMeeting);

export const singleMeetingRouter = express.Router();

singleMeetingRouter.route('/:id')
  .get(protect, getMeetingById);

singleMeetingRouter.post('/:id/analyze', protect, requireOrganizer, analyzeMeeting);
singleMeetingRouter.post('/:id/apply', protect, requireOrganizer, applyMeetingExtraction);

export default router;
