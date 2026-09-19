import { Task } from '../models/Task.js';
import { Volunteer } from '../models/Volunteer.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Risk } from '../models/Risk.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

export const getEventTasks = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, priority, category, assignedTo } = req.query;

    const filter = { eventId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email skills')
      .populate('dependencies', 'title status deadline')
      .sort({ deadline: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { 
      title, 
      description, 
      category, 
      priority, 
      deadline, 
      assignedTo, 
      assignedVolunteerName,
      dependencies, 
      source 
    } = req.body;

    let volunteerName = assignedVolunteerName || 'Unassigned';
    if (assignedTo && !assignedVolunteerName) {
      const vol = await Volunteer.findOne({ eventId, userId: assignedTo });
      if (vol) volunteerName = vol.name;
    }

    const task = await Task.create({
      eventId,
      title,
      description: description || '',
      category: category || 'Logistics',
      priority: priority || 'MEDIUM',
      deadline: new Date(deadline),
      assignedTo: assignedTo || null,
      assignedVolunteerName: volunteerName,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      source: source || 'MANUAL',
      createdBy: req.user._id
    });

    // If volunteer assigned, increment their workload & notify
    if (assignedTo) {
      await Volunteer.findOneAndUpdate(
        { eventId, userId: assignedTo },
        { $inc: { currentWorkload: 1 } }
      );

      await Notification.create({
        eventId,
        userId: assignedTo,
        title: 'New Task Assigned',
        message: `You have been assigned: "${task.title}" (Due: ${new Date(task.deadline).toLocaleDateString()})`,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        metadata: { taskId: task._id }
      });
    }

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'TASK_CREATED',
      details: `Created task "${task.title}" assigned to ${volunteerName}`,
      category: 'TASK',
      metadata: { taskId: task._id }
    });

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, category, priority, status, deadline, assignedTo, dependencies } = req.body;

    // Handle re-assignment workload balance if assignedTo changed
    if (assignedTo !== undefined && assignedTo !== (existingTask.assignedTo ? existingTask.assignedTo.toString() : null)) {
      // Decrement old volunteer if task was not completed
      if (existingTask.assignedTo && existingTask.status !== 'COMPLETED') {
        await Volunteer.findOneAndUpdate(
          { eventId: existingTask.eventId, userId: existingTask.assignedTo },
          { $inc: { currentWorkload: -1 } }
        );
      }

      // Increment new volunteer if assigned
      if (assignedTo) {
        const newVol = await Volunteer.findOne({ eventId: existingTask.eventId, userId: assignedTo });
        if (newVol) {
          existingTask.assignedVolunteerName = newVol.name;
          if (existingTask.status !== 'COMPLETED') {
            newVol.currentWorkload += 1;
            await newVol.save();
          }

          await Notification.create({
            eventId: existingTask.eventId,
            userId: assignedTo,
            title: 'Task Re-assigned',
            message: `You were assigned: "${title || existingTask.title}"`,
            type: NOTIFICATION_TYPES.TASK_ASSIGNED,
            metadata: { taskId: existingTask._id }
          });
        }
      } else {
        existingTask.assignedVolunteerName = 'Unassigned';
      }
      existingTask.assignedTo = assignedTo || null;
    }

    if (title) existingTask.title = title;
    if (description !== undefined) existingTask.description = description;
    if (category) existingTask.category = category;
    if (priority) existingTask.priority = priority;
    if (status) existingTask.status = status;
    if (deadline) existingTask.deadline = new Date(deadline);
    if (dependencies !== undefined) existingTask.dependencies = dependencies;

    await existingTask.save();

    const populated = await Task.findById(existingTask._id)
      .populate('assignedTo', 'name email skills')
      .populate('dependencies', 'title status deadline');

    res.status(200).json({
      success: true,
      task: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Optimal AI-Assisted Bulk Task Auto-Assignment
 */
export const autoAssignTasks = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const unassignedTasks = await Task.find({
      eventId,
      $or: [{ assignedTo: null }, { assignedVolunteerName: 'Unassigned' }],
      status: { $ne: 'COMPLETED' }
    });

    if (unassignedTasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All deliverables already have designated assignees!',
        assignedCount: 0,
        assignments: []
      });
    }

    const volunteers = await Volunteer.find({ eventId });
    if (volunteers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No volunteers registered for this event. Please enroll volunteers first.'
      });
    }

    const assignments = [];

    for (const task of unassignedTasks) {
      // Find candidate with available capacity
      const candidates = volunteers.filter(v => v.currentWorkload < v.maximumWorkload);
      if (candidates.length === 0) break; // All at max workload

      // Score candidates: match skills (+30), capacity remaining (+15)
      const scored = candidates.map(v => {
        let score = (v.maximumWorkload - v.currentWorkload) * 15;
        if (v.skills && v.skills.some(s => s.toLowerCase().includes(task.category.toLowerCase()) || task.category.toLowerCase().includes(s.toLowerCase()))) {
          score += 30;
        }
        return { volunteer: v, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const chosen = scored[0].volunteer;

      task.assignedTo = chosen.userId;
      task.assignedVolunteerName = chosen.name;
      await task.save();

      chosen.currentWorkload += 1;
      await chosen.save();

      await Notification.create({
        eventId,
        userId: chosen.userId,
        title: 'Optimized Task Assignment',
        message: `You have been matched and assigned to "${task.title}" based on your skills.`,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        metadata: { taskId: task._id }
      });

      assignments.push({
        taskId: task._id,
        taskTitle: task.title,
        assignedTo: chosen.name
      });
    }

    await ActivityLog.create({
      eventId,
      action: 'AI_OPTIMAL_AUTO_ASSIGNMENT',
      details: `AI Auto-Assign engine balanced and assigned ${assignments.length} deliverable(s) across team volunteers`,
      category: 'TASK'
    });

    res.status(200).json({
      success: true,
      message: `Optimal assignment complete: Assigned ${assignments.length} task(s).`,
      assignedCount: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const previousStatus = task.status;

    // Check dependencies if moving to IN_PROGRESS
    if (status === 'IN_PROGRESS' && task.dependencies && task.dependencies.length > 0) {
      const incompleteDeps = await Task.find({
        _id: { $in: task.dependencies },
        status: { $ne: 'COMPLETED' }
      });

      if (incompleteDeps.length > 0) {
        task.status = 'BLOCKED';
        await task.save();
        return res.status(400).json({
          success: false,
          message: `Cannot start task: Blocked by ${incompleteDeps.length} incomplete prerequisite task(s): ${incompleteDeps.map(d => d.title).join(', ')}`,
          task
        });
      }
    }

    task.status = status;
    await task.save();

    // If marked COMPLETED
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      if (task.assignedTo) {
        await Volunteer.findOneAndUpdate(
          { eventId: task.eventId, userId: task.assignedTo },
          { $inc: { currentWorkload: -1 } }
        );
      }

      // Auto-resolve any related risk
      await Risk.updateMany(
        { eventId: task.eventId, relatedTaskId: task._id, status: 'OPEN' },
        { status: 'RESOLVED', resolvedAt: new Date() }
      );

      // Unblock any tasks that depended on this task
      const blockedDependents = await Task.find({
        eventId: task.eventId,
        dependencies: task._id,
        status: 'BLOCKED'
      });

      for (const dep of blockedDependents) {
        const remainingIncomplete = await Task.countDocuments({
          _id: { $in: dep.dependencies },
          status: { $ne: 'COMPLETED' }
        });
        if (remainingIncomplete === 0) {
          dep.status = 'TODO';
          await dep.save();
        }
      }
    }

    await ActivityLog.create({
      eventId: task.eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'TASK_STATUS_UPDATED',
      details: `Moved "${task.title}" from ${previousStatus} to ${status}`,
      category: 'TASK',
      metadata: { taskId: task._id, previousStatus, newStatus: status }
    });

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { volunteerId, userId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    let targetVolunteer;
    if (volunteerId) {
      targetVolunteer = await Volunteer.findById(volunteerId);
    } else if (userId) {
      targetVolunteer = await Volunteer.findOne({ eventId: task.eventId, userId });
    }

    if (!targetVolunteer) {
      return res.status(404).json({ success: false, message: 'Volunteer not found in this event roster' });
    }

    const previousUserId = task.assignedTo;

    // Decrement previous volunteer workload if different
    if (previousUserId && previousUserId.toString() !== targetVolunteer.userId.toString() && task.status !== 'COMPLETED') {
      await Volunteer.findOneAndUpdate(
        { eventId: task.eventId, userId: previousUserId },
        { $inc: { currentWorkload: -1 } }
      );
    }

    // Increment new volunteer workload if different
    if ((!previousUserId || previousUserId.toString() !== targetVolunteer.userId.toString()) && task.status !== 'COMPLETED') {
      targetVolunteer.currentWorkload += 1;
      await targetVolunteer.save();
    }

    task.assignedTo = targetVolunteer.userId;
    task.assignedVolunteerName = targetVolunteer.name;
    await task.save();

    await Notification.create({
      eventId: task.eventId,
      userId: targetVolunteer.userId,
      title: 'Task Assigned',
      message: `You have been assigned: "${task.title}"`,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      metadata: { taskId: task._id }
    });

    await ActivityLog.create({
      eventId: task.eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'TASK_ASSIGNED',
      details: `Assigned "${task.title}" to ${targetVolunteer.name}`,
      category: 'TASK',
      metadata: { taskId: task._id, volunteerName: targetVolunteer.name }
    });

    res.status(200).json({
      success: true,
      task,
      volunteer: targetVolunteer
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.assignedTo && task.status !== 'COMPLETED') {
      await Volunteer.findOneAndUpdate(
        { eventId: task.eventId, userId: task.assignedTo },
        { $inc: { currentWorkload: -1 } }
      );
    }

    await Task.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      eventId: task.eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'TASK_DELETED',
      details: `Deleted task "${task.title}"`,
      category: 'TASK'
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
