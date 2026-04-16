import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  qid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['reading', 'comprehension', 'situational', 'essay', 'fluency', 'mcq'],
    required: true
  },
  passage: { type: String, default: '' },
  question: { type: String, required: true },
  expectedAnswer: { type: String, default: '' },
  expectedOption: { type: String, default: '' },
  expectedKeywords: [{ type: String }],
  options: [{
    key: String,
    text: String
  }],
  // For fluency passages — companion questions
  companions: [{
    q: String,
    a: String
  }],
  // For essay prompts — follow-up questions
  followUps: [{
    q: String,
    a: String
  }],
  seeds: [{ type: String }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

questionSchema.index({ role: 1, type: 1, active: 1 });

export default mongoose.model('Question', questionSchema);
