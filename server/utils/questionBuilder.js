import Question from '../models/Question.js';

/**
 * Builds a curated set of questions based on the candidate's job role.
 * Ensures strict composition rules (e.g., Taxi Driver = exactly 4 questions).
 */
export async function buildQuestionsForRole(role) {
  // Find questions for this specific role OR shared generic questions
  const allQuestions = await Question.find({ 
    role: { $in: [role, '_shared'] }, 
    active: true 
  }).lean();
  
  const fluencyPassages = allQuestions.filter(q => q.type === 'fluency');
  const essayPrompts = allQuestions.filter(q => q.type === 'essay');
  const grammarPool = allQuestions.filter(q => q.type === 'mcq' && q.qid.startsWith('grammar_'));
  
  // Helper to shuffle
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  if (role === 'driver') {
    // Taxi Driver: 1 Fluency + 3 Reading (shuffled from 5 companions)
    if (fluencyPassages.length === 0) return [];
    const fp = fluencyPassages[Math.floor(Math.random() * fluencyPassages.length)];
    const companions = shuffle([...(fp.companions || [])]).slice(0, 3).map((c, i) => ({
      id: `${fp.qid}_comp_${i + 1}`,
      type: 'reading',
      passage: fp.passage,
      question: c.q,
      expectedAnswer: c.a
    }));
    return [
      { id: fp.qid, type: 'fluency', passage: fp.passage, question: fp.question, expectedAnswer: fp.passage },
      ...companions
    ];
  }

  if (role === 'security') {
    // Security: 1 Fluency + 2 Reading + 1 Essay + 2 Topic MCQs + 4 Grammar MCQs (Total 10)
    let block = [];
    
    // 1. Fluency + 2 Reading
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

    // 3. 4 Grammar MCQs
    const pickedGrammar = shuffle([...grammarPool]).slice(0, 4).map(m => ({
      id: m.qid,
      type: 'mcq',
      passage: '',
      question: m.question,
      options: m.options,
      expectedOption: m.expectedOption
    }));
    block.push(...pickedGrammar);

    return block;
  }

  // Fallback for other roles (e.g., helper, cleaner)
  if (essayPrompts.length === 0) return [];
  const ep = essayPrompts[Math.floor(Math.random() * essayPrompts.length)];
  return [
    { id: ep.qid, type: 'essay', passage: ep.passage, question: `Write an essay about: ${ep.passage}`, expectedKeywords: ep.seeds || [] },
    ...shuffle([...grammarPool]).slice(0, 4).map(m => ({ id: m.qid, type: 'mcq', question: m.question, options: m.options, expectedOption: m.expectedOption }))
  ];
}
