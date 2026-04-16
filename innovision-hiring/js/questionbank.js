/**
 * questionbank.js — Question Bank Management
 * Innovision Overseas UAE Hiring Platform v1.0.0
 */

'use strict';

/* ── BUILD ALL QB SECTIONS ───────────────────────── */
function buildQBSections() {
  const container = document.getElementById('qb-sections');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(ROLES).forEach(([roleKey, role]) => {
    const sec = document.createElement('div');
    sec.className = 'qb-section';
    sec.innerHTML = `
      <div class="qb-role-header">
        <div class="qb-role-title">${role.icon} ${role.label}</div>
        <div class="qb-count" id="qb-count-${roleKey}">
          ${(QB[roleKey] || []).length} question${(QB[roleKey] || []).length !== 1 ? 's' : ''}
        </div>
      </div>

      <!-- Upload area -->
      <div class="qb-upload-area" id="drop-${roleKey}"
        onclick="document.getElementById('file-${roleKey}').click()"
        ondragover="dragOver(event,'${roleKey}')"
        ondragleave="dragLeave(event,'${roleKey}')"
        ondrop="dropFile(event,'${roleKey}')"
        role="button" tabindex="0"
        aria-label="Upload questions for ${role.label}">
        <div class="qb-upload-icon">📂</div>
        <div class="qb-upload-text">Drop a CSV or JSON file here, or click to browse</div>
        <div class="qb-upload-hint">
          CSV columns: <code>type, question, passage(optional)</code>
          &nbsp;|&nbsp;
          JSON: array of <code>{ type, question, passage }</code>
        </div>
      </div>
      <input type="file" class="qb-file-input" id="file-${roleKey}"
        accept=".csv,.json" onchange="handleFileUpload(event,'${roleKey}')"/>

      <!-- Action buttons -->
      <div class="qb-btn-row">
        <button class="btn-primary btn-sm" onclick="downloadTemplate('${roleKey}')">
          ⬇ Download CSV File
        </button>
        <button class="btn-outline btn-sm" onclick="clearQB('${roleKey}')">
          🗑 Clear All Questions
        </button>
      </div>

      <!-- Question list -->
      <div class="qb-list" id="qb-list-${roleKey}"></div>

      <!-- Manual add form -->
      <div class="add-q-form">
        <div class="add-q-title">+ Add Question Manually</div>
        <div class="add-q-row">
          <div>
            <label class="form-label">Question Type</label>
            <select class="form-input" id="nt-${roleKey}" style="font-size:13px;">
              <option value="reading">Reading (requires passage)</option>
              <option value="comprehension">Comprehension</option>
              <option value="situational">Situational</option>
            </select>
          </div>
          <div></div>
        </div>
        <label class="form-label">Reading Passage <span style="color:var(--muted);">(leave blank for Comprehension / Situational)</span></label>
        <textarea class="add-q-passage" id="np-${roleKey}"
          placeholder="Paste the reading passage here…"
          aria-label="Reading passage for ${role.label}"></textarea>
        <label class="form-label">Question *</label>
        <textarea class="add-q-textarea" id="nq-${roleKey}"
          placeholder="Type the question…"
          aria-label="Question text for ${role.label}"></textarea>
        <button class="btn-primary btn-sm" onclick="addManualQ('${roleKey}')">Add Question</button>
      </div>
    `;
    container.appendChild(sec);
    renderQBList(roleKey);
  });
}

/* ── RENDER QUESTION LIST FOR A ROLE ─────────────── */
function renderQBList(roleKey) {
  const list = document.getElementById('qb-list-' + roleKey);
  const cnt  = document.getElementById('qb-count-' + roleKey);
  if (!list) return;

  const qs = QB[roleKey] || [];
  if (cnt) cnt.textContent = qs.length + ' question' + (qs.length !== 1 ? 's' : '');

  if (!qs.length) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">No questions yet. Upload a file or add manually below.</div>';
    return;
  }

  list.innerHTML = qs.map((q, i) => `
    <div class="qb-item">
      <div class="qb-item-num">${i + 1}.</div>
      <div class="qb-item-body">
        ${q.passage ? `
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;font-style:italic;">
            📖 ${escapeHtml(q.passage.slice(0, 90))}${q.passage.length > 90 ? '…' : ''}
          </div>
        ` : ''}
        <div
          class="qb-item-q"
          role="button"
          tabindex="0"
          onclick="openQBQuestion('${roleKey}',${i})"
          onkeydown="if(event.key==='Enter'||event.key===' ') openQBQuestion('${roleKey}',${i})"
        >${escapeHtml(q.question)}</div>
        <div style="margin-top:4px;">
          <span class="q-badge ${BADGE_MAP[q.type]}">${BADGE_LBL[q.type]}</span>
        </div>
      </div>
      <button class="qb-item-del" onclick="event.stopPropagation();deleteQ('${roleKey}',${i})"
        title="Delete this question" aria-label="Delete question ${i + 1}">✕</button>
    </div>
  `).join('');
}

/* ── OPEN QUESTION PREVIEW MODAL ──────────────── */
function openQBQuestion(roleKey, idx) {
  const q = (QB[roleKey] || [])[idx];
  if (!q) return;
  const role = ROLES[roleKey] || {};

  const modalEl = document.getElementById('modal');
  if (!modalEl) return;

  // Restore default visual structure assumptions first
  // (important because candidate detail shares same modal).
  const scoreRow = modalEl.querySelector('.modal-score-row');
  const dividers  = modalEl.querySelectorAll('.divider');
  dividers.forEach(d => (d.style.display = ''));
  if (scoreRow) scoreRow.style.display = '';
  const actionsDiv = document.getElementById('m-actions');
  if (actionsDiv) actionsDiv.style.display = '';
  const sectionTitle = modalEl.querySelector('.modal-section-title');
  if (sectionTitle) sectionTitle.textContent = 'Question & Answer';

  // Hide candidate-only sections for QB view
  if (scoreRow) scoreRow.style.display = 'none';
  if (scoreRow && scoreRow.previousElementSibling && scoreRow.previousElementSibling.classList.contains('divider')) {
    scoreRow.previousElementSibling.style.display = 'none';
  }
  if (scoreRow && scoreRow.nextElementSibling && scoreRow.nextElementSibling.classList.contains('divider')) {
    scoreRow.nextElementSibling.style.display = 'none';
  }

  const qbActionsDivider = actionsDiv && actionsDiv.previousElementSibling;
  if (qbActionsDivider && qbActionsDivider.classList.contains('divider')) qbActionsDivider.style.display = 'none';
  if (actionsDiv) actionsDiv.style.display = 'none';

  document.getElementById('m-name').textContent = role.label ? `${role.label}` : 'Question';
  document.getElementById('m-meta').textContent =
    `Q${idx + 1} · ${q.type ? q.type : '—'} · Ref: ${roleKey}_${idx + 1}`;

  // Use the existing “q-review” blocks for the modal content (same look as candidate view).
  const badgeClass = BADGE_MAP[q.type] || 'badge-reading';
  const badgeLbl   = BADGE_LBL[q.type] || (q.type ? q.type : 'Question');

  let answerHtml = '';
  if (q.type === 'reading') {
    answerHtml = `
      <div class="ans-label" style="margin-top:10px;">Passage (Answer)</div>
      <div style="font-size:12px;color:var(--muted2);line-height:1.6;">${escapeHtml(q.passage || '—')}</div>
    `;
  } else if (q.type === 'comprehension') {
    const opt = q.expectedOption ? `${escapeHtml(q.expectedOption)}. ` : '';
    answerHtml = `
      <div class="ans-label" style="margin-top:10px;">Expected Answer</div>
      <div style="font-size:12px;color:var(--text);font-weight:600;line-height:1.6;">${opt}${escapeHtml(q.expectedAnswer || '—')}</div>
    `;
    if (Array.isArray(q.options) && q.options.length) {
      answerHtml += `
        <div class="ans-label" style="margin-top:12px;">Options</div>
        <div style="font-size:12px;color:var(--muted2);line-height:1.7;">
          ${q.options.map(o => {
            const k = escapeHtml(o.key || '');
            const t = escapeHtml(o.text || '');
            const isExp = (o.key || '') === q.expectedOption;
            return `<div style="margin-bottom:3px;${isExp ? 'color:var(--primary);font-weight:700;' : ''}">${k}. ${t}</div>`;
          }).join('')}
        </div>
      `;
    }
  } else {
    // Situational: the current QB storage supports question+type; expected answer may not exist.
    answerHtml = `
      <div class="ans-label" style="margin-top:10px;">Expected Answer</div>
      <div style="font-size:12px;color:var(--muted2);line-height:1.6;">${escapeHtml(q.expectedAnswer || '—')}</div>
    `;
  }

  document.getElementById('m-details').innerHTML = `
    <div class="detail-item"><label>Type</label><span>${escapeHtml(q.type || '—')}</span></div>
    <div class="detail-item"><label>Question</label><span style="font-weight:700;line-height:1.4;">${escapeHtml(q.question || '—')}</span></div>
  `;
  document.getElementById('m-score').textContent = '';
  document.getElementById('m-breakdown').innerHTML = '';

  document.getElementById('m-qa').innerHTML = `
    <div class="q-review">
      <div class="q-meta">
        <span class="q-num">Q${idx + 1}</span>
        <span class="q-badge ${badgeClass}">${escapeHtml(badgeLbl)}</span>
      </div>
      <div class="q-rev-q">${escapeHtml(q.question || '—')}</div>
      ${answerHtml}
    </div>
  `;

  // No action buttons for QB preview.
  if (actionsDiv) actionsDiv.innerHTML = '';

  modalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ── DELETE A QUESTION ───────────────────────────── */
function deleteQ(roleKey, idx) {
  if (!confirm('Delete this question? This cannot be undone.')) return;
  QB[roleKey].splice(idx, 1);
  renderQBList(roleKey);
  saveQB();
  showToast('Question removed.', 'info');
}

/* ── CLEAR ALL QUESTIONS FOR A ROLE ──────────────── */
function clearQB(roleKey) {
  const count = (QB[roleKey] || []).length;
  if (count === 0) { showToast('No questions to clear.', 'info'); return; }
  if (!confirm(`Clear all ${count} questions for ${ROLES[roleKey]?.label}? This cannot be undone.`)) return;
  QB[roleKey] = [];
  renderQBList(roleKey);
  saveQB();
  showToast('Question bank cleared.', 'info');
}

/* ── ADD QUESTION MANUALLY ───────────────────────── */
function addManualQ(roleKey) {
  const type     = document.getElementById('nt-' + roleKey).value;
  const passage  = document.getElementById('np-' + roleKey).value.trim();
  const question = document.getElementById('nq-' + roleKey).value.trim();

  if (!question) {
    showToast('Please enter a question text.', 'danger');
    return;
  }
  if (type === 'reading' && !passage) {
    showToast('Reading questions require a passage.', 'danger');
    return;
  }

  if (!QB[roleKey]) QB[roleKey] = [];
  QB[roleKey].push({
    id:      roleKey + '_m' + Date.now(),
    type:    type,
    question: question,
    passage:  passage || undefined
  });

  document.getElementById('nq-' + roleKey).value = '';
  document.getElementById('np-' + roleKey).value = '';
  renderQBList(roleKey);
  saveQB();
  showToast('Question added successfully.', 'success');
}

/* ── DRAG & DROP HANDLERS ────────────────────────── */
function dragOver(e, role) {
  e.preventDefault();
  document.getElementById('drop-' + role).classList.add('drag-over');
}
function dragLeave(e, role) {
  document.getElementById('drop-' + role).classList.remove('drag-over');
}
function dropFile(e, role) {
  e.preventDefault();
  document.getElementById('drop-' + role).classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f) processUploadedFile(f, role);
}
function handleFileUpload(e, role) {
  const f = e.target.files[0];
  if (f) processUploadedFile(f, role);
  e.target.value = '';
}

/* ── PROCESS UPLOADED FILE ───────────────────────── */
function processUploadedFile(file, role) {
  const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
  const allowedExts  = ['.csv', '.json'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!allowedExts.includes(ext)) {
    showToast('Only .csv and .json files are supported.', 'danger');
    return;
  }
  if (file.size > 500 * 1024) {
    showToast('File too large. Maximum size is 500 KB.', 'danger');
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    const text = ev.target.result;
    let parsed = [];

    try {
      if (ext === '.json') {
        parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          showToast('JSON file must contain an array of questions.', 'danger');
          return;
        }
      } else {
        // CSV parsing
        const lines  = text.split('\n').filter(l => l.trim());
        const header = lines[0].toLowerCase();
        const start  = (header.includes('type') || header.includes('question')) ? 1 : 0;

        for (let i = start; i < lines.length; i++) {
          const cols     = parseCSVLine(lines[i]);
          if (cols.length < 2) continue;
          const type     = (cols[0] || 'situational').trim().toLowerCase();
          const question = (cols[1] || '').trim();
          const passage  = (cols[2] || '').trim();
          if (question) {
            parsed.push({
              id:       role + '_up' + i,
              type:     ['reading', 'comprehension', 'situational'].includes(type) ? type : 'situational',
              question: question,
              passage:  passage || undefined
            });
          }
        }
      }
    } catch (err) {
      showToast('Could not parse the file. Please check the format.', 'danger');
      console.error('Innovision QB parse error:', err);
      return;
    }

    if (!parsed.length) {
      showToast('No valid questions found in the file.', 'danger');
      return;
    }

    // Validate and clean parsed questions
    const valid = parsed.filter(q => q.question && q.question.trim());
    valid.forEach((q, i) => {
      if (!q.id) q.id = role + '_up' + Date.now() + '_' + i;
      if (!q.type || !['reading','comprehension','situational'].includes(q.type)) q.type = 'situational';
    });

    if (!QB[role]) QB[role] = [];
    QB[role] = [...QB[role], ...valid];
    renderQBList(role);
    saveQB();
    showToast(
      `${valid.length} question${valid.length !== 1 ? 's' : ''} imported for ${ROLES[role]?.label}.`,
      'success'
    );
  };

  reader.onerror = () => showToast('Error reading file. Please try again.', 'danger');
  reader.readAsText(file);
}

/* ── CSV LINE PARSER (handles quoted commas) ─────── */
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if      (ch === '"')                 { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes)    { result.push(cur.trim()); cur = ''; }
    else                                 { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

/* ── DOWNLOAD CSV TEMPLATE ───────────────────────── */
function downloadTemplate(role) {
  const roleName = ROLES[role]?.label || role;
  const header = 'type,question,passage\n';
  const rows = [
    `situational,"Describe how you would handle a difficult situation at a UAE workplace.",`,
    `comprehension,"What would you do if a colleague asks you to ignore a safety rule?",`,
    `reading,"What does the passage say about the correct procedure?","All workers must sign in at the security gate and wear full PPE before entering the site. Failure to comply will result in immediate removal from the premises."`
  ].join('\n');

  const content  = header + rows;
  const blob     = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  anchor.href     = url;
  anchor.download = `innovision_${role}_questions_template.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  showToast(`CSV template for ${roleName} downloaded.`, 'info');
}
