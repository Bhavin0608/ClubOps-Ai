import mongoose from 'mongoose';
import { EVENT_STATUSES } from '../config/constants.js';

const eventSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Event name is required'], 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  venue: { 
    type: String, 
    required: [true, 'Venue is required'],
    trim: true
  },
  eventDate: { 
    type: Date, 
    required: [true, 'Event date is required'] 
  },
  startTime: { 
    type: String, 
    required: [true, 'Start time is required'],
    default: '09:00' 
  },
  endTime: { 
    type: String, 
    required: [true, 'End time is required'],
    default: '18:00' 
  },
  status: { 
    type: String, 
    enum: Object.values(EVENT_STATUSES), 
    default: EVENT_STATUSES.PLANNING,
    index: true
  },
  expectedAudience: { 
    type: Number, 
    default: 100,
    min: 1
  },
  organizerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  }
}, { 
  timestamps: true 
});

export const Event = mongoose.model('Event', eventSchema);
