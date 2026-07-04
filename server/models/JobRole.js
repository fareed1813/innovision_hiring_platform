import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  fileName:   { type: String, required: true },
  fileData:   { type: String, required: true }, // base64 encoded PDF
  mimeType:   { type: String, default: 'application/pdf' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const jobRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  // "other" = custom roles like Electrician, Mechanic, Fitter, etc.
  category: {
    type: String,
    enum: ['other'],
    default: 'other'
  },

  subRoles: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    desc: { type: String, default: '' }
  }],

  // Short description shown on landing page / carousel
  description: {
    type: String,
    trim: true,
    default: ''
  },

  // Icon identifier (optional, falls back to a default icon)
  iconKey: {
    type: String,
    default: 'wrench'
  },

  active: {
    type: Boolean,
    default: true,
    index: true
  },

  // PDF documents attached by admin (job descriptions, brochures, offer letters)
  attachments: [attachmentSchema]

}, { timestamps: true });

export default mongoose.model('JobRole', jobRoleSchema);
