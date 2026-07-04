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

  // Always international
  type: {
    type: String,
    enum: ['international'],
    default: 'international',
    index: true
  },

  // Personal details
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  email:      { type: String, trim: true, lowercase: true },
  experience: { type: String },
  education:  { type: String },
  languages:  { type: String },
  source:     { type: String, default: 'Direct' },

  // International fields
  city:            { type: String, trim: true },
  passport:        { type: String, trim: true },
  gulfExp:         { type: String },
  applyingCountry: { type: String, trim: true },
  dob:             { type: String, trim: true }, // Date of birth (stored as string e.g. '1995-08-15')
  height:          { type: String, trim: true }, // Free-text height (e.g. "5'8" / 173 cm")

  // Assessment metadata
  job: { type: String, required: true, index: true },

  assessmentStatus: {
    type: String,
    enum: ['form_submitted', 'assessment_submitted'],
    default: 'form_submitted',
    index: true
  },

  // Scores — computed server-side
  scores: {
    total:   { type: Number, default: 0 },
    reading: { type: Number, default: 0 },
    voice:   { type: Number, default: 0 },
    quality: { type: Number, default: 0 }
  },

  questions:       [{ type: mongoose.Schema.Types.Mixed }],
  answers:         { type: Map, of: String, default: {} },
  evaluations:     { type: Map, of: evaluationSchema, default: {} },
  audioRecordings: { type: Map, of: String, default: {} },

  status: {
    type: String,
    enum: ['pending', 'selected', 'rejected'],
    default: 'pending',
    index: true
  },

  proctoring: {
    tabSwitches:     { type: Number, default: 0 },
    fullscreenExits: { type: Number, default: 0 }
  },
  proctoringViolations: { type: Number, default: 0 },

  retestReason: { type: String, trim: true, default: '' },

  retestStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
    index: true
  }

}, { timestamps: true });

candidateSchema.index({ status: 1, createdAt: -1 });
candidateSchema.index({ job: 1, status: 1 });

candidateSchema.index({ phone: 1, job: 1 }, { unique: true });
candidateSchema.index({ email: 1, job: 1 }, { unique: true, sparse: true });

export default mongoose.model('Candidate', candidateSchema);
