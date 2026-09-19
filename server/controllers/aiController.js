import { Event } from '../models/Event.js';
import { Task } from '../models/Task.js';
import { Volunteer } from '../models/Volunteer.js';
import { Risk } from '../models/Risk.js';
import { AIAction } from '../models/AIAction.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { 
  generateEventPlan, 
  runCopilotAgent 
} from '../services/aiService.js';
import { executeApprovedAction } from '../services/actionEngineService.js';

export const generatePlan = async (req, res, next) => {
  try {
    const { eventId, customPrompt } = req.body;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const tasksPlan = await generateEventPlan(event);

    res.status(200).json({
      success: true,
      tasks: tasksPlan
    });
  } catch (error) {
    next(error);
  }
};

export const applyPlan = async (req, res, next) => {
  try {
    const { eventId, approvedTasks } = req.body;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!Array.isArray(approvedTasks) || approvedTasks.length === 0) {
      return res.status(400).json({ success: false, message: 'No tasks provided to apply' });
    }

    const eventDate = new Date(event.eventDate);

    const taskDocs = approvedTasks.map(t => {
      let deadline = new Date(eventDate);
      if (t.daysBeforeEvent) {
        deadline.setDate(eventDate.getDate() - t.daysBeforeEvent);
      }
      return {
        eventId,
        title: t.title,
        description: t.description || '',
        category: t.category || 'Logistics',
        priority: t.priority || 'MEDIUM',
        deadline: deadline < new Date() ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : deadline,
        source: 'AI_PLANNER',
        createdBy: req.user._id
      };
    });

    const createdTasks = await Task.insertMany(taskDocs);

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'AI_PLAN_APPLIED',
      details: `Generated and applied ${createdTasks.length} operational tasks via AI Event Planner`,
      category: 'TASK'
    });

    res.status(201).json({
      success: true,
      message: `Created ${createdTasks.length} tasks for event`,
      createdTasksCount: createdTasks.length
    });
  } catch (error) {
    next(error);
  }
};

export const copilotChat = async (req, res, next) => {
  try {
    const { eventId, message, conversationHistory = [] } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const tasks = await Task.find({ eventId });
    const volunteers = await Volunteer.find({ eventId });
    const risks = await Risk.find({ eventId, status: 'OPEN' });

    // Quick health calculation
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.deadline) < new Date()).length;

    const eventContext = {
      event,
      tasks,
      volunteers,
      risks,
      health: {
        progressPercentage,
        tasks: { total: tasks.length, completed: completedTasks, overdue: overdueTasks },
        risks: { openTotal: risks.length }
      }
    };

    const copilotResult = await runCopilotAgent(message, eventContext, conversationHistory);

    let savedAction = null;
    if (copilotResult.proposedAction) {
      savedAction = await AIAction.create({
        eventId,
        requestedBy: req.user._id,
        actionType: copilotResult.proposedAction.actionType,
        description: copilotResult.proposedAction.description,
        reason: copilotResult.proposedAction.reason || '',
        parameters: copilotResult.proposedAction.parameters,
        status: 'PROPOSED'
      });
      copilotResult.proposedAction._id = savedAction._id;
    }

    res.status(200).json({
      success: true,
      reply: copilotResult.reply,
      proposedAction: savedAction ? {
        _id: savedAction._id,
        actionType: savedAction.actionType,
        description: savedAction.description,
        reason: savedAction.reason,
        parameters: savedAction.parameters,
        status: savedAction.status
      } : null
    });
  } catch (error) {
    next(error);
  }
};

export const approveAction = async (req, res, next) => {
  try {
    const { actionId } = req.body;
    if (!actionId) {
      return res.status(400).json({ success: false, message: 'actionId is required' });
    }

    const execution = await executeApprovedAction(actionId, req.user);

    res.status(200).json({
      success: true,
      ...execution
    });
  } catch (error) {
    next(error);
  }
};

export const rejectAction = async (req, res, next) => {
  try {
    const { actionId, reason } = req.body;
    const action = await AIAction.findById(actionId);

    if (!action) {
      return res.status(404).json({ success: false, message: 'Action proposal not found' });
    }

    action.status = 'REJECTED';
    action.errorMessage = reason || 'Rejected by organizer';
    await action.save();

    await ActivityLog.create({
      eventId: action.eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'AI_ACTION_REJECTED',
      details: `Rejected AI action [${action.actionType}]: ${action.description}`,
      category: 'AI_ACTION'
    });

    res.status(200).json({
      success: true,
      message: 'Action proposal rejected',
      action
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingActions = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const actions = await AIAction.find({ eventId, status: 'PROPOSED' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: actions.length,
      actions
    });
  } catch (error) {
    next(error);
  }
};
