import { evaluateAnswer } from './utils/scoring.js';

const testCases = [
  {
    name: 'Fluency with shortcuts (gng/grom)',
    q: { type: 'fluency', passage: 'I am going from the city.' },
    ans: 'I am gng grom the city.',
    expectedMatch: true
  },
  {
    name: 'Reading Comp with semantic overlap',
    q: { type: 'reading', expectedAnswer: 'The car is fast and red.' },
    ans: 'red fast car',
    expectedMatch: true
  },
  {
      name: 'Essay with unique token check',
      q: { type: 'essay', expectedKeywords: ['Japan', 'Tokyo', 'industry'] },
      ans: 'Japan is a country with Tokyo as its capital. The industry is very big. Industry industry industry.',
      expectedMatch: true
  }
];

testCases.forEach(tc => {
  const result = evaluateAnswer(tc.q, tc.ans);
  console.log(`Test: ${tc.name}`);
  console.log(`Score: ${Math.round(result.score * 100)}%`);
  console.log(`Details: ${result.details}`);
  console.log('---');
});
