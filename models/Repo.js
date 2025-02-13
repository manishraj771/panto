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
  autoReview: { type: Boolean, default: false }, 
});


// export default mongoose.model('Repo', repoSchema);
const Repo = mongoose.model('Repo', repoSchema);
export default Repo;  // ✅ Correct ES Module Export