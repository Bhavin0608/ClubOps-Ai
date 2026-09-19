import { AIAction } from '../models/AIAction.js';
import { Task } from '../models/Task.js';
import { Volunteer } from '../models/Volunteer.js';
import { Risk } from '../models/Risk.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { AI_ACTION_TYPES, NOTIFICATION_TYPES } from '../config/constants.js';

export const executeApprovedAction = async (actionId, authorizedUser) => {
  const action = await AIAction.findById(actionId);
  if (!action) {
    throw new Error('Action proposal not found');
  }

  if (action.status === 'EXECUTED') {
    return { success: true, message: 'Action has already been executed', action };
  }

  if (action.status === 'REJECTED') {
    throw new Error('Cannot execute a rejected action');
  }

  try {
    let result = null;

    switch (action.actionType) {
      case AI_ACTION_TYPES.ASSIGN_TASK: {
        const { taskId, volunteerId } = action.parameters;
        const task = await Task.findById(taskId);
        if (!task) throw new Error(`Task #${taskId} not found`);

        const volunteer = await Volunteer.findById(volunteerId);
        if (!volunteer) throw new Error(`Volunteer #${volunteerId} not found in event roster`);

        const previousUserId = task.assignedTo;

        // Decrement previous volunteer workload
        if (previousUserId && previousUserId.toString() !== volunteer.userId.toString() && task.status !== 'COMPLETED') {
          await Volunteer.findOneAndUpdate(
            { eventId: task.eventId, userId: previousUserId },
            { $inc: { currentWorkload: -1 } }
          );
        }

        // Increment new volunteer workload
        if ((!previousUserId || previousUserId.toString() !== volunteer.userId.toString()) && task.status !== 'COMPLETED') {
          volunteer.currentWorkload += 1;
          await volunteer.save();
        }

        task.assignedTo = volunteer.userId;
        task.assignedVolunteerName = volunteer.name;
        await task.save();

        // Send alert
        await Notification.create({
          eventId: task.eventId,
          userId: volunteer.userId,
          title: 'Task Assigned by AI Operations',
          message: `You were assigned: "${task.title}" upon organizer approval.`,
          type: NOTIFICATION_TYPES.TASK_ASSIGNED,
          metadata: { taskId: task._id, actionId: action._id }
        });

        result = {
          taskTitle: task.title,
          assignedTo: volunteer.name,
          volunteerWorkload: volunteer.currentWorkload
        };
        break;
      }

      case AI_ACTION_TYPES.CREATE_TASK: {
        const { title, description, category, priority, deadline, assignedTo, assignedVolunteerName } = action.parameters;
        
        let deadlineDate = deadline ? new Date(deadline) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

        const newTask = await Task.create({
          eventId: action.eventId,
          title,
          description: description || 'Created by AI Operations Agent',
          category: category || 'Logistics',
          priority: priority || 'MEDIUM',
          deadline: deadlineDate,
          assignedTo: assignedTo || null,
          assignedVolunteerName: assignedVolunteerName || 'Unassigned',
          source: 'AI_ACTION',
          createdBy: authorizedUser._id
        });

        if (assignedTo) {
          await Volunteer.findOneAndUpdate(
            { eventId: action.eventId, userId: assignedTo },
            { $inc: { currentWorkload: 1 } }
          );

          await Notification.create({
            eventId: action.eventId,
            userId: assignedTo,
            title: 'New Task Created by Operations Agent',
            message: `New task assigned: "${newTask.title}"`,
            type: NOTIFICATION_TYPES.TASK_ASSIGNED,
            metadata: { taskId: newTask._id }
          });
        }

        result = {
          taskId: newTask._id,
          taskTitle: newTask.title,
          assignedTo: newTask.assignedVolunteerName
        };
        break;
      }

      case AI_ACTION_TYPES.CREATE_RISK: {
        const { title, description, severity, recommendedAction } = action.parameters;
        const newRisk = await Risk.create({
          eventId: action.eventId,
          title,
          description,
          severity: severity || 'MEDIUM',
          source: 'AI_ANALYSIS',
          recommendedAction: recommendedAction || ''
        });
        result = { riskId: newRisk._id, title: newRisk.title };
        break;
      }

      case AI_ACTION_TYPES.SEND_NOTIFICATION: {
        const { recipientUserId, message, title } = action.parameters;
        const notif = await Notification.create({
          eventId: action.eventId,
          userId: recipientUserId,
          title: title || 'Operational Broadcast',
          message,
          type: NOTIFICATION_TYPES.ANNOUNCEMENT
        });
        result = { notificationId: notif._id };
        break;
      }

      default:
        throw new Error(`Unsupported action type: ${action.actionType}`);
    }

    action.status = 'EXECUTED';
    action.executionResult = result;
    action.executedAt = new Date();
    await action.save();

    await ActivityLog.create({
      eventId: action.eventId,
      userId: authorizedUser._id,
      userName: authorizedUser.name,
      action: 'AI_ACTION_EXECUTED',
      details: `Executed AI action [${action.actionType}]: ${action.description}`,
      category: 'AI_ACTION',
      metadata: { actionId: action._id, result }
    });

    return {
      success: true,
      message: `Action executed successfully: ${action.description}`,
      action,
      result
    };
  } catch (error) {
    action.status = 'FAILED';
    action.errorMessage = error.message;
    await action.save();
    throw error;
  }
};
