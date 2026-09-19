import { Risk } from '../models/Risk.js';
import { Task } from '../models/Task.js';
import { Volunteer } from '../models/Volunteer.js';
import { Event } from '../models/Event.js';
import { ActivityLog } from '../models/ActivityLog.js';

export const evaluateEventRisks = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  const now = new Date();
  const tasks = await Task.find({ eventId });
  const volunteers = await Volunteer.find({ eventId });

  let detectedRisks = [];

  // RULE 1: Overdue Incomplete Tasks
  for (const task of tasks) {
    if (task.status !== 'COMPLETED' && new Date(task.deadline) < now) {
      const isCritical = task.priority === 'CRITICAL' || task.priority === 'HIGH';
      const existingRisk = await Risk.findOne({
        eventId,
        relatedTaskId: task._id,
        status: 'OPEN'
      });

      if (!existingRisk) {
        detectedRisks.push({
          eventId,
          title: `Overdue Task: "${task.title}"`,
          description: `Deadline was ${new Date(task.deadline).toLocaleDateString()}. Task is still in "${task.status}" state.`,
          severity: isCritical ? 'CRITICAL' : 'HIGH',
          source: 'RULE_ENGINE',
          relatedTaskId: task._id,
          recommendedAction: `Reassign to an available volunteer or expedite completion immediately.`
        });
      }
    }
  }

  // RULE 2: Blocked Dependency Tasks
  for (const task of tasks) {
    if (task.dependencies && task.dependencies.length > 0 && task.status !== 'COMPLETED') {
      const incompletePrereqs = await Task.find({
        _id: { $in: task.dependencies },
        status: { $ne: 'COMPLETED' }
      });

      if (incompletePrereqs.length > 0) {
        const existingRisk = await Risk.findOne({
          eventId,
          relatedTaskId: task._id,
          title: { $regex: /Dependency Block/i },
          status: 'OPEN'
        });

        if (!existingRisk) {
          detectedRisks.push({
            eventId,
            title: `Dependency Block: "${task.title}" is waiting`,
            description: `This task cannot proceed because prerequisite task(s) (${incompletePrereqs.map(p => p.title).join(', ')}) are incomplete.`,
            severity: task.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
            source: 'RULE_ENGINE',
            relatedTaskId: task._id,
            recommendedAction: `Focus resources on finishing prerequisite task "${incompletePrereqs[0].title}".`
          });
        }
      }
    }
  }

  // RULE 3: Volunteer Workload Overload
  for (const vol of volunteers) {
    if (vol.currentWorkload >= vol.maximumWorkload) {
      const existingRisk = await Risk.findOne({
        eventId,
        title: { $regex: new RegExp(vol.name, 'i') },
        status: 'OPEN'
      });

      if (!existingRisk) {
        detectedRisks.push({
          eventId,
          title: `Volunteer Overload: ${vol.name}`,
          description: `${vol.name} is carrying ${vol.currentWorkload} active tasks (max capacity is ${vol.maximumWorkload}). Risk of burnout or missed deadlines.`,
          severity: 'MEDIUM',
          source: 'RULE_ENGINE',
          recommendedAction: `Reassign 1-2 lower priority tasks from ${vol.name} to available team members.`
        });
      }
    }
  }

  // RULE 4: Unassigned Critical Tasks
  for (const task of tasks) {
    if (task.priority === 'CRITICAL' && (!task.assignedTo || task.assignedVolunteerName === 'Unassigned') && task.status !== 'COMPLETED') {
      const existingRisk = await Risk.findOne({
        eventId,
        relatedTaskId: task._id,
        title: { $regex: /Unassigned Critical Task/i },
        status: 'OPEN'
      });

      if (!existingRisk) {
        detectedRisks.push({
          eventId,
          title: `Unassigned Critical Task: "${task.title}"`,
          description: `This is a CRITICAL priority operational task with no designated owner.`,
          severity: 'CRITICAL',
          source: 'RULE_ENGINE',
          relatedTaskId: task._id,
          recommendedAction: `Assign an experienced volunteer right away using the AI assignment tool.`
        });
      }
    }
  }

  // Save new risks into database
  let newlyCreated = [];
  if (detectedRisks.length > 0) {
    newlyCreated = await Risk.insertMany(detectedRisks);
    await ActivityLog.create({
      eventId,
      action: 'RISK_ENGINE_EVALUATION',
      details: `Automated Risk Engine identified ${newlyCreated.length} operational risk(s) requiring attention`,
      category: 'RISK'
    });
  }

  const allOpenRisks = await Risk.find({ eventId, status: 'OPEN' }).sort({ severity: -1 });

  return {
    newlyDetectedCount: newlyCreated.length,
    newlyDetected: newlyCreated,
    openRisksCount: allOpenRisks.length,
    allOpenRisks
  };
};
