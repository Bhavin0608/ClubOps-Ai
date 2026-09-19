import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: { 
    type: String, 
    enum: Object.values(USER_ROLES), 
    default: USER_ROLES.VOLUNTEER 
  },
  phone: { 
    type: String, 
    trim: true,
    default: '' 
  },
  skills: [{ 
    type: String, 
    trim: true 
  }],
  availability: { 
    type: String, 
    default: 'Available throughout event' 
  },
  maxWorkload: { 
    type: Number, 
    default: 5,
    min: 1
  }
}, { 
  timestamps: true 
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
