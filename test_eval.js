const fs = require('fs');
const vm = require('vm');

const mockEl = {
  value: '',
  classList: { add: ()=>{}, remove: ()=>{} },
  style: {},
  innerHTML: '',
  textContent: '',
  appendChild: ()=>{},
  querySelectorAll: () => ([]),
  addEventListener: () => {}
};

const dom = {
  window: { 
    SpeechRecognition: null, 
    webkitSpeechRecognition: null,
    scrollTo: () => {}
  },
  document: {
    getElementById: () => mockEl,
    querySelectorAll: () => ([mockEl]),
    querySelector: () => mockEl,
    createElement: () => mockEl,
    addEventListener: () => {},
    documentElement: { requestFullscreen: () => {} },
    exitFullscreen: () => {},
    body: { appendChild: ()=>{}, style: {} }
  },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = v; },
    removeItem(k) { delete this.data[k]; }
  }
};

const sandbox = {
  window: dom.window,
  document: dom.document,
  localStorage: dom.localStorage,
  console: console,
  Math: Math,
  Date: Date,
  Set: Set,
  Array: Array,
  setInterval: setInterval,
  clearInterval: clearInterval,
  alert: () => {}
};

vm.createContext(sandbox);

const dataJs = fs.readFileSync('innovision-hiring/js/data.js', 'utf8');
const qbJs = fs.readFileSync('innovision-hiring/js/questionbank.js', 'utf8');
const candJs = fs.readFileSync('innovision-hiring/js/candidate.js', 'utf8');

vm.runInContext(dataJs, sandbox);
vm.runInContext(qbJs, sandbox);
vm.runInContext(candJs, sandbox);

vm.runInContext(`
  function testRole(role, accuracy) {
    console.log("\\n=== TESTING ROLE: " + role + " (" + accuracy + " answers) ===");
    
    // Reset state
    S.job = role;
    S.questions = [];
    S.answers = {};
    S.evaluations = {};
    S.personal = { firstName: 'Tester', lastName: role + accuracy, phone: '00000', email: 'x@x.com', city: 'DXB', passport: 'P1', experience: '1' };
    
    buildQuestions();
    
    S.questions.forEach(q => {
      if (accuracy === 'perfect') {
        if (q.expectedOption) S.answers[q.id] = q.expectedOption;
        else if (q.type === 'fluency') S.answers[q.id] = q.expectedAnswer;
        else if (q.type === 'essay') {
          // generate a perfect essay
          const kw = (q.expectedKeywords || []).join(' ');
          let p = " This is an essay to provide enough volume to get full points on the volume metric, and to test richness by using many many different distinct words perfectly. ";
          S.answers[q.id] = kw + p.repeat(8);
        } else S.answers[q.id] = q.expectedAnswer;
        
      } else if (accuracy === 'bad') {
        S.answers[q.id] = "I don't know";
      }
    });

    const result = scoreAnswers();
    console.log("Calculated Score:", result);
    
    submitAssessment(true);
    const stored = JSON.parse(localStorage.getItem('inv_candidates'));
    const latest = stored[stored.length - 1];
    console.log("Admin Dashboard Validated Score:", latest.scores.total === result.total);
    console.log("Admin Recorded Scores:", latest.scores);
  }

  // Clear local storage
  localStorage.data = {};
  
  testRole('driver', 'perfect');
  testRole('driver', 'bad');
  
  testRole('security', 'perfect');
  testRole('security', 'bad');
  
  testRole('housekeeping', 'perfect');

`, sandbox);
