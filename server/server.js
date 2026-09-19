import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import taskRoutes, { singleTaskRouter } from './routes/taskRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import meetingRoutes, { singleMeetingRouter } from './routes/meetingRoutes.js';
import riskRoutes, { singleRiskRouter } from './routes/riskRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'ClubOps AI Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/events/:eventId/tasks', taskRoutes);
app.use('/api/v1/tasks', singleTaskRouter);
app.use('/api/v1/events/:eventId/volunteers', volunteerRoutes);
app.use('/api/v1/events/:eventId/meetings', meetingRoutes);
app.use('/api/v1/meetings', singleMeetingRouter);
app.use('/api/v1/events/:eventId/risks', riskRoutes);
app.use('/api/v1/risks', singleRiskRouter);
app.use('/api/v1/events/:eventId/activity', activityRoutes);
app.use('/api/v1/events/:eventId/documents', documentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ai', aiRoutes);

// Centralized error handling
app.use(errorHandler);

// Connect DB & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] ClubOps AI API running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[Server] Fatal startup failure:', err);
});
