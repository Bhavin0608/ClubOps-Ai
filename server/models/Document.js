import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['Proposal', 'Sponsorship', 'Guidelines', 'Budget', 'Technical', 'Schedule', 'Report', 'Other'],
    default: 'Guidelines' 
  },
  content: { 
    type: String, 
    default: '' 
  },
  fileUrl: { 
    type: String, 
    default: '' 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

export const Document = mongoose.model('Document', documentSchema);
