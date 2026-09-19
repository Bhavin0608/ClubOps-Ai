import { ActivityLog } from '../models/ActivityLog.js';

export const getEventActivity = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { limit = 25, category } = req.query;

    const filter = { eventId };
    if (category) filter.category = category;

    const activities = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    next(error);
  }
};
