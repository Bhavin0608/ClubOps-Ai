import mongoose from 'mongoose';
import { AI_ACTION_TYPES, AI_ACTION_STATUSES } from '../config/constants.js';

const aiActionSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  actionType: { 
    type: String, 
    enum: Object.values(AI_ACTION_TYPES), 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  reason: { 
    type: String, 
    default: '' 
  },
  parameters: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(AI_ACTION_STATUSES), 
    default: AI_ACTION_STATUSES.PROPOSED,
    index: true 
  },
  executionResult: { 
    type: mongoose.Schema.Types.Mixed,
    default: null 
  },
  errorMessage: { 
    type: String, 
    default: null 
  },
  executedAt: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

export const AIAction = mongoose.model('AIAction', aiActionSchema);
