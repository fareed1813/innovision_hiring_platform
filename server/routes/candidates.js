import { Router } from 'express';
import { randomBytes } from 'crypto';
import Candidate from '../models/Candidate.js';
import Question from '../models/Question.js';
import authMiddleware from '../middleware/auth.js';
import { scoreAssessment } from '../utils/scoring.js';
import { buildQuestionsForRole } from '../utils/questionBuilder.js';

const router = Router();



/* ─── POST /api/candidates/submit-form — Save form details only ─── */
router.post('/submit-form', async (req, res) => {
  try {
    const { personal, job, source, type } = req.body;

    if (!personal || !job) {
      return res.status(400).json({ error: 'Personal details and job role are required.' });
    }

    // Deduplication check
    const existing = await Candidate.findOne({
      job,
      $or: [
        { phone: personal.phone?.trim() },
        ...(personal.email ? [{ email: personal.email.trim().toLowerCase() }] : [])
      ]
    });

    if (existing) {
      return res.status(409).json({
        error: 'Application already exists.',
        refId: existing.refId,
        candidateId: existing._id,
        message: 'You have already applied for this role.',
        assessmentStatus: existing.assessmentStatus
      });
    }

    const refId = 'INV' + randomBytes(4).toString('hex').toUpperCase();

    const candidate = new Candidate({
      refId,
      ...personal,
      job,
      source: source || 'Direct',
      type: type || 'international',
      assessmentStatus: 'form_submitted',
      scores: { total: 0, reading: 0, voice: 0, quality: 0 },
      questions: [],
      answers: {},
      evaluations: {},
      audioRecordings: {},
      proctoring: { tabSwitches: 0, fullscreenExits: 0 },
      proctoringViolations: 0,
      status: 'pending'
    });


    await candidate.save();

    res.status(201).json({
      refId,
      candidateId: candidate._id,
      message: 'Form submitted successfully.'
    });
  } catch (err) {
    console.error('Form submission error:', err);
    res.status(500).json({ error: 'Failed to submit form.' });
  }
});


/* ─── POST /api/candidates — Submit assessment ──────── */
router.post('/', async (req, res) => {
  try {
    const { personal, job, source, answers, audioRecordings, questions: providedQuestions, proctoringViolations, proctoring, candidateId } = req.body;
    
    if (!personal || !job) {
      return res.status(400).json({ error: 'Personal details and job role are required.' });
    }

    // Build or use provided questions snapshot
    const questions = providedQuestions || await buildQuestionsForRole(job);
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'No questions configured for this role.' });
    }
    
    // Score the assessment server-side (tamper-proof)
    const { total, reading, voice, quality, evaluations } = scoreAssessment(questions, answers || {});

    // Map proctoring data
    const finalProctoring = proctoring || { 
      tabSwitches: typeof proctoringViolations === 'number' ? proctoringViolations : 0, 
      fullscreenExits: 0 
    };
    const finalViolationsCount = typeof proctoringViolations === 'number' 
      ? proctoringViolations 
      : ((finalProctoring?.tabSwitches || 0) + (finalProctoring?.fullscreenExits || 0));

    // ── PATH A: Update existing form-submitted record ──
    if (candidateId) {
      const updated = await Candidate.findByIdAndUpdate(
        candidateId,
        {
          questions,
          answers: answers || {},
          audioRecordings: audioRecordings || {},
          evaluations,
          scores: { total, reading, voice, quality },
          proctoring: finalProctoring,
          proctoringViolations: finalViolationsCount,
          assessmentStatus: 'assessment_submitted'
        },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ error: 'Candidate record not found. Please resubmit the form.' });
      }


      return res.status(200).json({
        refId: updated.refId,
        scores: { total, reading, voice, quality },
        message: 'Assessment submitted and scores updated.'
      });
    }

    // ── PATH B: Legacy / fallback (no candidateId) ── 
    const existing = await Candidate.findOne({
      job,
      $or: [
        { phone: personal.phone?.trim() },
        { email: personal.email?.trim().toLowerCase() }
      ]
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'Assessment already submitted.', 
        refId: existing.refId,
        message: 'You have already completed the assessment for this role.' 
      });
    }
    
    const refId = 'INV' + randomBytes(4).toString('hex').toUpperCase();
    
    const candidate = new Candidate({
      refId,
      ...personal,
      job,
      source: source || 'Direct',
      questions,
      answers: answers || {},
      audioRecordings: audioRecordings || {},
      evaluations,
      scores: { total, reading, voice, quality },
      proctoring: finalProctoring,
      proctoringViolations: finalViolationsCount,
      assessmentStatus: 'assessment_submitted',
      status: 'pending'
    });
    
    await candidate.save();
    
    res.status(201).json({
      refId,
      scores: { total, reading, voice, quality },
      message: 'Assessment submitted successfully.'
    });
  } catch (err) {
    console.error('Candidate submission error:', err);
    res.status(500).json({ error: 'Failed to submit assessment.' });
  }
});

/* ─── GET /api/candidates — List all (admin) ─────────── */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, job, search, page = 1, limit = 50, type } = req.query;
    const filter = {};
    const andConditions = [];
    
    if (status && status !== 'all') filter.status = status;
    if (job && job !== 'all') filter.job = job;
    
    if (type && type !== 'all') {
      if (type === 'international') {
        andConditions.push({ $or: [{ type: 'international' }, { type: { $exists: false } }] });
      } else {
        filter.type = type;
      }
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      andConditions.push({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { phone: regex },
          { city: regex },
          { cityVillage: regex },
          { refId: regex }
        ]
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [candidates, total] = await Promise.all([
      Candidate.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Candidate.countDocuments(filter)
    ]);
    
    res.json({ candidates, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('List candidates error:', err);
    res.status(500).json({ error: 'Failed to fetch candidates.' });
  }
});

/* ─── GET /api/candidates/check-duplication ───── */
router.get('/check-duplication', async (req, res) => {
  try {
    const { phone, email, job } = req.query;
    if (!phone || !job) {
      return res.status(400).json({ error: 'Phone and job are required for duplication check.' });
    }
    
    // Check if a candidate exists with (this phone OR this email) AND this job
    const query = {
      $and: [
        { job },
        {
          $or: [
            { phone: phone.trim() },
            ...(email ? [{ email: email.trim().toLowerCase() }] : [])
          ]
        }
      ]
    };
    
    const existing = await Candidate.findOne(query).lean();
    res.json({ isDuplicate: !!existing });
  } catch (err) {
    console.error('Check duplication error:', err);
    res.status(500).json({ error: 'Failed to verify application status.' });
  }
});

/* ─── GET /api/candidates/stats — Dashboard stats ────── */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const baseFilter = {};
    
    if (type && type !== 'all') {
      if (type === 'international') {
        baseFilter.$or = [{ type: 'international' }, { type: { $exists: false } }];
      } else {
        baseFilter.type = type;
      }
    }

    const [total, pending, selected, rejected] = await Promise.all([
      Candidate.countDocuments(baseFilter),
      Candidate.countDocuments({ ...baseFilter, status: 'pending' }),
      Candidate.countDocuments({ ...baseFilter, status: 'selected' }),
      Candidate.countDocuments({ ...baseFilter, status: 'rejected' })
    ]);
    res.json({ total, pending, selected, rejected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

/* ─── GET /api/candidates/:id — Single candidate ─────── */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).lean();
    if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate.' });
  }
});

/* ─── PATCH /api/candidates/:id/status — Update status ── */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'selected', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    
    if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
    
    res.json({ message: `Candidate ${status}.`, candidate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

/* ─── DELETE /api/candidates/:id — Delete candidate ──── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete candidate.' });
  }
});



/* ─── GET /api/candidates/export/csv — CSV export (streamed) ──── */
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const { status, job, type } = req.query;
    const filter = {};
    const andConditions = [];
    
    if (status && status !== 'all') filter.status = status;
    if (job && job !== 'all') filter.job = job;

    if (type && type !== 'all') {
      if (type === 'international') {
        andConditions.push({ $or: [{ type: 'international' }, { type: { $exists: false } }] });
      } else {
        filter.type = type;
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=innovision_export_${new Date().toISOString().split('T')[0]}.csv`);

    // Write header row immediately
    const headers = ['Ref ID', 'First Name', 'Last Name', 'Phone', 'Email', 'City', 'Job', 'Source', 'Score', 'Status', 'Date'];
    res.write(headers.map(h => `"${h}"`).join(',') + '\n');

    // Stream rows via cursor — never loads all documents into memory
    const cursor = Candidate.find(filter)
      .sort({ createdAt: -1 })
      .select('-questions -answers -audioRecordings -evaluations') // exclude heavy fields
      .lean()
      .cursor();

    for await (const c of cursor) {
      const row = [
        c.refId, c.firstName, c.lastName, c.phone, c.email || '', c.city,
        c.job, c.source, c.scores?.total || 0, c.status,
        new Date(c.createdAt).toLocaleDateString()
      ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',');
      res.write(row + '\n');
    }

    res.end();
  } catch (err) {
    console.error('CSV export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export.' });
    } else {
      res.end();
    }
  }
});

export default router;
