import mongoose from 'mongoose';
import { RISK_SEVERITIES, RISK_STATUSES, RISK_SOURCES } from '../config/constants.js';

const riskSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: [true, 'Risk title is required'],
    trim: true 
  },
  description: { 
    type: String, 
    required: [true, 'Risk description is required'],
    trim: true 
  },
  severity: { 
    type: String, 
    enum: Object.values(RISK_SEVERITIES), 
    default: RISK_SEVERITIES.MEDIUM,
    index: true 
  },
  source: { 
    type: String, 
    enum: Object.values(RISK_SOURCES), 
    default: RISK_SOURCES.RULE_ENGINE 
  },
  relatedTaskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    default: null 
  },
  recommendedAction: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: Object.values(RISK_STATUSES), 
    default: RISK_STATUSES.OPEN,
    index: true 
  },
  resolvedAt: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

export const Risk = mongoose.model('Risk', riskSchema);
