import express from 'express';
import { 
  getEventRisks, 
  createRisk, 
  resolveRisk, 
  triggerRiskEvaluation 
} from '../controllers/riskController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Mounted at /api/v1/events/:eventId/risks
router.route('/')
  .get(protect, getEventRisks)
  .post(protect, requireOrganizer, createRisk);

router.post('/evaluate', protect, requireOrganizer, triggerRiskEvaluation);

export const singleRiskRouter = express.Router();
singleRiskRouter.patch('/:id/resolve', protect, requireOrganizer, resolveRisk);

export default router;
