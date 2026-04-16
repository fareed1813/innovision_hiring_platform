/**
 * app.js — Application Initialisation & Shared Utilities
 * Innovision Overseas UAE Hiring Platform v1.0.0
 */

'use strict';

/* ── SIMPLE HASH ROUTER (enables browser back/forward) ── */
let currentStep = 0;
let suppressHash = false;

function setRoute(page, step) {
  if (suppressHash) return;
  const s = typeof step === 'number' ? step : currentStep;
  window.location.hash = `#/${page}/${s}`;
}

function parseRoute(hash) {
  const h = (hash || '').replace(/^#/, '');
  const parts = h.split('/').filter(Boolean);
  // Expected: /candidate/0  OR  /admin  OR  /admin-login
  const page = parts[0] || 'candidate';
  const step = Number.parseInt(parts[1] || '0', 10);
  return { page, step: Number.isFinite(step) ? step : 0 };
}

function applyRoute(route) {
  suppressHash = true;
  try {
    const { page } = route;
    let { step } = route;

    const appShell = document.getElementById('app-shell');
    const adminLogin = document.getElementById('page-admin-login');

    if (page === 'admin-login') {
      if (appShell) appShell.classList.add('hidden');
      if (adminLogin) adminLogin.classList.add('active');
      return;
    }

    // Default: show app shell, hide login page
    if (adminLogin) adminLogin.classList.remove('active');
    if (appShell) appShell.classList.remove('hidden');

    if (page === 'admin') {
      const adminTab = document.getElementById('tab-admin');
      if (adminTab) requireAdminLogin(adminTab);
      return;
    }

    // Candidate route
    const candTab = document.getElementById('tab-candidate');
    if (candTab) showPage('candidate', candTab);

    // Hard block browser-back after submission: force results step.
    if (typeof S === 'object' && S?.submitted && step < 4) {
      step = 4;
      history.replaceState(null, '', '#/candidate/4');
    }
    goStep(Math.max(0, Math.min(4, step)));
  } finally {
    suppressHash = false;
  }
}

/* ── PAGE NAVIGATION ─────────────────────────────── */
function showPage(pageId, btn) {
  document.querySelectorAll('#app-shell .page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  setRoute(pageId, currentStep);
}

/* ── STEP NAVIGATION (candidate flow) ───────────── */
function goStep(n) {
  // After submitting, block navigation back into the assessment.
  if (typeof S === 'object' && S?.submitted && n < 4) {
    showToast('Assessment already submitted. Please use “Apply Again” to start a new application.', 'info');
    n = 4;
  }
  for (let i = 0; i <= 4; i++) {
    const el = document.getElementById('step-' + i);
    if (el) el.classList.toggle('hidden', true);
  }
  const target = document.getElementById('step-' + n);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  currentStep = n;
  setRoute('candidate', currentStep);

  // Fullscreen: enter when taking the test (step 3), exit on any other step
  if (n === 3 && typeof enterAssessmentFullscreen === 'function') {
    enterAssessmentFullscreen();
  } else if (n !== 3 && typeof exitAssessmentFullscreen === 'function') {
    exitAssessmentFullscreen();
  }
}

/* ── BUILD JOB GRID ──────────────────────────────── */
function buildJobGrid() {
  const grid = document.getElementById('job-grid-container');
  if (!grid) return;
  grid.innerHTML = '';

  Object.entries(ROLES).forEach(([key, r]) => {
    const d = document.createElement('div');
    d.className = 'job-card role-' + key + (S.job === key ? ' selected' : '');
    d.id = 'job-' + key;
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', 'Select role: ' + r.label);
    d.onclick = () => selectJob(key);
    d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') selectJob(key); };
    d.innerHTML = `
      <div class="job-check"><div class="job-check-inner"></div></div>
      <div class="job-icon">${r.icon}</div>
      <h3>${r.label}</h3>
      <p>${r.desc}</p>
      <div class="uae-tag">🇦🇪 UAE Deployment</div>
    `;
    grid.appendChild(d);
  });
}

/* ── TOAST NOTIFICATION ──────────────────────────── */
let toastTimer = null;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast t-' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── KEYBOARD SHORTCUTS ──────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal');
    if (modal && modal.classList.contains('open')) closeModal();
  }
});

/* ── SIDEBAR KEYBOARD NAV ────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sb-item').forEach(item => {
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') item.click();
    });
  });
});

/* ── HOME NAV (logo click) ───────────────────────── */
function goHome() {
  const appShell = document.getElementById('app-shell');
  if (appShell) appShell.classList.remove('hidden');

  const adminLogin = document.getElementById('page-admin-login');
  if (adminLogin) adminLogin.classList.remove('active');

  const candidateTab = document.getElementById('tab-candidate');
  if (candidateTab) showPage('candidate', candidateTab);

  // Return to landing step for the candidate flow
  goStep(0);
}

// Enable keyboard activation for logo containers
document.addEventListener('keydown', e => {
  if (!(e.key === 'Enter' || e.key === ' ')) return;
  const activeEl = document.activeElement;
  if (!activeEl) return;
  if (activeEl.getAttribute('aria-label') !== 'Go to first page') return;
  e.preventDefault();
  goHome();
});

/* ── INITIALISE APP ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Build job grid
  buildJobGrid();

  // Load or seed admin data
  let data = loadAdminData();
  if (!data.length) {
    // Attach real QB questions to demo records
    const seeded = DEMO_CANDIDATES.map(c => ({
      ...c,
      questions: (QB[c.job] || []).slice(0, 3)
    }));
    saveAdminData(seeded);
  }

  // Initial admin refresh (stats update silently)
  adminData = loadAdminData();

  console.log(
    '%c Innovision Overseas UAE Hiring Platform v1.0.0 ',
    'background:#c9a84c;color:#06090f;font-weight:bold;border-radius:4px;padding:4px 8px;'
  );

  // Initialise route (enables browser back/forward)
  if (!window.location.hash) {
    history.replaceState(null, '', '#/candidate/0');
  }
  applyRoute(parseRoute(window.location.hash));
});

window.addEventListener('hashchange', () => {
  applyRoute(parseRoute(window.location.hash));
});
