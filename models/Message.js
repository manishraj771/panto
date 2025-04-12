import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered'], default: 'delivered' }, // New field
});

export default mongoose.model('Message', messageSchema);