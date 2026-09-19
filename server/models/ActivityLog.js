import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  userName: { 
    type: String, 
    default: 'ClubOps AI Agent' 
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['TASK', 'VOLUNTEER', 'MEETING', 'RISK', 'AI_ACTION', 'EVENT'], 
    default: 'EVENT' 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { 
  timestamps: true 
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
