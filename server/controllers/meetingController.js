import { Meeting } from '../models/Meeting.js';
import { Task } from '../models/Task.js';
import { Risk } from '../models/Risk.js';
import { Volunteer } from '../models/Volunteer.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Event } from '../models/Event.js';
import { extractMeetingIntelligence } from '../services/aiService.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

export const createMeeting = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { title, date, participants, notes, transcript } = req.body;

    const meeting = await Meeting.create({
      eventId,
      title,
      date: date || Date.now(),
      participants: Array.isArray(participants) ? participants : (participants ? participants.split(',').map(p => p.trim()) : []),
      notes: notes || '',
      transcript: transcript || '',
      createdBy: req.user._id
    });

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'MEETING_LOGGED',
      details: `Logged meeting "${meeting.title}" with notes & transcript`,
      category: 'MEETING'
    });

    res.status(201).json({
      success: true,
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const getEventMeetings = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const meetings = await Meeting.find({ eventId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      meetings
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.status(200).json({
      success: true,
      meeting
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const event = await Event.findById(meeting.eventId);
    const volunteers = await Volunteer.find({ eventId: meeting.eventId });

    const rawContent = (meeting.transcript && meeting.transcript.trim().length > 0)
      ? meeting.transcript
      : meeting.notes;

    if (!rawContent || rawContent.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Meeting has no notes or transcript content to analyze'
      });
    }

    const extraction = await extractMeetingIntelligence(rawContent, volunteers, event);

    meeting.analyzed = true;
    meeting.extractionResult = extraction;
    await meeting.save();

    await ActivityLog.create({
      eventId: meeting.eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'MEETING_AI_ANALYZED',
      details: `AI analyzed meeting "${meeting.title}": Extracted ${extraction.actionItems?.length || 0} action items & ${extraction.risks?.length || 0} risks`,
      category: 'MEETING'
    });

    res.status(200).json({
      success: true,
      extractionResult: extraction
    });
  } catch (error) {
    next(error);
  }
};

export const applyMeetingExtraction = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const { actionItems = [], risks = [] } = req.body;
    const eventId = meeting.eventId;

    let createdTasks = [];
    let createdRisks = [];

    // Create Tasks
    for (const item of actionItems) {
      let deadlineDate = item.parsedDeadline ? new Date(item.parsedDeadline) : null;
      if (!deadlineDate || isNaN(deadlineDate.getTime())) {
        // Default to event date or 3 days from now
        deadlineDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }

      let assignedToUserId = null;
      let assignedName = item.owner || 'Unassigned';

      if (item.matchedUserId) {
        assignedToUserId = item.matchedUserId;
      } else if (item.owner && item.owner !== 'Unknown' && item.owner !== 'Unassigned') {
        const matchedVol = await Volunteer.findOne({
          eventId,
          name: { $regex: new RegExp(`^${item.owner.trim()}$`, 'i') }
        });
        if (matchedVol) {
          assignedToUserId = matchedVol.userId;
          assignedName = matchedVol.name;
        }
      }

      const task = await Task.create({
        eventId,
        title: item.title,
        description: `Extracted from meeting: "${meeting.title}"`,
        category: item.category || 'Logistics',
        priority: item.priority || 'MEDIUM',
        deadline: deadlineDate,
        assignedTo: assignedToUserId,
        assignedVolunteerName: assignedName,
        source: 'MEETING_AI',
        createdBy: req.user._id
      });

      if (assignedToUserId) {
        await Volunteer.findOneAndUpdate(
          { eventId, userId: assignedToUserId },
          { $inc: { currentWorkload: 1 } }
        );

        await Notification.create({
          eventId,
          userId: assignedToUserId,
          title: 'New Task from Meeting',
          message: `You were assigned "${task.title}" during "${meeting.title}"`,
          type: NOTIFICATION_TYPES.TASK_ASSIGNED,
          metadata: { taskId: task._id, meetingId: meeting._id }
        });
      }

      createdTasks.push(task);
    }

    // Create Risks
    for (const r of risks) {
      const risk = await Risk.create({
        eventId,
        title: r.title,
        description: r.reason || `Identified during meeting "${meeting.title}"`,
        severity: r.severity || 'MEDIUM',
        source: 'AI_ANALYSIS',
        recommendedAction: 'Review and assign a task to mitigate this risk.'
      });
      createdRisks.push(risk);
    }

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'MEETING_ITEMS_APPLIED',
      details: `Converted meeting items into ${createdTasks.length} tasks and ${createdRisks.length} operational risks`,
      category: 'MEETING'
    });

    res.status(200).json({
      success: true,
      message: `Applied ${createdTasks.length} tasks and ${createdRisks.length} risks to event`,
      createdTasksCount: createdTasks.length,
      createdRisksCount: createdRisks.length
    });
  } catch (error) {
    next(error);
  }
};
