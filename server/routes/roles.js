import { Router } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import JobRole from '../models/JobRole.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ─── GET /api/roles — Public: list all active roles ─── */
router.get('/', async (req, res) => {
  try {
    const roles = await JobRole.find({ active: true })
      .select('-attachments.fileData -subRoles.attachments.fileData') // Don't send binary data in the list
      .sort({ createdAt: -1 })
      .lean();
    res.json(roles);
  } catch (err) {
    console.error('Fetch roles error:', err);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

/* ─── GET /api/roles/all — Admin: list all roles (incl. inactive) ─── */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const roles = await JobRole.find()
      .select('-attachments.fileData -subRoles.attachments.fileData')
      .sort({ createdAt: -1 })
      .lean();
    res.json(roles);
  } catch (err) {
    console.error('Fetch all roles error:', err);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

/* ─── POST /api/roles — Admin: create a new role ─── */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category = 'other', description = '', iconKey = 'wrench', subRoles = [] } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Role name is required.' });
    }

    // Check for duplicate name
    const existing = await JobRole.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ error: 'A role with this name already exists.' });
    }

    const role = new JobRole({ name: name.trim(), category, description: description.trim(), iconKey, subRoles });
    await role.save();

    res.status(201).json({ message: 'Role created.', role: { ...role.toObject(), attachments: [] } });
  } catch (err) {
    console.error('Create role error:', err);
    res.status(500).json({ error: 'Failed to create role.' });
  }
});

/* ─── PATCH /api/roles/:id — Admin: update a role ─── */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, active, iconKey, subRoles } = req.body;
    const updates = {};
    if (name !== undefined)        updates.name        = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (active !== undefined)      updates.active      = active;
    if (iconKey !== undefined)     updates.iconKey     = iconKey;
    if (subRoles !== undefined)    updates.subRoles    = subRoles;

    const role = await JobRole.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-attachments.fileData')
      .lean();

    if (!role) return res.status(404).json({ error: 'Role not found.' });
    res.json({ message: 'Role updated.', role });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

/* ─── DELETE /api/roles/:id — Admin: delete a role ─── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await JobRole.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted.' });
  } catch (err) {
    console.error('Delete role error:', err);
    res.status(500).json({ error: 'Failed to delete role.' });
  }
});

/* ─── POST /api/roles/:id/attachments — Admin: upload a PDF ─── */
router.post('/:id/attachments', authMiddleware, async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'fileName and fileData are required.' });
    }

    const role = await JobRole.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found.' });

    role.attachments.push({ fileName, fileData, mimeType: mimeType || 'application/pdf', uploadedAt: new Date() });
    await role.save();

    // Return just the metadata (not the binary data)
    const added = role.attachments[role.attachments.length - 1];
    res.status(201).json({
      message: 'Attachment uploaded.',
      attachment: { _id: added._id, fileName: added.fileName, mimeType: added.mimeType, uploadedAt: added.uploadedAt }
    });
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'Failed to upload attachment.' });
  }
});

/* ─── GET /api/roles/:id/attachments/:attachmentId — Download PDF ─── */
router.get('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found.' });

    const att = role.attachments.id(req.params.attachmentId);
    if (!att) return res.status(404).json({ error: 'Attachment not found.' });

    // Strip the base64 prefix if present (e.g. "data:application/pdf;base64,")
    const base64Data = att.fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', att.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${att.fileName}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Download attachment error:', err);
    res.status(500).json({ error: 'Failed to download attachment.' });
  }
});

/* ─── DELETE /api/roles/:id/attachments/:attachmentId — Remove PDF ─── */
router.delete('/:id/attachments/:attachmentId', authMiddleware, async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found.' });

    role.attachments.pull({ _id: req.params.attachmentId });
    await role.save();

    res.json({ message: 'Attachment removed.' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ error: 'Failed to delete attachment.' });
  }
});

/* ─── POST /api/roles/parse-jd — Admin: Parse JD PDF with Local NLP Heuristics ─── */
router.post('/parse-jd', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });

    // 1. Extract raw text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text || '';

    // 2. Local Heuristics / NLP parsing
    let extractedName = '';
    let extractedDescription = '';

    // Split text into lines, trim, and remove empty lines
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // -- IMPROVED HEURISTIC FOR ROLE NAME --
    // Look for explicit tags first (case-insensitive, allowing spaces and hyphens)
    const titleRegex = /(?:Job Title|Role|Position|Title)[\s:-]+(.+)/i;
    for (const line of lines) {
      const match = line.match(titleRegex);
      if (match && match[1] && match[1].length < 100) {
        extractedName = match[1].trim();
        break;
      }
    }
    
    // Fallback: analyze the first few lines to find something that looks like a title
    if (!extractedName) {
      const skipWords = ['job description', 'page', 'innovision', 'confidential', 'hiring', 'proposal', 'overview'];
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        // Skip obvious non-titles
        if (skipWords.some(w => lowerLine.includes(w))) continue;
        if (line.length > 60 || line.length < 3) continue; // Too long or short
        
        // Prefer lines that are Title Case or ALL CAPS, or just the first valid short string
        extractedName = line;
        break;
      }
    }

    // -- IMPROVED HEURISTIC FOR DESCRIPTION --
    // Common headers for descriptions
    const descHeaderRegex = /^(?:Description|About the Role|Summary|Job Summary|Overview|About the Job|The Role|Position Overview)[\s:-]*/i;
    // Common headers for sections that come AFTER the description
    const nextSectionRegex = /^(?:Requirements|Qualifications|Responsibilities|Duties|Benefits|Salary|What You'll Do|What You Will Do|Skills|Experience)[\s:-]*/i;
    
    let foundDescHeader = false;
    let descLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!foundDescHeader && descHeaderRegex.test(line)) {
        foundDescHeader = true;
        // Check if there is text on the same line after the header
        const inlineDesc = line.replace(descHeaderRegex, '').trim();
        if (inlineDesc.length > 15) {
          descLines.push(inlineDesc);
        }
        continue;
      }
      
      if (foundDescHeader) {
        // Stop if we hit the next major section header
        if (nextSectionRegex.test(line) && line.length < 50) {
          break;
        }
        descLines.push(line);
        // Stop if we've accumulated enough (around 800 chars)
        if (descLines.join(' ').length > 800) break;
      }
    }

    // Fallback for Description: If no explicit headers found, find the first substantial paragraph
    if (descLines.length === 0) {
      let gathering = false;
      for (const line of lines) {
        // A substantial paragraph is usually long and doesn't look like a header
        if (line.length > 80 && !nextSectionRegex.test(line)) {
          gathering = true;
          descLines.push(line);
        } else if (gathering && line.length > 30) {
          // Keep gathering if the next line is also text
          descLines.push(line);
        } else if (gathering) {
          // Break once the paragraph ends
          break;
        }
        if (descLines.join(' ').length > 800) break;
      }
    }

    extractedDescription = descLines.join(' ').trim();

    // -- FINAL CLEANUP --
    extractedName = extractedName.replace(/\s+/g, ' ').replace(/[^\w\s\-,&/()]/g, '');
    extractedDescription = extractedDescription.replace(/\s+/g, ' ');

    if (extractedName.length > 100) extractedName = extractedName.substring(0, 100).trim() + '...';
    if (extractedDescription.length > 1000) extractedDescription = extractedDescription.substring(0, 1000).trim() + '...';

    res.json({
      name: extractedName || '',
      description: extractedDescription || ''
    });
  } catch (err) {
    console.error('Parse JD error:', err);
    res.status(500).json({ error: 'Failed to parse the PDF document.' });
  }
});

/* ─── POST /api/roles/:id/subroles/:subKey/attachments — Upload PDF for a sub-role ─── */
router.post('/:id/subroles/:subKey/attachments', authMiddleware, async (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'fileName and fileData are required.' });
    }
    const role = await JobRole.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found.' });
    const sub = role.subRoles.find(s => s.key === req.params.subKey);
    if (!sub) return res.status(404).json({ error: 'Sub-role not found.' });

    sub.attachments.push({ fileName, fileData, mimeType: mimeType || 'application/pdf', uploadedAt: new Date() });
    await role.save();

    const added = sub.attachments[sub.attachments.length - 1];
    res.status(201).json({
      message: 'Sub-role attachment uploaded.',
      attachment: { _id: added._id, fileName: added.fileName, mimeType: added.mimeType, uploadedAt: added.uploadedAt }
    });
  } catch (err) {
    console.error('Upload sub-role attachment error:', err);
    res.status(500).json({ error: 'Failed to upload sub-role attachment.' });
  }
});

/* ─── GET /api/roles/:id/subroles/:subKey/attachments/:attId — Stream sub-role PDF ─── */
router.get('/:id/subroles/:subKey/attachments/:attId', async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found.' });
    const sub = role.subRoles.find(s => s.key === req.params.subKey);
    if (!sub) return res.status(404).json({ error: 'Sub-role not found.' });
    const att = sub.attachments.id(req.params.attId);
    if (!att) return res.status(404).json({ error: 'Attachment not found.' });

    const base64Data = att.fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', att.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${att.fileName}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Stream sub-role attachment error:', err);
    res.status(500).json({ error: 'Failed to stream sub-role attachment.' });
  }
});

/* ─── DELETE /api/roles/:id/subroles/:subKey/attachments/:attId — Remove sub-role PDF ─── */
router.delete('/:id/subroles/:subKey/attachments/:attId', authMiddleware, async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found.' });
    const sub = role.subRoles.find(s => s.key === req.params.subKey);
    if (!sub) return res.status(404).json({ error: 'Sub-role not found.' });
    sub.attachments.pull({ _id: req.params.attId });
    await role.save();
    res.json({ message: 'Sub-role attachment removed.' });
  } catch (err) {
    console.error('Delete sub-role attachment error:', err);
    res.status(500).json({ error: 'Failed to delete sub-role attachment.' });
  }
});

export default router;
