import { Event } from '../models/Event.js';
import { Task } from '../models/Task.js';
import { Volunteer } from '../models/Volunteer.js';
import { Risk } from '../models/Risk.js';
import { Meeting } from '../models/Meeting.js';
import { ActivityLog } from '../models/ActivityLog.js';

import { User } from '../models/User.js';

export const createEvent = async (req, res, next) => {
  try {
    const { name, description, venue, eventDate, startTime, endTime, expectedAudience, importClubVolunteers = true } = req.body;

    // Ensure user role is updated to ORGANIZER if creating an event
    if (req.user.role !== 'ORGANIZER') {
      await User.findByIdAndUpdate(req.user._id, { role: 'ORGANIZER' });
      req.user.role = 'ORGANIZER';
    }

    const event = await Event.create({
      name,
      description,
      venue,
      eventDate: new Date(eventDate),
      startTime: startTime || '09:00',
      endTime: endTime || '18:00',
      expectedAudience: expectedAudience || 100,
      organizerId: req.user._id
    });

    // 1. Enroll the creator as Event Lead Volunteer in this event
    await Volunteer.create({
      eventId: event._id,
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      skills: req.user.skills?.length > 0 ? req.user.skills : ['Event Operations', 'Leadership'],
      availability: req.user.availability || 'Full Day',
      currentWorkload: 0,
      maximumWorkload: req.user.maxWorkload || 8,
      status: 'AVAILABLE'
    });

    // 2. If requested, enroll existing club volunteers so the event has an immediate operable roster
    if (importClubVolunteers) {
      const clubVolunteers = await User.find({
        _id: { $ne: req.user._id }
      }).limit(10);

      for (const u of clubVolunteers) {
        await Volunteer.create({
          eventId: event._id,
          userId: u._id,
          name: u.name,
          email: u.email,
          skills: u.skills?.length > 0 ? u.skills : ['General Operations'],
          availability: u.availability || 'Full Day',
          currentWorkload: 0,
          maximumWorkload: u.maxWorkload || 5,
          status: 'AVAILABLE'
        }).catch(() => {}); // Catch if already exists
      }
    }

    await ActivityLog.create({
      eventId: event._id,
      userId: req.user._id,
      userName: req.user.name,
      action: 'EVENT_CREATED',
      details: `Created new event "${event.name}" and initialized volunteer operations team`,
      category: 'EVENT'
    });

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const events = await Event.find(filter)
      .populate('organizerId', 'name email')
      .sort({ eventDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizerId', 'name email phone');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await ActivityLog.create({
      eventId: event._id,
      userId: req.user._id,
      userName: req.user.name,
      action: 'EVENT_UPDATED',
      details: `Updated event settings for "${event.name}"`,
      category: 'EVENT'
    });

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

export const getEventHealth = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await Task.find({ eventId });
    const volunteers = await Volunteer.find({ eventId });
    const risks = await Risk.find({ eventId, status: 'OPEN' });
    const meetings = await Meeting.find({ eventId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;

    const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.deadline) < now).length;
    const dueTodayTasks = tasks.filter(t => {
      const d = new Date(t.deadline);
      return t.status !== 'COMPLETED' && d >= startOfToday && d <= endOfToday;
    }).length;
    const dueThisWeekTasks = tasks.filter(t => {
      const d = new Date(t.deadline);
      return t.status !== 'COMPLETED' && d > endOfToday && d <= endOfWeek;
    }).length;

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const criticalRisks = risks.filter(r => r.severity === 'CRITICAL').length;
    const highRisks = risks.filter(r => r.severity === 'HIGH').length;
    const mediumRisks = risks.filter(r => r.severity === 'MEDIUM').length;
    const lowRisks = risks.filter(r => r.severity === 'LOW').length;

    const overloadedVolunteers = volunteers.filter(v => v.currentWorkload >= v.maximumWorkload).length;

    let naturalSummary = `The event "${event.name}" is ${progressPercentage}% complete with ${completedTasks} of ${totalTasks} tasks finished.`;
    if (overdueTasks > 0) {
      naturalSummary += ` ${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} overdue.`;
    }
    if (criticalRisks > 0 || highRisks > 0) {
      naturalSummary += ` Warning: ${criticalRisks + highRisks} high-priority risk${(criticalRisks + highRisks) > 1 ? 's require' : ' requires'} immediate organizer attention.`;
    }
    if (overloadedVolunteers > 0) {
      naturalSummary += ` ${overloadedVolunteers} volunteer${overloadedVolunteers > 1 ? 's have' : ' has'} reached maximum workload capacity.`;
    }

    res.status(200).json({
      success: true,
      health: {
        eventId: event._id,
        eventName: event.name,
        eventDate: event.eventDate,
        status: event.status,
        progressPercentage,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          blocked: blockedTasks,
          overdue: overdueTasks,
          dueToday: dueTodayTasks,
          dueThisWeek: dueThisWeekTasks
        },
        volunteers: {
          total: volunteers.length,
          overloaded: overloadedVolunteers
        },
        risks: {
          openTotal: risks.length,
          critical: criticalRisks,
          high: highRisks,
          medium: mediumRisks,
          low: lowRisks
        },
        meetingsCount: meetings.length,
        summary: naturalSummary
      }
    });
  } catch (error) {
    next(error);
  }
};
