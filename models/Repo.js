import mongoose from 'mongoose';

const repoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  fullName: String,
  description: String,
  url: String,
  stars: Number,
  defaultBranch: String,
  private: Boolean,
  updatedAt: String,
  autoReview: { type: Boolean, default: false }, // ✅ Auto Review setting
});

export default mongoose.model('Repo', repoSchema);
