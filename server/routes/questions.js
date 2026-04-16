import { Router } from 'express';
import Question from '../models/Question.js';
import authMiddleware from '../middleware/auth.js';

import { buildQuestionsForRole } from '../utils/questionBuilder.js';

const router = Router();

/* ─── GET /api/questions — Get questions (optionally filtered by role) ── */
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    // If a specific role is provided, return a curated assessment set
    if (role) {
      const questions = await buildQuestionsForRole(role);
      return res.json(questions);
    }
    
    // Otherwise, return all active questions (generic behavior)
    const questions = await Question.find({ active: true }).sort({ role: 1, type: 1 }).lean();
    res.json(questions);
  } catch (err) {
    console.error('Fetch questions error:', err);
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

/* ─── GET /api/questions/roles — Get grouped question counts by role ──── */
router.get('/roles', authMiddleware, async (req, res) => {
  try {
    const pipeline = [
      { $match: { active: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ];
    const result = await Question.aggregate(pipeline);
    res.json(result.map(r => ({ role: r._id, count: r.count })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role counts.' });
  }
});

/* ─── POST /api/questions — Add a question (admin only) ─────────────── */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role, type, passage, question, expectedAnswer, expectedOption, expectedKeywords, options, companions, followUps, seeds } = req.body;
    
    if (!role || !type || !question) {
      return res.status(400).json({ error: 'Role, type, and question text are required.' });
    }
    
    const qid = `${role}_${type}_${Date.now()}`;
    
    const q = new Question({
      qid, role, type, passage, question,
      expectedAnswer, expectedOption, expectedKeywords,
      options, companions, followUps, seeds
    });
    
    await q.save();
    res.status(201).json(q);
  } catch (err) {
    console.error('Add question error:', err);
    res.status(500).json({ error: 'Failed to add question.' });
  }
});

/* ─── PUT /api/questions/:id — Update a question ────────────────────── */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Question not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

/* ─── DELETE /api/questions/:id — Soft delete (deactivate) ──────────── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!q) return res.status(404).json({ error: 'Question not found.' });
    res.json({ message: 'Question deactivated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

export default router;
