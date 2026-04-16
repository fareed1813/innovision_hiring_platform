import { Router } from 'express';
import Candidate from '../models/Candidate.js';
import Question from '../models/Question.js';
import authMiddleware from '../middleware/auth.js';
import { scoreAssessment } from '../utils/scoring.js';
import { buildQuestionsForRole } from '../utils/questionBuilder.js';

const router = Router();



/* ─── POST /api/candidates — Submit assessment ──────── */
router.post('/', async (req, res) => {
  try {
    const { personal, job, source, answers, audioRecordings, questions: providedQuestions, proctoringViolations } = req.body;
    
    if (!personal || !job) {
      return res.status(400).json({ error: 'Personal details and job role are required.' });
    }

    // Deduplication Check
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
    
    // Build or use provided questions snapshot
    const questions = providedQuestions || await buildQuestionsForRole(job);
    
    if (questions.length === 0) {
      return res.status(400).json({ error: 'No questions configured for this role.' });
    }
    
    // Score the assessment server-side (tamper-proof)
    const { total, reading, voice, quality, evaluations } = scoreAssessment(questions, answers || {});
    
    const refId = 'INV' + Date.now().toString().slice(-7);
    
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
      proctoringViolations: proctoringViolations || 0,
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
    const { status, job, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    
    if (status && status !== 'all') filter.status = status;
    if (job && job !== 'all') filter.job = job;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
        { city: regex },
        { refId: regex }
      ];
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
    const [total, pending, selected, rejected] = await Promise.all([
      Candidate.countDocuments(),
      Candidate.countDocuments({ status: 'pending' }),
      Candidate.countDocuments({ status: 'selected' }),
      Candidate.countDocuments({ status: 'rejected' })
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



/* ─── GET /api/candidates/export/csv — CSV export ──────── */
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const { status, job } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (job && job !== 'all') filter.job = job;
    
    const candidates = await Candidate.find(filter).sort({ createdAt: -1 }).lean();
    
    const headers = ['Ref ID', 'First Name', 'Last Name', 'Phone', 'Email', 'City', 'Job', 'Source', 'Score', 'Status', 'Date'];
    const rows = candidates.map(c => [
      c.refId, c.firstName, c.lastName, c.phone, c.email || '', c.city,
      c.job, c.source, c.scores?.total || 0, c.status,
      new Date(c.createdAt).toLocaleDateString()
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=innovision_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export.' });
  }
});

export default router;
