/**
 * admin.js — Admin Dashboard Logic
 * Innovision Overseas UAE Hiring Platform v1.0.0
 */

'use strict';

let adminData = [];
let tableFilters = { dash: 'all', all: 'all' };
let tableSearch  = { dash: '',    all: ''    };

function resolveMcqOptionText(q, key) {
  const k = (key || '').toString().trim().toUpperCase();
  const opt = (q?.options || []).find(o => (o.key || '').toString().trim().toUpperCase() === k);
  return opt ? (opt.text || '') : '';
}

function formatMcqAnswer(q, raw) {
  const v = (raw || '').toString();
  if (!q?.expectedOption || !Array.isArray(q.options) || q.options.length === 0) return v;
  const k = v.trim().toUpperCase();
  if (!k) return v;
  const t = resolveMcqOptionText(q, k);
  return t ? `${k}. ${t}` : v;
}

/* ── ADMIN TAB SWITCHING ─────────────────────────── */
function switchAdminTab(tab, el) {
  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tab).classList.add('active');
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  refreshAdmin();
  if (tab === 'question-bank') buildQBSections();
}

/* ── REFRESH ENTIRE ADMIN PANEL ──────────────────── */
function refreshAdmin() {
  adminData = loadAdminData();

  const total    = adminData.length;
  const pending  = adminData.filter(c => c.status === 'pending').length;
  const selected = adminData.filter(c => c.status === 'selected').length;
  const rejected = adminData.filter(c => c.status === 'rejected').length;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('s-total',    total);
  setEl('s-pending',  pending);
  setEl('s-selected', selected);
  setEl('s-rejected', rejected);
  setEl('pending-badge', pending);

  // Update Summary Card Icons/Styling dynamically if needed, 
  // but mostly handled via CSS. Adding icons to labels here as well.
  const cards = {
    's-pending':  { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;opacity:0.7"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>', label: 'Pending Review' },
    's-selected': { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;opacity:0.7"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', label: 'Selected for UAE' },
    's-rejected': { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;opacity:0.7"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>', label: 'Rejected' }
  };

  Object.keys(cards).forEach(id => {
    const valEl = document.getElementById(id);
    if (!valEl) return;
    const box = valEl.closest('.stat-box');
    if (box) {
      const lbl = box.querySelector('.stat-lbl');
      if (lbl) lbl.innerHTML = cards[id].icon + cards[id].label;
    }
  });

  renderTbl('dash', adminData);
  renderTbl('all',  adminData);
  renderFiltered('selected',       adminData.filter(c => c.status === 'selected'));
  renderFiltered('rejected',       adminData.filter(c => c.status === 'rejected'));
  renderFiltered('pending-review', adminData.filter(c => c.status === 'pending'));
}

/* ── FILTER & SEARCH ─────────────────────────────── */
function filterTable(f, btn, view) {
  tableFilters[view] = f;
  btn.closest('.tbl-toolbar').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTbl(view, adminData);
}

function searchTable(val, view) {
  tableSearch[view] = val.toLowerCase();
  renderTbl(view, adminData);
}

/* ── RENDER TABLE (filtered/searched) ───────────── */
function renderTbl(view, data) {
  let d = [...data];
  const f = tableFilters[view] || 'all';
  const s = tableSearch[view]  || '';

  if (f !== 'all') d = d.filter(c => c.job === f);
  if (s) d = d.filter(c =>
    ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase().includes(s) ||
    (c.phone || '').includes(s) ||
    (c.city  || '').toLowerCase().includes(s)
  );
  d.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  renderFiltered(view, d);
}

function renderFiltered(view, data) {
  const tbody = document.getElementById('tbody-' + view);
  const empty = document.getElementById('empty-' + view);
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!data.length) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  data.forEach(c => tbody.appendChild(buildRow(c)));
}

/* ── BUILD TABLE ROW ─────────────────────────────── */
function buildRow(c) {
  const score = c.scores?.total || 0;
  const jobKey = c.job || '';
  const rc = getRoleThemeHex(jobKey);
  
  // Score class logic
  let scoreClass = 'score-neutral';
  if (score >= 70) scoreClass = 'score-passed';
  else if (score < 40) scoreClass = 'score-failed';

  const st    = 's-' + c.status;
  const sl =
    c.status === 'selected'
      ? 'Accepted'
      : c.status.charAt(0).toUpperCase() + c.status.slice(1);
  const init  = ((c.firstName || '?')[0] + ((c.lastName || '?')[0] || '')).toUpperCase();
  const role  = ROLES[c.job] || {};

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div class="cand-cell">
        <div class="avatar" style="background:${rc}; color:#fff; font-weight:700; border:none; box-shadow:0 2px 4px rgba(0,0,0,0.1);">${init}</div>
        <div>
          <div class="cand-name">${c.firstName} ${c.lastName}</div>
          <div class="cand-sub">${c.phone} · ${c.city}</div>
        </div>
      </div>
    </td>
    <td><span style="display:inline-flex;align-items:center;font-size:12px;gap:6px;">${role.icon || ''} ${role.label || c.job}</span></td>
    <td><span class="score-chip ${scoreClass}">${score}/100</span></td>
    <td><span class="status-pill ${st}">${sl}</span></td>
    <td>
      <div class="act-btns">
        <button class="btn-act ba-view" onclick="openModal('${c.id}')">View</button>
        ${c.status === 'pending' ? `
          <button class="btn-act ba-sel" onclick="setStatus('${c.id}','selected')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="20 6 9 17 4 12"/></svg>
            Select
          </button>
          <button class="btn-act ba-rej" onclick="setStatus('${c.id}','rejected')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Reject
          </button>
        ` : ''}
      </div>
    </td>
  `;
  return tr;
}

/* ── SET CANDIDATE STATUS ────────────────────────── */
function setStatus(id, status) {
  const idx = adminData.findIndex(c => c.id === id);
  if (idx === -1) return;
  adminData[idx].status = status;
  saveAdminData(adminData);
  refreshAdmin();
  showToast(
    status === 'selected'
      ? 'Candidate selected for UAE deployment ✓'
      : 'Candidate rejected.',
    status === 'selected' ? 'success' : 'danger'
  );
}

/* ── OPEN CANDIDATE DETAIL MODAL ─────────────────── */
function openModal(id) {
  const c = adminData.find(x => x.id === id);
  if (!c) return;

  const score = c.scores?.total || 0;
  const sc    = getRoleThemeHex(c.job);
  const role  = ROLES[c.job] || {};

  // Reset modal layout state (Question Bank preview also reuses this modal).
  const modalEl = document.getElementById('modal');
  if (modalEl) {
    modalEl.querySelectorAll('.divider').forEach(d => (d.style.display = ''));
    const scoreRow = modalEl.querySelector('.modal-score-row');
    if (scoreRow) scoreRow.style.display = '';
    const actionsDiv = document.getElementById('m-actions');
    if (actionsDiv) actionsDiv.style.display = '';
    const sectionTitle = modalEl.querySelector('.modal-section-title');
    if (sectionTitle) sectionTitle.textContent = 'Assessment Responses';
  }

  document.getElementById('m-name').textContent = c.firstName + ' ' + c.lastName;
  document.getElementById('m-name').style.removeProperty('color');
  document.getElementById('m-meta').textContent =
    (role.label || c.job) + ' · Ref: ' + c.id + ' · ' +
    new Date(c.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  document.getElementById('m-score').textContent  = score;
  document.getElementById('m-score').style.color  = 'var(--primary)';
  document.getElementById('m-score').style.fontFamily = "'Playfair Display', serif";

  // Details grid
  document.getElementById('m-details').innerHTML = `
    <div class="detail-item"><label>Phone</label><span>${c.phone}</span></div>
    <div class="detail-item"><label>Email</label><span>${c.email || '—'}</span></div>
    <div class="detail-item"><label>City</label><span>${c.city}</span></div>
    <div class="detail-item"><label>Experience</label><span>${c.experience} yr(s)</span></div>
    <div class="detail-item"><label>Passport</label><span>${c.passport || '—'}</span></div>
    <div class="detail-item"><label>Education</label><span>${c.education || '—'}</span></div>
    <div class="detail-item"><label>Languages</label><span>${c.languages}</span></div>
    <div class="detail-item"><label>Gulf Experience</label><span>${c.gulfExp || '—'}</span></div>
    <div class="detail-item"><label>Lead Source</label><span>${c.source}</span></div>
    <div class="detail-item"><label>Status</label><span>${c.status === 'selected' ? 'Accepted' : c.status}</span></div>
    ${c.proctoring && (c.proctoring.tabSwitches > 0 || c.proctoring.fullscreenExits > 0) ? `
      <div class="detail-item" style="grid-column: span 2; background: rgba(239, 68, 68, 0.05); padding: 8px; border-radius: 6px; border: 1px dashed var(--danger); margin-top: 8px;">
        <label style="color: var(--danger); font-weight: 700;">⚠ Integrity Flags</label>
        <span style="color: var(--danger); font-weight: 600;">
          ${c.proctoring.tabSwitches > 0 ? `${c.proctoring.tabSwitches} Tab Switch(es) ` : ''}
          ${c.proctoring.fullscreenExits > 0 ? `${c.proctoring.fullscreenExits} Fullscreen Exit(s)` : ''}
        </span>
      </div>
    ` : ''}
  `;

  // Score breakdown bars — aggregate by question type from evaluations
  const typeTotals = {};
  const typeCounts = {};
  (c.questions || []).forEach(q => {
    const t = q.type || 'other';
    if (!typeTotals[t]) { typeTotals[t] = 0; typeCounts[t] = 0; }
    typeCounts[t]++;
    const ev = c.evaluations?.[q.id];
    if (ev) {
      // Support both old {written:{score}} and new {score} format
      const s = typeof ev.score === 'number' ? ev.score : (ev.written?.score || 0);
      typeTotals[t] += s;
    }
  });
  document.getElementById('m-breakdown').innerHTML =
    Object.keys(typeTotals).map(t => {
      const pct = Math.round((typeTotals[t] / Math.max(typeCounts[t], 1)) * 100);
      const lbl = (BADGE_LBL[t] || t.charAt(0).toUpperCase() + t.slice(1));
      return `
      <div class="bar-row">
        <div class="bar-label" style="width:110px;font-size:11px;">${lbl}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:var(--primary);"></div>
        </div>
        <div class="bar-score">${pct}</div>
      </div>
    `;
    }).join('');

  // Q&A review
  document.getElementById('m-qa').innerHTML = (c.questions || []).map((q, i) => `
    <div class="q-review">
      <div class="q-meta">
        <span class="q-num">Q${i + 1}</span>
        <span class="q-badge ${BADGE_MAP[q.type] || ''}">${BADGE_LBL[q.type] || q.type || '—'}</span>
      </div>
      <div class="q-rev-q">${q.question}</div>
      ${q.expectedAnswer ? `
        <div class="ans-label" style="margin-top:10px;">Expected Answer</div>
        <div style="font-size:12px;color:var(--muted2);line-height:1.6;">${q.expectedOption ? `${q.expectedOption}. ${q.expectedAnswer}` : q.expectedAnswer}</div>
      ` : ''}
      ${c.answers?.[q.id] ? `
        <div class="ans-label">
          Candidate Answer
          ${c.evaluations?.[q.id] ? `
            <span style="margin-left:8px;color:${(c.evaluations[q.id].matched || c.evaluations[q.id].written?.matched) ? 'var(--success)' : 'var(--danger)'};"> 
              ${(c.evaluations[q.id].matched || c.evaluations[q.id].written?.matched) ? '✓ Matched' : '✗ Not matched'}
              ${typeof (c.evaluations[q.id].score ?? c.evaluations[q.id].written?.score) === 'number'
                ? ` (${Math.round((c.evaluations[q.id].score ?? c.evaluations[q.id].written?.score) * 100)}%)`
                : ''}
            </span>
          ` : ''}
        </div>
        <div style="font-size:12px;color:var(--text);line-height:1.6;">${formatMcqAnswer(q, c.answers[q.id])}</div>
        ${c.answers?.[q.id + '_audio'] ? `<audio controls src="${c.answers[q.id + '_audio']}" style="width:100%; height:36px; margin-top:10px; border-radius:4px; outline:none; background:#f1f3f5;"></audio>` : ''}
      ` : '<div class="ans-label">No answer provided</div>'}
    </div>
  `).join('');

  // Action buttons
  document.getElementById('m-actions').innerHTML = c.status === 'pending' ? `
    <button class="btn-act ba-sel" style="padding:10px 22px;font-size:13px;"
      onclick="setStatus('${c.id}','selected');closeModal();">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"/></svg>
      Select for UAE Deployment
    </button>
    <button class="btn-act ba-rej" style="padding:10px 22px;font-size:13px;"
      onclick="setStatus('${c.id}','rejected');closeModal();">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      Reject Candidate
    </button>
  ` : `
    <span style="font-size:12px;color:var(--muted);">
      Decision recorded: <strong style="color:var(--text);">${c.status === 'selected' ? 'Accepted' : c.status}</strong>
    </span>
  `;

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── CLOSE MODAL ─────────────────────────────────── */
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('modal');
  if (backdrop) {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) closeModal();
    });
  }
});

/* ── DOWNLOAD CANDIDATES CSV ─────────────────────── */
function downloadCandidatesCSV(view) {
  let d = [...adminData];
  const f = tableFilters[view] || 'all';
  const s = tableSearch[view]  || '';

  // Filter based on view context
  if (view === 'selected') d = d.filter(c => c.status === 'selected');
  else if (view === 'rejected') d = d.filter(c => c.status === 'rejected');
  else if (view === 'pending-review') d = d.filter(c => c.status === 'pending');

  // Apply toolbar filters
  if (f !== 'all') d = d.filter(c => c.job === f);
  if (s) d = d.filter(c =>
    ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase().includes(s) ||
    (c.phone || '').includes(s)
  );

  if (d.length === 0) {
    showToast('No candidates found to download.', 'warning');
    return;
  }

  const headers = ['ID', 'First Name', 'Last Name', 'Phone', 'Email', 'City', 'Job', 'Source', 'Score', 'Status', 'Date'];
  const rows = d.map(c => [
    c.id,
    c.firstName,
    c.lastName,
    `'${c.phone}`, 
    c.email || '',
    c.city,
    (ROLES[c.job] || {}).label || c.job,
    c.source,
    (c.scores || {}).total || 0,
    c.status,
    new Date(c.timestamp).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `innovision_${view}_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast(`${d.length} candidates downloaded as CSV.`, 'success');
}
