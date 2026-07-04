import { Router } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import JobRole from '../models/JobRole.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ─── GET /api/roles — Public: list all active roles ─── */
router.get('/', async (req, res) => {
  try {
    const roles = await JobRole.find({ active: true })
      .select('-attachments.fileData') // Don't send binary data in the list
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
      .select('-attachments.fileData')
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
    res.setHeader('Content-Disposition', `attachment; filename="${att.fileName}"`);
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
    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    const rawText = pdfData.text || pdfData.pages?.map(p => p.text).join('\n') || '';

    // 2. Local Heuristics / NLP parsing
    let extractedName = '';
    let extractedDescription = '';

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Heuristic for Role Name
    const titleRegex = /^(?:Job Title|Role|Position|Title)\s*:\s*(.+)$/i;
    for (const line of lines) {
      const match = line.match(titleRegex);
      if (match && match[1]) {
        extractedName = match[1].trim();
        break;
      }
    }
    
    // Fallback for Role Name: first reasonably short, non-empty line
    if (!extractedName) {
      for (const line of lines) {
        if (line.length < 60 && !line.toLowerCase().includes('description') && !line.toLowerCase().includes('innovision')) {
          extractedName = line;
          break;
        }
      }
    }

    // Heuristic for Description
    const descRegex = /^(?:Description|About the Role|Summary|Job Summary|Overview)\s*[:\n\-]?/i;
    let foundDescHeader = false;
    let descLines = [];

    for (let i = 0; i < lines.length; i++) {
      if (!foundDescHeader && descRegex.test(lines[i])) {
        foundDescHeader = true;
        // If the description is on the same line (e.g. "Description: We are looking for...")
        const inlineDesc = lines[i].replace(descRegex, '').trim();
        if (inlineDesc.length > 20) {
          descLines.push(inlineDesc);
        }
        continue;
      }
      
      if (foundDescHeader) {
        // Stop if we hit another obvious header
        if (/^(?:Requirements|Qualifications|Responsibilities|Duties|Benefits|Salary)\s*:/i.test(lines[i])) {
          break;
        }
        descLines.push(lines[i]);
        if (descLines.join(' ').length > 400) break; // Don't grab too much
      }
    }

    // Fallback for Description: Grab the first large paragraph if no headers found
    if (descLines.length === 0) {
      for (const line of lines) {
        if (line.length > 100) {
          extractedDescription = line;
          break;
        }
      }
    } else {
      extractedDescription = descLines.join(' ');
    }

    // Cleanup extracted text
    if (extractedName.length > 100) extractedName = extractedName.substring(0, 100) + '...';
    if (extractedDescription.length > 500) extractedDescription = extractedDescription.substring(0, 500) + '...';

    res.json({
      name: extractedName || '',
      description: extractedDescription || ''
    });
  } catch (err) {
    console.error('Parse JD error:', err);
    res.status(500).json({ error: 'Failed to parse the PDF document.' });
  }
});

export default router;
