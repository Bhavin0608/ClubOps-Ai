import express from 'express';
import { 
  getEventTasks, 
  createTask, 
  updateTask, 
  updateTaskStatus, 
  assignTask, 
  deleteTask,
  autoAssignTasks
} from '../controllers/taskController.js';
import { protect, requireOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Mounted at /api/v1/events/:eventId/tasks
router.route('/')
  .get(protect, getEventTasks)
  .post(protect, requireOrganizer, createTask);

router.post('/auto-assign', protect, requireOrganizer, autoAssignTasks);

// Mounted at /api/v1/tasks/:id
export const singleTaskRouter = express.Router();
singleTaskRouter.route('/:id')
  .put(protect, requireOrganizer, updateTask)
  .delete(protect, requireOrganizer, deleteTask);

singleTaskRouter.patch('/:id/status', protect, updateTaskStatus);
singleTaskRouter.post('/:id/assign', protect, requireOrganizer, assignTask);

export default router;
