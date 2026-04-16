/**
 * auth.js — Admin Authentication
 * Innovision Overseas UAE Hiring Platform v1.0.0
 */

'use strict';

let currentAdmin = null;

/* ── LOGIN ─────────────────────────────────────── */
function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');
  const errBox   = document.getElementById('login-error');
  const errText  = document.getElementById('login-error-text');

  if (!username || !password) {
    errText.textContent = 'Please enter both username and password.';
    errBox.classList.remove('hidden');
    return;
  }

  // Show spinner while "authenticating"
  btn.innerHTML = '<span class="login-spinner"></span>Signing in…';
  btn.disabled = true;

  setTimeout(() => {
    const adminRecord = ADMINS[username.toLowerCase()];

    if (adminRecord && adminRecord.password === password) {
      currentAdmin = { username: username.toLowerCase(), ...adminRecord };
      errBox.classList.add('hidden');
      btn.innerHTML = 'Sign In';
      btn.disabled = false;
      enterAdminDashboard();
    } else {
      errText.textContent = 'Invalid username or password. Please try again.';
      errBox.classList.remove('hidden');
      btn.innerHTML = 'Sign In';
      btn.disabled = false;
      document.getElementById('login-password').value = '';
      document.getElementById('login-password').focus();
    }
  }, 900);
}

/* ── ENTER DASHBOARD ───────────────────────────── */
function enterAdminDashboard() {
  document.getElementById('page-admin-login').classList.remove('active');
  document.getElementById('app-shell').classList.remove('hidden');

  document.getElementById('admin-badge').classList.remove('hidden');
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('admin-username-display').textContent = currentAdmin.display;
  document.getElementById('sidebar-role-label').textContent     = currentAdmin.role;

  // Switch to admin page
  const adminTab = document.getElementById('tab-admin');
  showPage('admin', adminTab);
  refreshAdmin();
  buildQBSections();
  showToast('Welcome back, ' + currentAdmin.display + ' ✓', 'success');
}

/* ── LOGOUT ─────────────────────────────────────── */
function doLogout() {
  currentAdmin = null;
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').classList.add('hidden');

  // Return to candidate portal view after sign-out
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('page-admin-login').classList.remove('active');
  const candidateTab = document.getElementById('tab-candidate');
  showPage('candidate', candidateTab);

  document.getElementById('admin-badge').classList.add('hidden');
  document.getElementById('logout-btn').classList.add('hidden');

  showToast('Signed out successfully.', 'info');
}

/* ── GATE: require login to access admin ────────── */
function requireAdminLogin(btn) {
  if (currentAdmin) {
    showPage('admin', btn);
    refreshAdmin();
  } else {
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('page-admin-login').classList.remove('active');
    document.getElementById('page-admin-login').classList.add('active');
    showToast('Please sign in to access the Admin Dashboard.', 'info');
  }
}

/* ── GO TO CANDIDATE PORTAL from login ─────────── */
function goToCandidate() {
  document.getElementById('page-admin-login').classList.remove('active');
  document.getElementById('app-shell').classList.remove('hidden');
  const candidateTab = document.getElementById('tab-candidate');
  showPage('candidate', candidateTab);
}

/* ── PASSWORD VISIBILITY TOGGLE ────────────────── */
function togglePwd() {
  const inp = document.getElementById('login-password');
  const eye = document.getElementById('eye-btn');
  if (inp.type === 'password') {
    inp.type = 'text';
    eye.textContent = '🙈';
    eye.setAttribute('title', 'Hide password');
  } else {
    inp.type = 'password';
    eye.textContent = '👁';
    eye.setAttribute('title', 'Show password');
  }
}
