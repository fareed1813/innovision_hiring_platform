import Question from '../models/Question.js';

/**
 * Builds a curated set of unified questions for any candidate.
 * It ignores the specific role and generates a generic assessment.
 */
export async function buildQuestionsForRole(role) {
  // Find all active questions regardless of role
  const allQuestions = await Question.find({ active: true }).lean();
  
  const fluencyPassages = allQuestions.filter(q => q.type === 'fluency');
  const essayPrompts = allQuestions.filter(q => q.type === 'essay');
  const grammarPool = allQuestions.filter(q => q.type === 'mcq' && q.qid.startsWith('grammar_'));
  
  // Helper to shuffle
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  let block = [];
  
  // 1. Fluency (Reading Passage for speaking skills) + 2 Reading (Companions)
  if (fluencyPassages.length > 0) {
    const fp = fluencyPassages[Math.floor(Math.random() * fluencyPassages.length)];
    block.push({ id: fp.qid, type: 'fluency', passage: fp.passage, question: fp.question, expectedAnswer: fp.passage });
    const companions = shuffle([...(fp.companions || [])]).slice(0, 2).map((c, i) => ({
      id: `${fp.qid}_comp_${i + 1}`,
      type: 'reading',
      passage: fp.passage,
      question: c.q,
      expectedAnswer: c.a
    }));
    block.push(...companions);
  }

  // 2. Essay + 2 Topic MCQs
  if (essayPrompts.length > 0) {
    const ep = essayPrompts[Math.floor(Math.random() * essayPrompts.length)];
    block.push({
      id: ep.qid,
      type: 'essay',
      passage: ep.passage,
      question: `Write a short essay (minimum 100 words) about: ${ep.passage}`,
      expectedKeywords: ep.seeds || []
    });
    // Pick 2 topic MCQs from this essay
    if (ep.topicMCQs && ep.topicMCQs.length > 0) {
      const tmcqs = shuffle([...ep.topicMCQs]).slice(0, 2).map(m => ({
        id: m.qid,
        type: 'mcq',
        passage: `Theme: ${ep.passage}`,
        question: m.question,
        options: m.options,
        expectedOption: m.expectedOption
      }));
      block.push(...tmcqs);
    }
  }

  // 3. Grammar MCQs
  if (grammarPool.length > 0) {
    const pickedGrammar = shuffle([...grammarPool]).slice(0, 4).map(m => ({
      id: m.qid,
      type: 'mcq',
      passage: '',
      question: m.question,
      options: m.options,
      expectedOption: m.expectedOption
    }));
    block.push(...pickedGrammar);
  }

  return block;
}
