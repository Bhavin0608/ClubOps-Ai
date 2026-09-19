import mongoose from 'mongoose';

const actionItemSubSchema = new mongoose.Schema({
  title: { type: String, required: true },
  owner: { type: String, default: 'Unknown' },
  matchedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deadline: { type: String, default: 'Unclear' },
  parsedDeadline: { type: Date, default: null },
  priority: { type: String, default: 'MEDIUM' },
  category: { type: String, default: 'Logistics' }
}, { _id: true });

const riskItemSubSchema = new mongoose.Schema({
  title: { type: String, required: true },
  severity: { type: String, default: 'MEDIUM' },
  reason: { type: String, default: '' }
}, { _id: true });

const meetingSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: [true, 'Meeting title is required'],
    trim: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  participants: [{ 
    type: String,
    trim: true 
  }],
  notes: { 
    type: String, 
    default: '' 
  },
  transcript: { 
    type: String, 
    default: '' 
  },
  analyzed: { 
    type: Boolean, 
    default: false 
  },
  extractionResult: {
    decisions: [{ type: String }],
    actionItems: [actionItemSubSchema],
    risks: [riskItemSubSchema]
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

export const Meeting = mongoose.model('Meeting', meetingSchema);
