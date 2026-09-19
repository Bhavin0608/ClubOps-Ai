import express from 'express';
import { getEventDocuments, createDocument } from '../controllers/documentController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getEventDocuments)
  .post(protect, requireOrganizer, createDocument);

export default router;
