import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false          // Never returned in queries by default
  },
  displayName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Super Admin', 'HR Manager', 'Recruiter'],
    default: 'Recruiter'
  }
}, { timestamps: true });

// Pre-save: hash password with bcrypt (12 rounds — OWASP recommended)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare candidate password against hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
