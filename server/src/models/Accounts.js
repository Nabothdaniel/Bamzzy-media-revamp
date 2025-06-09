// models/Account.js
import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  loginDetails: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  howToUse: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available',
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, {
  timestamps: true,  
});

export const Account = mongoose.model('Account', accountSchema);

