import mongoose from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES, TASK_SOURCES } from '../config/constants.js';

const taskSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: [true, 'Task title is required'], 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  category: { 
    type: String, 
    enum: TASK_CATEGORIES,
    default: 'Logistics',
    index: true
  },
  priority: { 
    type: String, 
    enum: Object.values(TASK_PRIORITIES), 
    default: TASK_PRIORITIES.MEDIUM,
    index: true
  },
  status: { 
    type: String, 
    enum: Object.values(TASK_STATUSES), 
    default: TASK_STATUSES.TODO,
    index: true
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null,
    index: true
  },
  assignedVolunteerName: { 
    type: String, 
    default: 'Unassigned' 
  },
  deadline: { 
    type: Date, 
    required: [true, 'Deadline date is required'],
    index: true
  },
  dependencies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  }],
  source: { 
    type: String, 
    enum: Object.values(TASK_SOURCES), 
    default: TASK_SOURCES.MANUAL 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

export const Task = mongoose.model('Task', taskSchema);
