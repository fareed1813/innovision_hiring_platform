/**
 * app.js — Application Initialisation & Shared Utilities
 * Innovision Overseas International Hiring Platform v1.0.0
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

/* ── BUILD JOB GRID (Category + Sub-role accordion) ─── */
let selectedSubRole = S?.subRole || '';

function buildJobGrid() {
  const grid = document.getElementById('job-grid-container');
  if (!grid) return;
  grid.innerHTML = '';

  Object.entries(ROLES).forEach(([key, r]) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:0;';

    // Category card
    const card = document.createElement('div');
    const isExpanded = S.job === key;
    card.className = 'job-card role-' + key + (isExpanded ? ' selected' : '');
    card.id = 'job-' + key;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Select category: ' + r.label);
    card.style.cssText = 'cursor:pointer;user-select:none;border-bottom-left-radius:' + (isExpanded ? '0' : '') + ';border-bottom-right-radius:' + (isExpanded ? '0' : '') + ';';
    card.innerHTML = `
      <div class="job-icon">${r.icon}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <h3 style="margin:0">${r.label}</h3>
        <svg id="chevron-${key}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:var(--brand-red);flex-shrink:0;margin-top:2px;transition:transform 0.25s ease;transform:${isExpanded ? 'rotate(180deg)' : 'none'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <p style="margin-top:8px;font-size:13px;color:var(--muted)">${r.desc}</p>
    `;

    card.onclick = () => toggleJobCategory(key);
    card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') toggleJobCategory(key); };

    wrapper.appendChild(card);

    // Sub-role list (shown when this category is selected/expanded)
    if (r.subRoles && r.subRoles.length) {
      const subList = document.createElement('div');
      subList.id = 'subrole-list-' + key;
      subList.className = 'subrole-list-vanilla';
      subList.style.cssText = `
        display: ${isExpanded ? 'block' : 'none'};
        border: 1px solid var(--brand-red);
        border-top: none;
        border-radius: 0 0 12px 12px;
        background: var(--white);
        overflow: hidden;
        animation: slide-down 0.22s ease;
      `;
      r.subRoles.forEach((sub, idx) => {
        const item = document.createElement('button');
        item.className = 'subrole-item-vanilla' + (selectedSubRole === sub.key ? ' active' : '');
        item.style.cssText = `
          width:100%;display:flex;align-items:center;gap:10px;padding:13px 20px;
          background:${selectedSubRole === sub.key ? 'var(--brand-red-light, #fef2f2)' : 'transparent'};
          border:none;border-top:${idx > 0 ? '1px solid var(--border)' : 'none'};
          cursor:pointer;text-align:left;font-family:inherit;
        `;
        item.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--brand-red);flex-shrink:0">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span style="font-weight:700;color:var(--text);font-size:14px">${sub.label}</span>
        `;
        item.onclick = (e) => {
          e.stopPropagation();
          selectSubRole(key, sub.key);
        };
        subList.appendChild(item);
      });
      wrapper.appendChild(subList);
    }

    grid.appendChild(wrapper);
  });
}

function toggleJobCategory(key) {
  const wasSelected = S.job === key;
  // Collapse all
  Object.keys(ROLES).forEach(k => {
    const c = document.getElementById('job-' + k);
    const l = document.getElementById('subrole-list-' + k);
    const ch = document.getElementById('chevron-' + k);
    if (c) { c.classList.remove('selected'); c.style.borderBottomLeftRadius = ''; c.style.borderBottomRightRadius = ''; }
    if (l) l.style.display = 'none';
    if (ch) ch.style.transform = 'none';
  });
  if (!wasSelected) {
    S.job = key;
    selectedSubRole = '';
    const c = document.getElementById('job-' + key);
    const l = document.getElementById('subrole-list-' + key);
    const ch = document.getElementById('chevron-' + key);
    if (c) { c.classList.add('selected'); c.style.borderBottomLeftRadius = '0'; c.style.borderBottomRightRadius = '0'; }
    if (l) l.style.display = 'block';
    if (ch) ch.style.transform = 'rotate(180deg)';
  } else {
    S.job = '';
    selectedSubRole = '';
  }
  updateContinueBtn();
}

function selectSubRole(roleKey, subKey) {
  S.job = roleKey;
  S.subRole = subKey;
  selectedSubRole = subKey;
  // Highlight selected sub-role
  const list = document.getElementById('subrole-list-' + roleKey);
  if (list) {
    list.querySelectorAll('.subrole-item-vanilla').forEach(item => {
      item.style.background = 'transparent';
    });
    const items = list.querySelectorAll('.subrole-item-vanilla');
    const subRoles = ROLES[roleKey]?.subRoles || [];
    const idx = subRoles.findIndex(s => s.key === subKey);
    if (items[idx]) items[idx].style.background = 'var(--brand-red-light, #fef2f2)';
  }
  updateContinueBtn();
}

function updateContinueBtn() {
  const btn = document.getElementById('btn-continue-role');
  if (btn) btn.disabled = !(S.job && S.subRole);
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
    '%c Innovision Overseas International Hiring Platform v1.0.0 ',
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
