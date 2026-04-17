import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  matched: { type: Boolean, default: false },
  feedback: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  refId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Personal details
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  email:      { type: String, trim: true, lowercase: true },
  city:       { type: String, trim: true },
  experience: { type: String },
  passport:   { type: String, trim: true },
  education:  { type: String },
  languages:  { type: String },
  gulfExp:    { type: String },
  
  // Assessment metadata
  job:        { type: String, required: true, index: true },
  source:     { type: String, default: 'Direct' },
  
  // Scores — computed server-side
  scores: {
    total:   { type: Number, default: 0 },
    reading: { type: Number, default: 0 },
    voice:   { type: Number, default: 0 },
    quality: { type: Number, default: 0 }
  },
  
  // Questions served to this candidate (snapshot)
  questions: [{ type: mongoose.Schema.Types.Mixed }],
  
  // Answers keyed by question ID
  answers: { type: Map, of: String, default: {} },
  
  // Per-question evaluation results
  evaluations: { type: Map, of: evaluationSchema, default: {} },
  
  // Audio recordings (Base64 data URIs keyed by questionId_audio)
  audioRecordings: { type: Map, of: String, default: {} },
  
  // Workflow
  status: {
    type: String,
    enum: ['pending', 'selected', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Integrity
  proctoring: {
    tabSwitches: { type: Number, default: 0 },
    fullscreenExits: { type: Number, default: 0 }
  },
  proctoringViolations: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index for dashboard queries
candidateSchema.index({ status: 1, createdAt: -1 });
candidateSchema.index({ job: 1, status: 1 });

// Safety net: Unique index to prevent duplicates at DB level
candidateSchema.index({ phone: 1, job: 1 }, { unique: true });
candidateSchema.index({ email: 1, job: 1 }, { unique: true, sparse: true });

export default mongoose.model('Candidate', candidateSchema);
