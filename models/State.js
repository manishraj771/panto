import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // State expires after 5 minutes
});

export default mongoose.model('State', stateSchema);
