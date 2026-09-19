import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true,
    trim: true 
  },
  skills: [{ 
    type: String,
    trim: true 
  }],
  availability: { 
    type: String, 
    default: 'Full Day' 
  },
  currentWorkload: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  maximumWorkload: { 
    type: Number, 
    default: 5,
    min: 1 
  },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], 
    default: 'AVAILABLE' 
  }
}, { 
  timestamps: true 
});

volunteerSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Volunteer = mongoose.model('Volunteer', volunteerSchema);
