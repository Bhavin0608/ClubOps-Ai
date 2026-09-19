import express from 'express';
import { 
  generatePlan, 
  applyPlan, 
  copilotChat, 
  approveAction, 
  rejectAction, 
  getPendingActions 
} from '../controllers/aiController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/event-plan', requireOrganizer, generatePlan);
router.post('/event-plan/apply', requireOrganizer, applyPlan);
router.post('/chat', copilotChat);
router.post('/action/approve', requireOrganizer, approveAction);
router.post('/action/reject', requireOrganizer, rejectAction);
router.get('/actions/pending/:eventId', requireOrganizer, getPendingActions);

export default router;
