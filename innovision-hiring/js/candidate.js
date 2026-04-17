/**
 * candidate.js — Candidate Portal Logic
 * Innovision Overseas UAE Hiring Platform v1.0.0
 */

'use strict';

/* ── CANDIDATE SESSION STATE ─────────────────────── */
const S = {
  source:    'Direct',
  job:       '',
  personal:  {},
  questions: [],
  answers:   {},
  scores:    {},
  evaluations: {},
  refId:     '',
  fluencyResets: {},
  currentIdx: 0,        // Track current question in paginated view
  reviewSet:  new Set(), // Track question IDs marked for review
  proctoring: {
    tabSwitches: 0,
    fullscreenExits: 0,
    lastViolationTime: 0
  }
};

/* ── RECORDING STATE & STREAMS ───────────────────── */
const recs = {};
let mediaRecs = {};
let globalAudioStream = null;
let timerInterval = null;

function norm(str) {
  return (str || '').toString().toLowerCase().replace(/[.,]/g, '').trim();
}

function phoneDigitsOnly(str) {
  return (str || '').toString().replace(/[^0-9]/g, '');
}

function escapeHtml(unsafe) {
  return (unsafe || '').toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function samePersonDetails(a, b) {
  // Compare core identity + profile fields (case-insensitive for text fields).
  return (
    norm(a.firstName)  === norm(b.firstName) &&
    norm(a.lastName)   === norm(b.lastName) &&
    phoneDigitsOnly(a.phone) === phoneDigitsOnly(b.phone) &&
    norm(a.email)      === norm(b.email) &&
    norm(a.city)       === norm(b.city) &&
    norm(a.experience) === norm(b.experience) &&
    norm(a.passport)   === norm(b.passport) &&
    norm(a.education)  === norm(b.education) &&
    norm(a.languages)  === norm(b.languages) &&
    norm(a.gulfExp)    === norm(b.gulfExp)
  );
}

/* ── SOURCE SELECTION ────────────────────────────── */
function selectSource(src, el) {
  S.source = src;
  document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

/* ── STEP 1: VALIDATE PERSONAL DETAILS ──────────── */
function validateStep1() {
  const fname    = document.getElementById('fname').value.trim();
  const lname    = document.getElementById('lname').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const city     = document.getElementById('city').value.trim();
  const passport = document.getElementById('passport').value;
  const langsRaw = document.getElementById('langs').value.trim();
  const emailRaw = document.getElementById('email').value.trim();

  // Alphabets-only validation (allow spaces).
  // If you want commas for languages later, we can extend this rule.
  const alphaSpaceRe = /^[A-Za-z ]+$/;
  if (!alphaSpaceRe.test(fname) || !alphaSpaceRe.test(lname)) {
    showToast('First name and last name must contain alphabets only.', 'danger');
    return;
  }
  // Languages allow alphabets + commas (e.g. "Hindi, English").
  // - letters/spaces only inside each language token
  // - commas act only as separators
  // - no empty tokens, no trailing comma
  const alphaCommaSpaceRe = /^[A-Za-z]+(?: [A-Za-z]+)*(?:,\s*[A-Za-z]+(?: [A-Za-z]+)*)*$/;
  if (langsRaw && !alphaCommaSpaceRe.test(langsRaw)) {
    showToast('Languages must contain alphabets and commas only (e.g., Hindi, English).', 'danger');
    return;
  }

  if (!fname || !lname || !phone || !city || !passport) {
    showToast('Please fill all required fields (*).', 'danger');
    return;
  }
  // Phone: allow only digits, + and - (e.g. +91-9876543210).
  const phoneAllowedRe = /^[0-9+-]+$/;
  if (!phoneAllowedRe.test(phone)) {
    showToast('Mobile number can contain only numbers, "+" and "-".', 'danger');
    return;
  }
  // Require minimum digits (ignore + and - for this check).
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  if (phoneDigits.length < 8) {
    showToast('Please enter a valid mobile number.', 'danger');
    return;
  }

  if (emailRaw && !emailRaw.includes('@')) {
    showToast('Invalid email.', 'danger');
    return;
  }

  // City / State: letters, spaces, commas, and periods only (no digits or symbols).
  const cityAllowedRe = /^[A-Za-z., ]+$/;
  if (!cityAllowedRe.test(city)) {
    showToast('City / State may only contain letters, commas, and periods.', 'danger');
    return;
  }

  const candidatePersonal = {
    firstName:  fname,
    lastName:   lname,
    phone:      phone,
    email:      emailRaw,
    city:       city,
    experience: document.getElementById('exp').value || '0',
    passport:   passport,
    education:  document.getElementById('education').value,
    languages:  langsRaw || 'Not specified',
    gulfExp:    document.getElementById('gulf_exp').value || 'Not specified'
  };

  // Prevent duplicate users by First Name + Last Name as requested
  const existing = loadAdminData();
  
  const fNameNorm = (fname || '').trim().toLowerCase();
  const lNameNorm = (lname || '').trim().toLowerCase();
  
  const hasExactSameUser = existing.some(r => 
      (r.firstName || '').trim().toLowerCase() === fNameNorm &&
      (r.lastName || '').trim().toLowerCase() === lNameNorm
  );

  if (hasExactSameUser) {
      showToast('A user already exists with this First Name and Last Name.', 'danger');
      return;
  }

  S.personal = candidatePersonal;
  goStep(2);
}

/* ── STEP 2: JOB SELECTION ───────────────────────── */
function selectJob(key) {
  S.job = key;
  document.querySelectorAll('.job-card').forEach(c => c.classList.remove('selected'));
  const el = document.getElementById('job-' + key);
  if (el) el.classList.add('selected');
}

function validateStep2() {
  if (!S.job) {
    showToast('Please select a deployment role.', 'danger');
    return;
  }
  buildQuestions();
  goStep(3);
}

/* ── STEP 3: BUILD QUESTIONS ─────────────────────── */
function buildQuestions() {
  const allQs = QB[S.job] || [];
  
  // Deduplicate questions by text to avoid asking the same question twice
  const uniqueQs = [];
  const seen = new Set();
  for (let q of allQs) {
    const qt = (q.question || '').toLowerCase().trim();
    if (!seen.has(qt)) {
      seen.add(qt);
      uniqueQs.push(q);
    }
  }

  // Filter based on specific role requirements
  let selected = [];
  if (S.job === 'driver') {
    // Driver: [1 Fluency + 3 Companion Reading] = 4 Total
    selected = [];
  } else if (S.job === 'security') {
    // Security: [1 Fluency + 3 Companion Reading] + 1 Essay + 15 Comprehension = 20 Total
    const pool = uniqueQs.filter(q => q.type === 'comprehension');
    selected = pool.sort(() => Math.random() - 0.5).slice(0, 15);
  } else {
    // Default roles: 5 random questions (exclude fluency/essay)
    const pool = uniqueQs.filter(q => q.type !== 'fluency' && !q.id.startsWith('fluency_companion') && q.type !== 'essay');
    selected = pool.sort(() => Math.random() - 0.5).slice(0, 5);
  }

  // Compose final question list:
  // Driver: [Fluency Read-aloud, Reading×3 from same passage] (Total 4)
  // Security: [Fluency Read-aloud, Reading×3 from same passage, Essay block, QB pool questions]
  // Other roles: [Essay, QB pool questions]
  if (S.job === 'driver') {
    const fluencyBlock = getRandomFluencyQs(); // [fluency, reading, reading, reading]
    S.questions = [...fluencyBlock];
  } else if (S.job === 'security') {
    const fluencyBlock = getRandomFluencyQs(); // [fluency, reading, reading, reading]
    const essayBlock = getRandomEssayBlock();
    S.questions = [...fluencyBlock, ...essayBlock, ...selected];
  } else {
    S.questions = [getRandomEssay(), ...selected];
  }

  S.answers   = {};
  S.evaluations = {};
  S.currentIdx  = 0;
  S.reviewSet   = new Set();

  const roleInfo = ROLES[S.job];
  // Note: q-role-title was removed for cleaner UI


  if (!S.questions.length) {
    document.getElementById('q-container').innerHTML =
      '<p style="color:var(--muted);padding:20px;text-align:center;">No questions configured for this role yet.</p>';
    return;
  }

  // Pre-warm the microphone stream to eliminate activation latency later
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => { globalAudioStream = stream; })
      .catch(err => { console.warn("Mic pre-warming denied or failed:", err); });
  }

  renderQuestion(0);
  startAssessmentTimer();
}

/* ── PERSISTENT TIMER LOGIC (45 MINS) ──────────────── */
function startAssessmentTimer() {
  if (timerInterval) clearInterval(timerInterval);

  const DURATION = 45 * 60; // 45 minutes in seconds
  let startTime = localStorage.getItem('innovision_timer_start');
  
  if (!startTime) {
    startTime = Date.now();
    localStorage.setItem('innovision_timer_start', startTime);
  } else {
    startTime = parseInt(startTime, 10);
  }

  const clockEl = document.getElementById('test-timer-clock');

  function tick() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = DURATION - elapsed;

    if (remaining <= 0) {
      if (clockEl) clockEl.textContent = '00:00';
      clearInterval(timerInterval);
      alert("Time is up! Your assessment will be submitted automatically.");
      submitAssessment(true); // Force submit even if incomplete
      return;
    }

    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    if (clockEl) {
      clockEl.textContent = timeStr;
      // Warning state at last 5 mins
      if (remaining <= 300) clockEl.classList.add('warning');
      else clockEl.classList.remove('warning');
    }
  }

  tick();
  timerInterval = setInterval(tick, 1000);
}

/* ── PROCTORING & FULLSCREEN LOGIC ────────────────── */
function enterAssessmentFullscreen() {
  const el = document.documentElement;
  const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (requestFS) {
    requestFS.call(el).catch(err => {
      console.warn("Fullscreen request denied:", err);
    });
  }
}

function exitAssessmentFullscreen() {
  const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (exitFS && document.fullscreenElement) {
    exitFS.call(document).catch(() => {});
  }
}

// Global Proctoring Listeners
function initProctoring() {
  const handleViolation = (type) => {
    // Only track violations during step 3 (Assessment)
    if (window.currentStep !== 3) return;
    
    // Throttle violations (max 1 per 2 seconds) to avoid spam
    const now = Date.now();
    if (now - S.proctoring.lastViolationTime < 2000) return;
    S.proctoring.lastViolationTime = now;

    if (type === 'tab') S.proctoring.tabSwitches++;
    if (type === 'fs') S.proctoring.fullscreenExits++;

    showToast(`⚠ Integrity Alert: ${type === 'tab' ? 'Tab switch' : 'Fullscreen exit'} detected. Please stay on this page.`, 'danger');
    
    // If they exited fullscreen, try to prompt them back (optional, let's just toast for now)
    console.warn(`Proctoring Violation [${type}]:`, S.proctoring);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handleViolation('tab');
  });

  window.addEventListener('blur', () => {
    handleViolation('tab');
  });

  const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  fsEvents.forEach(evt => {
    document.addEventListener(evt, () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        handleViolation('fs');
      }
    });
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initProctoring);

/* ── RENDER SPECIFIC QUESTION (Pagination) ────────── */
function renderQuestion(idx) {
  S.currentIdx = idx;
  const q = S.questions[idx];
  const container = document.getElementById('q-container');
  container.innerHTML = '';

  const isMcq = Array.isArray(q.options) && q.options.length > 0;
  const isFluency = q.type === 'fluency';

  // Build the Question Card HTML
  let writtenHtml;
  if (isFluency) {
    writtenHtml = `
      <div class="fluency-instruction">
        <span class="fluency-icon">🎙️</span>
        <span>Tap the microphone and <strong>read the passage aloud</strong> clearly.</span>
      </div>
      <div class="fluency-mic-area">
        <button class="mic-btn-lg ${recs[q.id] ? 'recording' : ''}" id="mic-${q.id}" onclick="toggleVoice('${q.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
        <span class="fluency-mic-label" id="mic-label-${q.id}">${recs[q.id] ? 'Listening...' : 'Tap to start'}</span>
      </div>
      <div class="form-group">
        <label class="form-label">Your Speech Transcript</label>
        <textarea class="text-answer fluency-readonly" id="ans-${q.id}" readonly
          placeholder="Words will appear here...">${S.answers[q.id] || ''}</textarea>
        <div class="fluency-reset-row">
          <button class="fluency-reset-btn" onclick="resetFluencyAnswer('${q.id}')">↻ Reset Answer</button>
          <span class="fluency-reset-remaining">${1 - (S.fluencyResets[q.id] || 0)} resets remaining</span>
        </div>
      </div>
    `;
  } else if (isMcq) {
    writtenHtml = `
      <div class="form-group">
        <label class="form-label">Choose the correct option</label>
        <div class="mcq-options">
          ${q.options.map(opt => `
            <label class="mcq-option">
              <input type="radio" name="opt-${q.id}" value="${opt.key}"
                ${S.answers[q.id] === opt.key ? 'checked' : ''}
                onchange="saveAns('${q.id}', this.value)" />
              <span class="mcq-key">${opt.key}.</span>
              <span class="mcq-text">${opt.text}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    // Standard text or essay
    const placeholder = q.type === 'essay' ? 'Start typing your essay here...' : 'Type your answer or use the mic...';
    writtenHtml = `
      <div class="form-group">
        <label class="form-label">${q.type === 'essay' ? 'Your Essay Answer' : 'Your Answer'}</label>
        <div class="answer-wrapper">
          <textarea class="text-answer" id="ans-${q.id}" 
            style="${q.type === 'essay' ? 'min-height:220px;' : 'min-height:120px;'}"
            placeholder="${placeholder}"
            oninput="saveAns('${q.id}', this.value)">${S.answers[q.id] || ''}</textarea>
          <button class="mic-btn" id="mic-${q.id}" onclick="toggleVoice('${q.id}')">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  const card = document.createElement('div');
  card.className = 'q-card ' + (isFluency ? 'fluency-card' : '');
  card.innerHTML = `
    <div class="q-meta">
      <span class="q-num">Question ${idx + 1} of ${S.questions.length}</span>
      <span class="q-badge ${BADGE_MAP[q.type]}">${BADGE_LBL[q.type]}</span>
    </div>
    ${q.passage ? `<div class="q-passage ${q.type === 'essay' ? 'essay-topic' : ''}">${q.passage}</div>` : ''}
    <div class="q-text">${q.question}</div>
    ${writtenHtml}
  `;
  container.appendChild(card);

  updateNavGrid();
  updateNavButtons();
}

function saveAns(qid, val) {
  S.answers[qid] = val;
  updateNavGrid();
}

/* ── NAVIGATION HELPERS ──────────────────────────── */
function updateNavGrid() {
  const grid = document.getElementById('q-nav-grid');
  if (!grid) return;
  grid.innerHTML = '';

  let countTodo = 0;
  let countDone = 0;
  let countReview = 0;

  S.questions.forEach((q, i) => {
    const btn = document.createElement('div');
    btn.className = 'q-ind';
    if (i === S.currentIdx) btn.classList.add('active');
    
    const ans = (S.answers[q.id] || '').toString().trim();
    const isDone = ans.length > 0;
    const isReview = S.reviewSet.has(q.id);

    if (isDone) {
      btn.classList.add('attempted');
      countDone++;
    } else {
      countTodo++;
    }
    
    if (isReview) {
      btn.classList.add('review');
      countReview++;
    }

    btn.textContent = i + 1;
    btn.onclick = () => renderQuestion(i);
    grid.appendChild(btn);
  });

  // Update Legend Counts
  const elTodo = document.getElementById('count-todo');
  const elDone = document.getElementById('count-done');
  const elReview = document.getElementById('count-review');
  if (elTodo) elTodo.textContent = countTodo;
  if (elDone) elDone.textContent = countDone;
  if (elReview) elReview.textContent = countReview;
}

function updateNavButtons() {
  const prevBtn = document.getElementById('btn-prev-q');
  const nextBtn = document.getElementById('btn-next-q');
  const reviewBtn = document.getElementById('btn-review-q');
  const curQ = S.questions[S.currentIdx];

  if (prevBtn) prevBtn.disabled = (S.currentIdx === 0);
  if (nextBtn) {
    if (S.currentIdx === S.questions.length - 1) {
      nextBtn.textContent = 'Finish & Review →';
      nextBtn.onclick = showSummary;
    } else {
      nextBtn.textContent = 'Next Question →';
      nextBtn.onclick = nextQuestion;
    }
  }

  if (reviewBtn) {
    const isReview = S.reviewSet.has(curQ.id);
    reviewBtn.innerHTML = isReview ? '★ Unmark Review' : '☆ Mark for Review';
    reviewBtn.style.background = isReview ? 'var(--primary)' : 'transparent';
    reviewBtn.style.color = isReview ? '#fff' : 'var(--muted)';
    reviewBtn.style.borderColor = isReview ? 'var(--primary)' : 'var(--border2)';
  }
}

function nextQuestion() {
  if (S.currentIdx < S.questions.length - 1) {
    renderQuestion(S.currentIdx + 1);
  }
}

function prevQuestion() {
  if (S.currentIdx > 0) {
    renderQuestion(S.currentIdx - 1);
  }
}

function toggleMarkForReview() {
  const qid = S.questions[S.currentIdx].id;
  if (S.reviewSet.has(qid)) S.reviewSet.delete(qid);
  else S.reviewSet.add(qid);
  updateNavGrid();
  updateNavButtons();
}

/* ── ASSESSMENT SUMMARY ──────────────────────────── */
function showSummary() {
  let done = 0;
  S.questions.forEach(q => {
    // Normalization check for 'Attempted' status
    if ((S.answers[q.id] || '').toString().trim().length > 0) done++;
  });

  const total = S.questions.length;
  const reviewCount = S.reviewSet.size;
  const missed = total - done;

  document.getElementById('sum-total').textContent = total;
  document.getElementById('sum-done').textContent = done;
  document.getElementById('sum-review').textContent = reviewCount;
  document.getElementById('sum-missed').textContent = missed;

  const msg = document.getElementById('summary-msg');
  if (missed > 0) {
    msg.innerHTML = `⚠️ You have <strong>${missed}</strong> unanswered questions. We recommend completing them before submitting.`;
    msg.style.background = 'var(--pill-red-bg)';
    msg.style.color = 'var(--pill-red-text)';
  } else {
    msg.textContent = '✅ All questions answered. Ready to submit?';
    msg.style.background = 'var(--blue-dim)';
    msg.style.color = 'var(--blue)';
  }

  // Toggle view inside Step 3 instead of jumping to 3.5
  const layout = document.querySelector('.assessment-layout');
  const summaryView = document.getElementById('q-summary-view');
  const navFooter = document.querySelector('#step-3 .step-footer');

  if (layout) layout.classList.add('hidden');
  if (navFooter) navFooter.classList.add('hidden');
  if (summaryView) summaryView.classList.remove('hidden');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideSummary() {
  const layout = document.querySelector('.assessment-layout');
  const summaryView = document.getElementById('q-summary-view');
  const navFooter = document.querySelector('#step-3 .step-footer');

  if (layout) layout.classList.remove('hidden');
  if (navFooter) navFooter.classList.remove('hidden');
  if (summaryView) summaryView.classList.add('hidden');
}

/** 
 * Extension of goStep to handle named steps like 'summary'
 */
const originalGoStep = window.goStep || function(n){};
function goStep(target) {
  document.querySelectorAll('.step-wrap').forEach(s => s.classList.add('hidden'));
  
  if (target === 'summary') {
    document.getElementById('step-summary').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  // Standard integer steps
  const el = document.getElementById('step-' + target);
  if (el) {
    el.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Global tracking
    window.currentStep = target;
  }
}


/* ── VOICE-TO-ANSWER (inline mic) ────────────────── */
function toggleVoice(qid) {
  // Support both mic-btn (small) and mic-btn-lg (fluency)
  const btn = document.getElementById('mic-' + qid);
  const ta  = document.getElementById('ans-' + qid);
  const micLabel = document.getElementById('mic-label-' + qid);

  const hasSpeech =
    ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);

  // ── Fallback demo mode (no Speech API) ──
  if (!hasSpeech) {
    if (btn.classList.contains('recording')) {
      btn.classList.remove('recording');
      if (micLabel) micLabel.textContent = 'Tap to start';
    } else {
      btn.classList.add('recording');
      if (micLabel) micLabel.textContent = 'Listening…';
      const demos = [
        'I would immediately stop and report the defect to my supervisor before moving the vehicle.',
        'I will pull over safely, switch on hazard lights, apply parking brake and call my supervisor.',
        'I would politely decline and explain UAE traffic law to the client, then take the approved route.',
        'I would document all findings and escalate to Innovision management with a full root cause report.',
        'I would calmly separate the individuals, ensure safety, and notify security control immediately.'
      ];
      const idx = S.questions.findIndex(q => q.id === qid);
      setTimeout(() => {
        const t = demos[idx % demos.length] || 'Voice response recorded.';
        if (ta) {
          ta.value = (ta.value ? ta.value + ' ' : '') + t;
          S.answers[qid] = ta.value;
          ta.classList.add('has-content');
        }
        btn.classList.remove('recording');
        if (micLabel) micLabel.textContent = 'Tap to start';
      }, 2500);
    }
    return;
  }

  // ── Stop existing recording ──
  if (recs[qid] || mediaRecs[qid]) {
    if (recs[qid]) {
      recs[qid]._userStopped = true;
      try { recs[qid].stop(); } catch(e){}
      delete recs[qid];
    }
    if (mediaRecs[qid]) {
      try { mediaRecs[qid].stop(); } catch(e){}
      delete mediaRecs[qid];
    }
    btn.classList.remove('recording');
    if (micLabel) micLabel.textContent = 'Tap to start';
    return;
  }

  // ── Start Audio Recording (MediaRecorder) ──
  if (globalAudioStream) {
    try {
      const mr = new MediaRecorder(globalAudioStream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 16000 });
      const chunks = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          S.answers[qid + '_audio'] = reader.result;
        };
      };
      mr.start();
      mediaRecs[qid] = mr;
    } catch(err) {
      console.warn("MediaRecorder start failed", err);
    }
  }

  // ── Start real speech recognition ──
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new SpeechRecognition();
  r.continuous     = true;
  r.lang           = 'en-IN'; // Changed from en-US for better recognition
  r.maxAlternatives = 5;      
  r._userStopped   = false;
  r._isReset       = false;

  const baseText = (ta ? ta.value : '');
  let accumulated = '';

  r.onresult = e => {
    if (r._isReset) return;

    let fin = '', inter = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      let bestAlt = e.results[i][0];
      // Pick best alt based on confidence
      for (let a = 1; a < e.results[i].length; a++) {
        if (e.results[i][a].confidence > bestAlt.confidence) {
          bestAlt = e.results[i][a];
        }
      }
      if (e.results[i].isFinal) fin   += bestAlt.transcript;
      else                       inter += bestAlt.transcript;
    }
    if (fin) accumulated += fin;
    if (ta && !r._isReset) {
      const sep = baseText && !baseText.endsWith(' ') ? ' ' : '';
      ta.value = baseText + sep + accumulated + inter;
      S.answers[qid] = ta.value;
      if (ta.value.trim()) ta.classList.add('has-content');
      else ta.classList.remove('has-content');
    }
  };

  r.onerror = (ev) => {
    if (ev.error === 'no-speech') return;
    btn.classList.remove('recording');
    if (micLabel) micLabel.textContent = 'Tap to start';
    if (mediaRecs[qid]) { mediaRecs[qid].stop(); delete mediaRecs[qid]; }
  };

  r.onstart = () => {
    btn.classList.add('recording');
    if (micLabel) micLabel.textContent = 'Listening… (tap again to stop)';
  };

  r.onend = () => {
    if (r._isReset) return;
    
    if (ta) {
      const sep = baseText && !baseText.endsWith(' ') ? ' ' : '';
      ta.value = baseText + sep + accumulated;
      S.answers[qid] = ta.value;
      if (ta.value.trim()) ta.classList.add('has-content');
      else ta.classList.remove('has-content');
    }
    
    btn.classList.remove('recording');
    if (micLabel) micLabel.textContent = 'Tap to start';
    delete recs[qid];
    if (mediaRecs[qid] && mediaRecs[qid].state !== 'inactive') {
      mediaRecs[qid].stop();
      delete mediaRecs[qid];
    }
  };

  try {
    r.start();
    recs[qid] = r;
    if (micLabel) micLabel.textContent = 'Starting microphone...';
  } catch (err) {
    if (micLabel) micLabel.textContent = 'Tap to start';
    if (mediaRecs[qid]) { mediaRecs[qid].stop(); delete mediaRecs[qid]; }
  }
}

/* ── FLUENCY RESET ────────────────────────────── */
function resetFluencyAnswer(qid) {
  const used = S.fluencyResets[qid] || 0;
  if (used >= 1) {
    showToast('You have already used your reset for this question.', 'danger');
    return;
  }

  // Stop any active recording first
  if (recs[qid] || mediaRecs[qid]) {
    if (recs[qid]) {
      recs[qid]._isReset = true; // Set flag to ignore pending events
      recs[qid]._userStopped = true;
      try { recs[qid].stop(); } catch(e){}
      delete recs[qid];
    }
    if (mediaRecs[qid]) {
      try { mediaRecs[qid].stop(); } catch(e){}
      delete mediaRecs[qid];
    }
  }

  const ta  = document.getElementById('ans-' + qid);
  const btn = document.getElementById('mic-' + qid);
  const micLabel = document.getElementById('mic-label-' + qid);
  const resetBtn = document.getElementById('reset-' + qid);
  const countEl  = document.getElementById('reset-count-' + qid);

  // Clear the answer and audio
  if (ta) {
    ta.value = '';
    ta.classList.remove('has-content');
  }
  S.answers[qid] = '';
  delete S.answers[qid + '_audio'];

  if (btn) btn.classList.remove('recording');
  if (micLabel) micLabel.textContent = 'Tap to start';

  // Update reset counter
  S.fluencyResets[qid] = used + 1;
  if (countEl) countEl.textContent = '0 resets remaining';
  if (resetBtn) {
    resetBtn.disabled = true;
    resetBtn.classList.add('disabled');
  }
}

/* ── SUBMIT ASSESSMENT ───────────────────────────── */
function submitAssessment(isForced = false) {
  // Check minimum answers
  if (!isForced) {
    let answered = 0;
    S.questions.forEach(q => {
      if ((S.answers[q.id] || '').trim()) answered++;
    });
    if (answered < Math.ceil(S.questions.length / 2)) {
      showToast('Please answer at least half the questions before submitting.', 'danger');
      return;
    }
  }

  // Calculate scores using multi-factor advanced logic
  const result = scoreAnswers();

  S.scores = {
    total: result.score,
    score: result.score,
    reading: result.reading,
    voice: result.voice,
    quality: result.quality
  };
  
  S.refId  = 'INV' + Date.now().toString().slice(-7);

  // Save to admin data
  const record = {
    id:        S.refId,
    ...S.personal,
    job:       S.job,
    source:    S.source,
    scores:    S.scores,
    proctoring: { ...S.proctoring },
    evaluations: { ...S.evaluations },
    questions: S.questions,
    answers:   { ...S.answers },
    status:    'pending',
    timestamp: new Date().toISOString()
  };

  let data = loadAdminData();
  data.push(record);
  saveAdminData(data);

  showResult(result);
  S.submitted = true;
  
  // Cleanup timer
  if (timerInterval) clearInterval(timerInterval);
  localStorage.removeItem('innovision_timer_start');

  goStep(4);
  exitAssessmentFullscreen();
}

/* ── FULLSCREEN DURING ASSESSMENT ─────────────── */
function enterAssessmentFullscreen() {
  // Hide the top nav bar
  const nav = document.querySelector('nav');
  if (nav) nav.classList.add('hidden');

  // Request browser fullscreen
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch (e) { /* some browsers block without user gesture */ }
}

function exitAssessmentFullscreen() {
  // Show the nav bar again
  const nav = document.querySelector('nav');
  if (nav) nav.classList.remove('hidden');

  // Exit browser fullscreen safely
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(e => console.warn("Fullscreen exit warning:", e));
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msFullscreenElement && document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } catch (e) { /* ignore */ }
}

/* ── SCORING ALGORITHM (unified answer) ──────────── */
function allQuestionsHaveExpected() {
  return (
    S.questions.length > 0 &&
    S.questions.some(q => (q.expectedAnswer || '').toString().trim().length > 0 || q.expectedOption)
  );
}

function scoreAnswers() {
  if (!allQuestionsHaveExpected()) {
    // Fallback heuristic scoring for roles without expected answers.
    let s = 50;
    S.questions.forEach(q => {
      const a = (S.answers[q.id] || '').trim();
      if (a.length > 15)  s += 10;
      if (a.length > 70)  s += 8;
      if (a.length > 150) s += 5;
    });
    s = Math.min(100, s);
    return { score: s, total: s, reading: s, voice: s, quality: s };
  }

  let totalR = 0, countR = 0; // Reading comprehension (MCQ)
  let totalV = 0, countV = 0; // Voice Clarity (Fluency)
  let totalQ = 0, countQ = 0; // Response Quality (Open text)
  let totalScore = 0;

  S.questions.forEach(q => {
    const candidate = (S.answers[q.id] || '').toString();
    const res = evaluateCandidateForQuestion(q, candidate);
    
    S.evaluations[q.id] = { matched: res.matched, score: res.score };
    totalScore += res.score;
    
    if (q.type === 'fluency') {
      totalV += res.score;
      countV++;
    } else if (q.type === 'reading' || q.type === 'comprehension') {
      totalR += res.score;
      countR++;
    } else {
      totalQ += res.score;
      countQ++;
    }
  });

  const avgScore = Math.round((totalScore / Math.max(S.questions.length, 1)) * 100);
  
  // If count is 0, default to avgScore so UI doesn't break
  const r = countR > 0 ? Math.round((totalR / countR) * 100) : avgScore;
  const v = countV > 0 ? Math.round((totalV / countV) * 100) : avgScore;
  const q = countQ > 0 ? Math.round((totalQ / countQ) * 100) : avgScore;

  return {
    score: avgScore,
    total: avgScore,
    reading: r,
    voice: v,
    quality: q
  };
}

// Advanced Text Evaluation (Sørensen-Dice + Token Overlap)
function getBigrams(str) {
  const bigrams = new Set();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

function calculateDiceCoefficient(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  const bg1 = getBigrams(str1);
  const bg2 = getBigrams(str2);
  if (bg1.size === 0 || bg2.size === 0) return 0;
  let intersection = 0;
  for (let bg of bg1) {
    if (bg2.has(bg)) intersection++;
  }
  return (2.0 * intersection) / (bg1.size + bg2.size);
}

/**
 * Lenient Answer Evaluation (Token overlap + Dice + Optional Critical Keywords)
 */
function evaluateAnswerLenient(candidate, expected, qType = 'reading') {
  const cNorm = normalizeText(candidate);
  const eNorm = normalizeText(expected);

  if (!cNorm || !eNorm) return { matched: false, score: 0 };

  // 1. Direct Substring Match
  if (cNorm.includes(eNorm) || eNorm.includes(cNorm)) {
    return { matched: true, score: 1 };
  }

  // 2. Semantic Token Overlap
  const candTokens = tokenizeForScoring(cNorm);
  const expTokens  = tokenizeForScoring(eNorm);
  
  if (!expTokens.length) return { matched: false, score: 0 };

  let tokenScoreParts = 0;
  let totalWeight = 0;

  // Situational weights: certain keywords are worth more if present
  const criticalTerms = ['report', 'supervisor', 'immediately', 'sira', 'rta', 'safety', 'stop', 'policy', 'inform', 'notify'];

  expTokens.forEach(et => {
    const etStem = stemWord(et);
    const etSyns = getSynonyms(et);
    
    // TF-IDF proxy: longer words + critical situational terms weighted heavily
    let weight = Math.max(1, et.length > 5 ? et.length * 1.5 : et.length - 1);
    if (qType === 'situational' && criticalTerms.includes(etStem)) {
      weight *= 2.5; // Critical actions in situational tests are heavily prioritized
    }
    
    totalWeight += weight;

    let bestFuzzyMatch = 0;
    candTokens.forEach(ct => {
      const ctStem = stemWord(ct);
      
      if (ct === et || ctStem === etStem) {
        bestFuzzyMatch = 1;
      } 
      else if (etSyns.includes(ct) || etSyns.includes(ctStem)) {
        bestFuzzyMatch = 1;
      }
      else {
        const dist = levenshteinDistance(ct, et);
        const maxDist = et.length > 6 ? 2 : 1; 
        if (dist <= maxDist) {
          const s = 1 - (dist / Math.max(et.length, ct.length));
          if (s > bestFuzzyMatch) bestFuzzyMatch = s;
        }
      }
    });
    tokenScoreParts += (bestFuzzyMatch * weight);
  });

  const tokenScore = tokenScoreParts / totalWeight;

  // 3. Sørensen-Dice Coefficient
  const diceScore = calculateDiceCoefficient(cNorm, eNorm);

  // Combine Scores (weighted: 85% Token-Semantic, 15% Dice)
  let finalScore = (tokenScore * 0.85) + (diceScore * 0.15);
  
  // Adaptive matching threshold
  if (tokenScore >= 0.85) finalScore = 1.0;
  if (finalScore > 0.8) finalScore = 1.0;
  
  const threshold = (qType === 'situational') ? 0.35 : (expTokens.length < 3 ? 0.65 : 0.40);
  const matched = finalScore >= threshold;

  return { matched, score: Math.max(0, Math.min(1, finalScore)) };
}

/**
 * Basic Suffix Stemmer (Porter-lite)
 */
function stemWord(w) {
  if (w.length <= 3) return w;
  return w.toLowerCase()
    .replace(/(?:ing|ion|ation|ed|es|s|ly|ment|al|ity|ive|ize|ous|able|ible|ness|full?|ship)$/, '')
    .replace(/([^aeiou])\1$/, '$1'); // trim double consonants at end
}

/**
 * Domain-specific Synonym Map for Assessment
 */
function getSynonyms(w) {
  const map = {
    'agriculture': ['farming', 'crops', 'cultivation'],
    'farming':     ['agriculture', 'crops', 'cultivation'],
    'transport':   ['transportation', 'shuttle', 'logistics', 'travel', 'bus', 'taxi'],
    'transportation': ['transport', 'shuttle', 'logistics', 'travel', 'bus', 'taxi'],
    'rich':        ['fertile', 'productive', 'good'],
    'fertile':     ['rich', 'productive', 'good'],
    'industry':    ['manufacturing', 'production', 'factories', 'business', 'sector'],
    'manufacturing': ['industry', 'production', 'factories', 'business'],
    'provide':     ['supply', 'give', 'offer', 'support', 'ensure', 'maintain'],
    'provides':    ['supplies', 'gives', 'offers', 'supports', 'ensures', 'maintains'],
    'sent':        ['shipped', 'exported', 'delivered', 'sold'],
    'exported':    ['sent', 'shipped', 'delivered', 'sold', 'sale'],
    'sale':        ['sold', 'sent', 'exported'],
    'big':         ['large', 'huge', 'great', 'size', 'major'],
    'small':       ['little', 'tiny', 'minor'],
    'people':      ['citizens', 'residents', 'population', 'millions', 'person', 'passengers', 'guests', 'customers'],
    'important':   ['vital', 'essential', 'key', 'lifeblood', 'famous', 'critical', 'mandatory', 'required'],
    'famous':      ['known', 'noted', 'popular', 'industry'],
    'helps':       ['provides', 'supports', 'assists', 'enables', 'allows'],
    'safety':      ['security', 'protection', 'guarding', 'care', 'safe'],
    'security':    ['safety', 'protection', 'guarding', 'sira', 'police'],
    'cleaning':    ['housekeeping', 'sanitizing', 'hygiene', 'scrubbing', 'mopping'],
    'report':      ['inform', 'notify', 'tell', 'escalate', 'call'],
    'supervisor':  ['manager', 'lead', 'boss', 'authority', 'office'],
    'immediately': ['quickly', 'fast', 'now', 'urgent'],
    'rules':       ['laws', 'regulations', 'guidelines', 'policy', 'rta', 'sira'],
  };
  return map[w.toLowerCase()] || [];
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function evaluateCandidateForQuestion(q, candidateRaw) {
  // MCQ: allow matching by option key (A/B/C/D) OR by the option text.
  if (q && q.expectedOption && Array.isArray(q.options) && q.options.length > 0) {
    const c = (candidateRaw || '').toString().trim();
    const candKey = c.toUpperCase();
    if (candKey === q.expectedOption) return { matched: true, score: 1 };
    // If they typed the option text instead of selecting.
    return evaluateAnswerLenient(c, q.expectedAnswer || '');
  }
  // Fluency: LCS sequencing & leniency
  if (q && q.type === 'fluency') {
    return evaluateFluencyAnswer((candidateRaw || '').toString(), (q?.expectedAnswer || '').toString());
  }
  // Essay: 4-pillar linguistic heuristics
  if (q && q.type === 'essay') {
    return evaluateEssayAnswer((candidateRaw || '').toString(), q.expectedKeywords || []);
  }
  return evaluateAnswerLenient((candidateRaw || '').toString(), (q?.expectedAnswer || '').toString(), q?.type);
}

/**
 * Longest Common Subsequence of arrays (for sequence checking)
 */
function calculateWordLCS(arr1, arr2) {
  const m = arr1.length, n = arr2.length;
  const dp = Array.from({length: m + 1}, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Essay scoring: 4-Pillar Heuristic (Volume, TTR, Syntax, Keywords)
 */
function evaluateEssayAnswer(candidate, expectedKeywords) {
  const text = (candidate || '').toString().trim();
  if (!text) return { matched: false, score: 0 };

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // 1. Volume (25%)
  // Candidates get full points for 120 words
  let volumeScore = Math.min(1.0, wordCount / 120);

  // 2. Lexical Richness / Type-Token Ratio (15%)
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')));
  let ttr = wordCount > 0 ? (uniqueWords.size / wordCount) : 0;
  // Good TTR is generally > 0.45 for an essay
  let richnessScore = Math.min(1.0, ttr / 0.45);

  // 3. Thematic Keywords (60%)
  // Checks if the candidate used words related to the prompt topic
  let keywordScore = 0;
  if (expectedKeywords && expectedKeywords.length > 0) {
    let matchedKeywords = 0;
    expectedKeywords.forEach(kw => {
      const stemK = stemWord(kw.toLowerCase());
      uniqueWords.forEach(uw => {
        if (uw.includes(stemK) || levenshteinDistance(uw, kw) <= 1) {
          matchedKeywords++;
        }
      });
    });
    // Require at least 8 unique thematic keywords for full topic score
    keywordScore = Math.min(1.0, matchedKeywords / 8);
  } else {
    keywordScore = 1; 
  }

  // Final score distribution:
  // Volume: 25% | Lexical Richness: 15% | Topic Relevance: 60%
  const finalScore = (volumeScore * 0.25) + (richnessScore * 0.15) + (keywordScore * 0.60);
  
  return {
    matched: finalScore >= 0.55, // Slightly higher bar for passing essays
    score: Math.max(0, Math.min(1, finalScore))
  };
}

/**
 * Fluency scoring: LCS + Word Match Rate
 * Score = (Accuracy * 0.6) + (Continuity * 0.4)
 */
function evaluateFluencyAnswer(candidate, expected) {
  const cNorm = normalizeText(candidate);
  const eNorm = normalizeText(expected);
  if (!cNorm || !eNorm) return { matched: false, score: 0 };

  const candWords = cNorm.split(' ').filter(w => w.length >= 2);
  const expWords  = eNorm.split(' ').filter(w => w.length >= 2);
  if (!expWords.length) return { matched: false, score: 0 };

  let matchCount = 0;
  const candSet = new Set(candWords);
  expWords.forEach(ew => {
    if (candSet.has(ew)) {
      matchCount++;
    } else {
      // Fuzzy: allow 1-char typo for words > 4 chars
      for (const cw of candWords) {
        if (cw.length > 3 && ew.length > 3 && levenshteinDistance(cw, ew) <= 1) {
          matchCount++;
          break;
        }
      }
    }
  });

  const lcsLen = calculateWordLCS(candWords, expWords);

  let accuracyRatio = matchCount / expWords.length;
  let continuityRatio = lcsLen / Math.max(candWords.length, 1);

  // Boosts (STT leniency)
  if (accuracyRatio >= 0.7) accuracyRatio = 1.0;
  else accuracyRatio = Math.min(1.0, accuracyRatio * 1.25);

  if (continuityRatio >= 0.5) continuityRatio = 1.0;
  else continuityRatio = Math.min(1.0, continuityRatio * 1.5);

  let score = (accuracyRatio * 0.6) + (continuityRatio * 0.4);

  return { matched: score >= 0.45, score: score };
}

function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .replace(/[.,]/g, '') // Explicitly ignore commas and full stops
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeForScoring(norm) {
  const STOP = new Set([
    'the','a','an','and','or','to','of','in','for','with','on','at','by','from','that',
    'this','it','its','are','is','was','were','be','been','being','as','but','not','very'
  ]);

  return (norm || '')
    .split(' ')
    .map(t => t.trim())
    .filter(t => t && t.length >= 2 && !STOP.has(t));
}

/* ── DISPLAY RESULT ──────────────────────────────── */
function showResult(resultObj) {
  const setTxt = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  const setStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

  const total = typeof resultObj === 'number' ? resultObj : resultObj.total;

  setTxt('final-score', total);
  setTxt('ref-id-dash', S.refId);
  
  // Inject candidate name into Dashboard
  const firstName = S.personal ? (S.personal.firstName || 'Candidate') : 'Candidate';
  setTxt('conf-name-display', firstName);

  // Show breakdown metric bars
  if (typeof resultObj === 'object') {
    setStyle('bar-r', 'width', resultObj.reading + '%');
    setTxt('sc-r', resultObj.reading + '%');

    setStyle('bar-v', 'width', resultObj.voice + '%');
    setTxt('sc-v', resultObj.voice + '%');

    setStyle('bar-q', 'width', resultObj.quality + '%');
    setTxt('sc-q', resultObj.quality + '%');
  }

  // Score ring animation
  const circ   = 390;
  const offset = circ - (circ * total / 100);
  setStyle('result-ring', 'strokeDashoffset', offset);

  let grade, color;
  if      (total >= 80) { grade = 'Excellent — Strong Candidate'; color = 'var(--success)'; }
  else if (total >= 65) { grade = 'Good — Recommended';           color = 'var(--primary)';    }
  else if (total >= 50) { grade = 'Average — Needs Review';       color = 'var(--warning)'; }
  else                  { grade = 'Below Threshold';              color = 'var(--danger)';  }

  setHtml('grade-display', `<span class="grade-pill" style="background:${color}20;color:${color};">${grade}</span>`);
}

/* ── UTILITY ─────────────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

/* ── FLOW RESET ──────────────────────────────────── */
function resetCandidate() {
  S.source = 'Direct';
  S.job = '';
  S.personal = {};
  S.questions = [];
  S.answers = {};
  S.scores = {};
  S.evaluations = {};
  S.refId = '';
  S.fluencyResets = {};
  S.submitted = false;
  localStorage.removeItem('innovision_timer_start');
}

function applyAgain() {
  resetCandidate();
  const qc = document.getElementById('q-container');
  if (qc) qc.innerHTML = '';
  if (typeof buildJobGrid === 'function') buildJobGrid();
  goStep(0);
}

function goToHomePage() {
  // After submit, return to first page (fresh state).
  resetCandidate();
  const qc = document.getElementById('q-container');
  if (qc) qc.innerHTML = '';
  if (typeof buildJobGrid === 'function') buildJobGrid();
  if (typeof goHome === 'function') goHome();
  else goStep(0);
}

/* ── INPUT FILTERING (alphabets-only) ─────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // --- FULLSCREEN ENFORCER ---
  const fsOverlay = document.createElement('div');
  fsOverlay.id = 'fs-enforcer';
  fsOverlay.className = 'hidden';
  fsOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:var(--bg);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;';
  fsOverlay.innerHTML = `
    <h2 style="margin-bottom:10px;">Fullscreen Required</h2>
    <p style="color:var(--muted);margin-bottom:20px;">You must complete the assessment in fullscreen mode.</p>
    <button class="btn-primary" id="btn-reenter-fs">Return to Fullscreen</button>
  `;
  document.body.appendChild(fsOverlay);

  const btnReenterFs = document.getElementById('btn-reenter-fs');
  if (btnReenterFs) {
    btnReenterFs.addEventListener('click', () => {
      enterAssessmentFullscreen();
      setTimeout(() => fsOverlay.classList.add('hidden'), 500);
    });
  }

  const handleFsChange = () => {
    // Enforce only on step 3 (Assessment) before submitting
    if (typeof currentStep !== 'undefined' && currentStep === 3 && typeof S !== 'undefined' && !S.submitted) {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      if (!isFs) {
        fsOverlay.classList.remove('hidden');
      } else {
        fsOverlay.classList.add('hidden');
      }
    } else {
      fsOverlay.classList.add('hidden');
    }
  };

  document.addEventListener('fullscreenchange', handleFsChange);
  document.addEventListener('webkitfullscreenchange', handleFsChange);
  document.addEventListener('MSFullscreenChange', handleFsChange);
  // ---------------------------

  const nameCharRe = /[^a-zA-Z ]/g;       // remove everything except letters + spaces
  const langsCharRe = /[^a-zA-Z, ]/g;    // remove everything except letters + comma + spaces
  const phoneCharRe = /[^0-9+\-]/g;      // remove everything except digits, + and -
  const cityCharRe = /[^a-zA-Z., ]/g;    // letters, comma, period, space only
  ['fname', 'lname', 'langs', 'phone', 'city'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (id === 'langs') {
        // Keep backspace/delete feeling natural: only strip invalid characters,
        // and lightly normalize comma usage without trimming the whole string.
        let v = el.value.replace(langsCharRe, '');
        // Prevent duplicate commas like ",," or ", ,"
        v = v.replace(/\s*,\s*,+/g, ',');
        // Do NOT force a space after comma (lets backspace work naturally)
        // Collapse multiple spaces (but keep user spacing around commas)
        v = v.replace(/[ ]{2,}/g, ' ');
        el.value = v;
      } else if (id === 'phone') {
        // Allow only digits, + and -; keep backspace/paste natural.
        el.value = el.value.replace(phoneCharRe, '');
      } else if (id === 'city') {
        let v = el.value.replace(cityCharRe, '');
        v = v.replace(/[ ]{2,}/g, ' ');
        el.value = v;
      } else {
        el.value = el.value.replace(nameCharRe, '');
        el.value = el.value.replace(/\s+/g, ' ').trimStart();
      }
    });
  });
});
