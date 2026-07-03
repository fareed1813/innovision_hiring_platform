import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Users, Clock, CheckCircle, XCircle, Search, Download, Eye, Check, X,
  ChevronLeft, ChevronRight, LogOut, ChevronDown, ShieldCheck, Info,
  Briefcase, Plus, Trash2, Upload, FileText, Edit2, ToggleLeft, ToggleRight,
  Paperclip, Save, X as XIcon, Wrench, Zap, Cog, HardHat, Car, Sparkles, Shield as ShieldIcon
} from 'lucide-react';

const ROLES = {
  driver:       'Taxi Driver',
  security:     'Special Security Guard',
  housekeeping: 'Housekeeping Staff',
  supervisor:   'Field Supervisor',
  helper:       'General Helper',
};

// Icon options for role creation
const ICON_OPTIONS = [
  { key: 'wrench',       label: 'Wrench',       icon: <Wrench size={18} /> },
  { key: 'zap',         label: 'Zap',          icon: <Zap size={18} /> },
  { key: 'cog',         label: 'Cog',          icon: <Cog size={18} /> },
  { key: 'construction',label: 'Hard Hat',     icon: <HardHat size={18} /> },
  { key: 'car',         label: 'Car',          icon: <Car size={18} /> },
  { key: 'sparkles',    label: 'Sparkles',     icon: <Sparkles size={18} /> },
  { key: 'shield',      label: 'Shield',       icon: <ShieldIcon size={18} /> },
  { key: 'users',       label: 'Users',        icon: <Users size={18} /> },
  { key: 'briefcase',   label: 'Briefcase',    icon: <Briefcase size={18} /> },
];

const ICON_RENDER = {
  wrench:       <Wrench size={22} />,
  zap:          <Zap size={22} />,
  cog:          <Cog size={22} />,
  construction: <HardHat size={22} />,
  car:          <Car size={22} />,
  sparkles:     <Sparkles size={22} />,
  shield:       <ShieldIcon size={22} />,
  users:        <Users size={22} />,
  briefcase:    <Briefcase size={22} />,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, selected: 0, rejected: 0 });
  const [candidates, setCandidates] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter]         = useState('all');
  const [jobFilter, setJobFilter]   = useState('all');
  const [allRoles, setAllRoles]     = useState([]); // dynamic roles from DB

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [compareSelection, setCompareSelection] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonData, setComparisonData] = useState([]);
  const dropdownRef = useRef(null);

  // ── Job Roles Tab State ──
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [addRoleMode, setAddRoleMode] = useState(null); // null | 'manual'
  const [parsingJd, setParsingJd] = useState(false);
  const jdInputRef = useRef(null);

  const [newRole, setNewRole] = useState({ name: '', description: '', iconKey: 'wrench' });
  const [addRoleError, setAddRoleError] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [editingRole, setEditingRole] = useState(null); // role being edited
  const [expandedRole, setExpandedRole] = useState(null); // role with attachments open
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const pdfInputRef = useRef(null);

  const toggleCompare = (id) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (compareSelection.length !== 2) return;
    try {
      const data = await Promise.all(compareSelection.map(id => api.get(`/candidates/${id}`).then(r => r.data)));
      setComparisonData(data);
      setShowCompareModal(true);
    } catch (err) { console.error(err); }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Search debounce ──
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/candidates/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setFetchError(null);
    try {
      const limit = tab === 'dashboard' ? 5 : 20;
      const params = { page, limit };
      if (filter !== 'all') params.status = filter;
      if (jobFilter !== 'all') params.job = jobFilter;
      if (search) params.search = search;
      const res = await api.get('/candidates', { params });
      setCandidates(res.data.candidates);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load candidates. Please refresh the page.');
    } finally {
      setLoadingCandidates(false);
    }
  }, [page, filter, jobFilter, search, tab]);

  // Fetch all (including inactive) dynamic roles for admin
  const fetchAllRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await api.get('/roles/all');
      setAllRoles(res.data);
    } catch (err) { console.error(err); }
    finally { setRolesLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (tab !== 'roles') fetchCandidates();
  }, [fetchCandidates, tab]);
  useEffect(() => {
    // Always fetch roles on mount so getRoleLabel() can resolve dynamic role IDs
    // to names in the candidates table (not just when the Roles tab is active)
    fetchAllRoles();
  }, [fetchAllRoles]);
  useEffect(() => {
    // Re-fetch roles when switching to the roles tab to pick up any changes
    if (tab === 'roles') fetchAllRoles();
  }, [tab, fetchAllRoles]);

  // ── Role CRUD ──
  const handleAddRole = async () => {
    try {
      setSavingRole(true);
      setAddRoleError('');
      const res = await api.post('/roles', newRole);
      setAllRoles(prev => [res.data.role, ...prev]);
      setShowAddRole(false);
      setAddRoleMode(null);
      setNewRole({ name: '', description: '', iconKey: 'wrench' });
    } catch (err) {
      setAddRoleError(err.response?.data?.error || 'Failed to create role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleJdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setAddRoleError('Only PDF files are supported for auto-extraction.');
      return;
    }

    try {
      setParsingJd(true);
      setAddRoleError('');
      const formData = new FormData();
      formData.append('pdf', file);
      
      const res = await api.post('/roles/parse-jd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewRole({
        name: res.data.name || '',
        description: res.data.description || '',
        iconKey: 'wrench' // user will choose manually
      });
      setAddRoleMode('manual');
    } catch (err) {
      console.error(err);
      setAddRoleError(err.response?.data?.error || 'Failed to parse JD. Please try manual entry.');
    } finally {
      setParsingJd(false);
      if (jdInputRef.current) jdInputRef.current.value = '';
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRole?.name?.trim()) return;
    setSavingRole(true);
    try {
      await api.patch(`/roles/${editingRole._id}`, {
        name: editingRole.name,
        description: editingRole.description,
        iconKey: editingRole.iconKey,
      });
      setEditingRole(null);
      fetchAllRoles();
    } catch (err) { console.error(err); }
    finally { setSavingRole(false); }
  };

  const handleToggleActive = async (role) => {
    try {
      await api.patch(`/roles/${role._id}`, { active: !role.active });
      fetchAllRoles();
    } catch (err) { console.error(err); }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete this role? This cannot be undone.')) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchAllRoles();
    } catch (err) { console.error(err); }
  };

  // ── PDF Attachments ──
  const handlePdfUpload = async (roleId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setAttachmentError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError('File too large. Max 10 MB.');
      return;
    }

    setUploadingPdf(true);
    setAttachmentError('');
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await api.post(`/roles/${roleId}/attachments`, {
          fileName: file.name,
          fileData: reader.result,
          mimeType: file.type,
        });
        fetchAllRoles();
      } catch (err) {
        setAttachmentError(err.response?.data?.error || 'Upload failed.');
      } finally {
        setUploadingPdf(false);
        if (pdfInputRef.current) pdfInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = (roleId, attId, fileName) => {
    const link = document.createElement('a');
    link.href = `${api.defaults.baseURL}/roles/${roleId}/attachments/${attId}`;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  };

  const handleDeleteAttachment = async (roleId, attId) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await api.delete(`/roles/${roleId}/attachments/${attId}`);
      fetchAllRoles();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/candidates/${id}/status`, { status });
      fetchCandidates();
      fetchStats();
      if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
    } catch (err) { console.error(err); }
  };

  const exportCSV = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (jobFilter !== 'all') params.job = jobFilter;
      const res = await api.get('/candidates/export/csv', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `innovision_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  const viewCandidate = async (id) => {
    try {
      const res = await api.get(`/candidates/${id}`);
      setSelected(res.data);
    } catch (err) { console.error(err); }
  };

  const scoreClass = (s) => s >= 70 ? 'score-high' : s >= 40 ? 'score-mid' : 'score-low';

  // Merged roles lookup (DB roles + legacy static roles)
  const getRoleLabel = (jobKey) => {
    const dbRole = allRoles.find(r => r._id === jobKey);
    return dbRole?.name || ROLES[jobKey] || jobKey;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <div className="admin-avatar">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{user?.displayName}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{user?.role}</div>
          </div>
        </div>
        {[
          { key: 'dashboard', label: 'Dashboard',    icon: <Users size={18} /> },
          { key: 'all',       label: 'All Candidates', icon: <Users size={18} /> },
          { key: 'pending',   label: 'Pending Review', icon: <Clock size={18} />, badge: stats.pending },
          { key: 'selected',  label: 'Selected',      icon: <CheckCircle size={18} /> },
          { key: 'rejected',  label: 'Rejected',      icon: <XCircle size={18} /> },
          { key: 'roles',     label: 'Job Roles',     icon: <Briefcase size={18} /> },
        ].map(item => (
          <div
            key={item.key}
            className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
            onClick={() => {
              setTab(item.key);
              if (item.key === 'dashboard') { setFilter('all'); }
              else if (item.key === 'all')  { setFilter('all'); }
              else if (item.key !== 'roles') { setFilter(item.key); }
              setPage(1);
              setSearch('');
            }}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ background: 'var(--brand-red)', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                {item.badge}
              </span>
            )}
          </div>
        ))}
        
        {/* Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', gap: '12px', boxShadow: '0 8px 24px rgba(209, 43, 43, 0.25)' }}
            onClick={logout}
          >
            <LogOut size={18} /> LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">

        {/* ══════════════ JOB ROLES TAB ══════════════ */}
        {tab === 'roles' ? (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Job Roles</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Manage available job roles displayed to candidates. Add or modify roles as needed.
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ gap: '8px' }}
                onClick={() => { setShowAddRole(true); setAddRoleMode(null); setAddRoleError(''); setNewRole({ name: '', description: '', iconKey: 'wrench' }); }}
              >
                <Plus size={16} /> Add Role
              </button>
            </div>

            {/* Add Role Form / Options */}
            {showAddRole && !addRoleMode && (
              <div style={{
                background: 'var(--surface2)',
                border: '1.5px solid var(--brand-red)',
                borderRadius: '16px',
                padding: '28px',
                marginBottom: '28px',
                animation: 'slide-up 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>How would you like to add a role?</h4>
                  <button onClick={() => setShowAddRole(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                    <XIcon size={18} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div 
                    style={{ flex: 1, padding: '24px', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: 'var(--white)', transition: 'transform 0.2s' }}
                    onClick={() => setAddRoleMode('manual')}
                  >
                    <div style={{ background: 'var(--brand-red-light)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand-red)' }}>
                      <Edit3 size={24} />
                    </div>
                    <h5 style={{ fontSize: '16px', marginBottom: '8px' }}>Manual Entry</h5>
                    <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Type in the role name and description yourself.</p>
                  </div>

                  <input type="file" accept="application/pdf" ref={jdInputRef} style={{ display: 'none' }} onChange={handleJdUpload} />
                  
                  <div 
                    style={{ flex: 1, padding: '24px', border: '1px solid var(--brand-red-glow)', borderRadius: '12px', textAlign: 'center', cursor: parsingJd ? 'wait' : 'pointer', background: 'var(--brand-red-light)', opacity: parsingJd ? 0.7 : 1, transition: 'transform 0.2s' }}
                    onClick={() => !parsingJd && jdInputRef.current?.click()}
                  >
                    <div style={{ background: 'var(--brand-red)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}>
                      {parsingJd ? <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <FileText size={24} />}
                    </div>
                    <h5 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--brand-red)' }}>{parsingJd ? 'Extracting with AI...' : 'Auto-Extract (AI)'}</h5>
                    <p style={{ fontSize: '13px', color: 'var(--brand-red)', opacity: 0.8 }}>Upload a Job Description PDF and let AI extract the details.</p>
                  </div>
                </div>

                {addRoleError && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '16px', textAlign: 'center', fontWeight: 500 }}>
                    {addRoleError}
                  </div>
                )}
              </div>
            )}

            {showAddRole && addRoleMode === 'manual' && (
              <div style={{
                background: 'var(--surface2)',
                border: '1.5px solid var(--brand-red)',
                borderRadius: '16px',
                padding: '28px',
                marginBottom: '28px',
                animation: 'slide-up 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Review & Save Role</h4>
                  <button onClick={() => { setShowAddRole(false); setAddRoleMode(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                    <XIcon size={18} />
                  </button>
                </div>

                <div className="form-grid" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Role Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Electrician, Mechanic, Fitter..."
                      value={newRole.name}
                      onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Icon</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ICON_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          title={opt.label}
                          className={`btn btn-sm ${newRole.iconKey === opt.key ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ padding: '8px 12px', gap: '6px' }}
                          onClick={() => setNewRole(p => ({ ...p, iconKey: opt.key }))}
                        >
                          {opt.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Description (optional)</label>
                    <textarea
                      className="form-input"
                      placeholder="Short description of the role..."
                      value={newRole.description}
                      onChange={e => setNewRole(p => ({ ...p, description: e.target.value }))}
                      style={{ minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {addRoleError && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>
                    {addRoleError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    className="btn btn-primary"
                    disabled={savingRole || !newRole.name.trim()}
                    onClick={handleAddRole}
                  >
                    {savingRole ? 'Saving...' : <><Save size={14} /> Save Role</>}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setAddRoleMode(null); setAddRoleError(''); }}>Back</button>
                </div>
              </div>
            )}

            {/* Roles List */}
            {rolesLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Loading roles...</div>
            ) : allRoles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                No roles yet. Click "Add Role" to create your first job role.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allRoles.map(role => (
                  <div
                    key={role._id}
                    style={{
                      background: 'var(--surface2)',
                      border: `1.5px solid ${role.active ? 'var(--border)' : 'rgba(100,116,139,0.2)'}`,
                      borderRadius: '14px',
                      padding: '20px 24px',
                      opacity: role.active ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    {editingRole?._id === role._id ? (
                      /* ── Edit Mode ── */
                      <div>
                        <div className="form-grid" style={{ gap: '12px', marginBottom: '14px' }}>
                          <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                              className="form-input"
                              value={editingRole.name}
                              onChange={e => setEditingRole(p => ({ ...p, name: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Icon</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {ICON_OPTIONS.map(opt => (
                                <button
                                  key={opt.key}
                                  type="button"
                                  title={opt.label}
                                  className={`btn btn-sm ${editingRole.iconKey === opt.key ? 'btn-primary' : 'btn-ghost'}`}
                                  style={{ padding: '7px 10px' }}
                                  onClick={() => setEditingRole(p => ({ ...p, iconKey: opt.key }))}
                                >
                                  {opt.icon}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="form-group full-width">
                            <label className="form-label">Description</label>
                            <input
                              className="form-input"
                              value={editingRole.description || ''}
                              onChange={e => setEditingRole(p => ({ ...p, description: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn btn-primary btn-sm" disabled={savingRole} onClick={handleSaveEdit}>
                            {savingRole ? 'Saving...' : <><Save size={13} /> Save</>}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingRole(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: role.active ? 'rgba(209,43,43,0.08)' : 'var(--surface)',
                            color: role.active ? 'var(--brand-red)' : 'var(--muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {ICON_RENDER[role.iconKey] || <Wrench size={22} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>{role.name}</div>
                            {role.description && (
                              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{role.description}</div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                                background: role.active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                                color: role.active ? '#059669' : '#64748b',
                                border: `1px solid ${role.active ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.2)'}`
                              }}>
                                {role.active ? '● Active' : '○ Inactive'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                                Other · {role.attachments?.length || 0} attachment{role.attachments?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              className="btn btn-sm btn-ghost"
                              title={role.active ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleActive(role)}
                              style={{ gap: '6px' }}
                            >
                              {role.active ? <ToggleRight size={16} style={{ color: '#059669' }} /> : <ToggleLeft size={16} />}
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="Edit role"
                              onClick={() => setEditingRole({ ...role })}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="Manage attachments"
                              style={{ gap: '5px' }}
                              onClick={() => setExpandedRole(expandedRole === role._id ? null : role._id)}
                            >
                              <Paperclip size={14} /> PDF
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="Delete role"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeleteRole(role._id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* ── Attachments Accordion ── */}
                        {expandedRole === role._id && (
                          <div style={{
                            marginTop: '20px',
                            paddingTop: '20px',
                            borderTop: '1px solid var(--border)',
                            animation: 'slide-up 0.25s ease'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                                <Paperclip size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                PDF Attachments
                              </h5>
                              <label
                                htmlFor={`pdf-upload-${role._id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 14px', borderRadius: '8px',
                                  background: 'var(--brand-red)', color: '#fff',
                                  fontSize: '12px', fontWeight: 700, cursor: uploadingPdf ? 'not-allowed' : 'pointer',
                                  opacity: uploadingPdf ? 0.6 : 1, transition: 'opacity 0.2s'
                                }}
                              >
                                <Upload size={13} />
                                {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                              </label>
                              <input
                                id={`pdf-upload-${role._id}`}
                                ref={pdfInputRef}
                                type="file"
                                accept="application/pdf"
                                style={{ display: 'none' }}
                                onChange={e => handlePdfUpload(role._id, e)}
                                disabled={uploadingPdf}
                              />
                            </div>

                            {attachmentError && (
                              <div style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '10px', fontWeight: 500 }}>
                                {attachmentError}
                              </div>
                            )}

                            {!role.attachments || role.attachments.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: '13px' }}>
                                No attachments yet. Upload a PDF (job description, brochure, offer letter).
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {role.attachments.map(att => (
                                  <div
                                    key={att._id}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '12px',
                                      background: 'var(--surface)', borderRadius: '10px',
                                      padding: '10px 14px', border: '1px solid var(--border)'
                                    }}
                                  >
                                    <FileText size={16} style={{ color: 'var(--brand-red)', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {att.fileName}
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                                        {att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                      </div>
                                    </div>
                                    <button
                                      className="btn btn-sm btn-ghost"
                                      style={{ gap: '5px' }}
                                      onClick={() => handleDownloadPdf(role._id, att._id, att.fileName)}
                                    >
                                      <Download size={13} /> Download
                                    </button>
                                    <button
                                      className="btn btn-sm btn-ghost"
                                      style={{ color: 'var(--danger)' }}
                                      onClick={() => handleDeleteAttachment(role._id, att._id)}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ══════════════ CANDIDATES TABS ══════════════ */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
                  {tab === 'dashboard' ? 'Dashboard' : tab === 'all' ? 'All Candidates' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Welcome back, {user?.displayName}. Manage international deployment candidates.
                </p>
              </div>
              <button onClick={exportCSV} className="btn btn-ghost btn-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>

            {/* Stats */}
            {tab === 'dashboard' && (
              <div className="stats-grid">
                {[
                  { label: 'Total Candidates', value: stats.total,    icon: <Users size={18} />,        key: 'all' },
                  { label: 'Pending Review',   value: stats.pending,  icon: <Clock size={18} />,        color: '#d97706', key: 'pending' },
                  { label: 'Selected',          value: stats.selected, icon: <CheckCircle size={18} />,  color: '#059669', key: 'selected' },
                  { label: 'Rejected',          value: stats.rejected, icon: <XCircle size={18} />,      color: '#dc2626', key: 'rejected' },
                ].map((s, i) => (
                  <div 
                    className="stat-card" 
                    key={i} 
                    onClick={() => { setTab(s.key); setFilter(s.key); setPage(1); setSearch(''); }}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s', border: tab === s.key ? '1px solid var(--brand-red)' : '1px solid var(--border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="stat-label" style={{ color: s.color || 'var(--muted)' }}>{s.icon} {s.label}</div>
                    <div className="stat-value">{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name, phone, city..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              <div className="custom-select-container" ref={dropdownRef}>
                <div 
                  className={`select-trigger ${isDropdownOpen ? 'active' : ''}`} 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{jobFilter === 'all' ? 'All Roles' : (getRoleLabel(jobFilter))}</span>
                  <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {isDropdownOpen && (
                  <div className="select-menu">
                    <div 
                      className={`select-option ${jobFilter === 'all' ? 'selected' : ''}`}
                      onClick={() => { setJobFilter('all'); setPage(1); setIsDropdownOpen(false); }}
                    >
                      All Roles
                    </div>
                    {/* Static legacy roles */}
                    {Object.entries(ROLES).map(([k, v]) => (
                      <div 
                        key={k} 
                        className={`select-option ${jobFilter === k ? 'selected' : ''}`}
                        onClick={() => { setJobFilter(k); setPage(1); setIsDropdownOpen(false); }}
                      >
                        {v}
                      </div>
                    ))}
                    {/* Dynamic roles from DB */}
                    {allRoles.map(r => (
                      <div
                        key={r._id}
                        className={`select-option ${jobFilter === r._id ? 'selected' : ''}`}
                        onClick={() => { setJobFilter(r._id); setPage(1); setIsDropdownOpen(false); }}
                      >
                        {r.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {compareSelection.length === 2 && (
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'var(--brand-red)', boxShadow: '0 8px 16px var(--brand-red-glow)' }}
                  onClick={handleCompare}
                >
                  Compare Selected (2)
                </button>
              )}
            </div>

            {/* Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingCandidates ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        Loading candidates...
                      </div>
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)', fontWeight: 500 }}>
                      {fetchError}
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No candidates found</td></tr>
                ) : candidates.map(c => (
                  <tr key={c._id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={compareSelection.includes(c._id)}
                        onChange={() => toggleCompare(c._id)}
                        disabled={!compareSelection.includes(c._id) && compareSelection.length >= 2}
                        style={{ cursor: 'pointer', accentColor: 'var(--brand-red)' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                          {(c.firstName?.[0] || '?') + (c.lastName?.[0] || '')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.firstName} {c.lastName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.phone} · {c.city}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{getRoleLabel(c.job)}</td>
                    <td>
                      {c.assessmentStatus === 'form_submitted' ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', borderRadius: '20px',
                          background: 'rgba(100,116,139,0.1)',
                          color: '#64748b', fontSize: '11px', fontWeight: 700,
                          border: '1px solid rgba(100,116,139,0.2)', letterSpacing: '0.04em'
                        }}>Form Only</span>
                      ) : (
                        <span className={`score-chip ${scoreClass(c.scores?.total || 0)}`}>{c.scores?.total || 0}/100</span>
                      )}
                    </td>
                    <td><span className={`status-pill status-${c.status}`}>{c.status === 'selected' ? 'Accepted' : c.status}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => viewCandidate(c._id)}><Eye size={14} /> View</button>
                        {c.status === 'pending' && (
                          <>
                            <button className="btn-action-tick" onClick={() => updateStatus(c._id, 'selected')} title="Select Candidate"><Check size={16} /></button>
                            <button className="btn-action-x" onClick={() => updateStatus(c._id, 'rejected')} title="Reject Candidate"><X size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
                <span style={{ padding: '6px 16px', fontSize: '13px', color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Candidate Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px' }}>{selected.firstName} {selected.lastName}</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  {getRoleLabel(selected.job)} · Ref: {selected.refId} · {new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>

            {/* Full Skill Distribution */}
            <div className="skill-grid">
              {['reading', 'voice', 'quality'].map(key => {
                const val = selected.scores?.[key] || 0;
                const statusClass = val >= 70 ? 'high' : val >= 40 ? 'mid' : 'low';
                return (
                  <div key={key} className="skill-card">
                    <div className="skill-header">
                      <div className="skill-label">{key} Score</div>
                      <div className="skill-value">{val}%</div>
                    </div>
                    <div className="skill-bar">
                      <div className={`skill-fill ${statusClass}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="skill-card" style={{ background: 'var(--brand-red-light)', borderColor: 'var(--brand-red-glow)' }}>
                <div className="skill-header">
                  <div className="skill-label" style={{ color: 'var(--brand-red)' }}>Overall Fit</div>
                  <div className="skill-value" style={{ color: 'var(--brand-red)' }}>{selected.scores?.total || 0}%</div>
                </div>
                <div className="skill-bar" style={{ background: 'rgba(209, 43, 43, 0.1)' }}>
                  <div className="skill-fill" style={{ width: `${selected.scores?.total || 0}%`, background: 'var(--brand-red)' }} />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            {/* Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Experience', `${selected.experience} yr(s)`],
                ['Passport', selected.passport || '—'],
                ['Education', selected.education || '—'],
                ['Languages', selected.languages],
                ['Overseas Exp.', selected.gulfExp || '—'],
                ['DOB', selected.dob || '—'],
                ['Height', selected.height || '—'],
                ['Source', selected.source],
                ['Status', selected.status],
                ['Assessment', selected.assessmentStatus === 'form_submitted' ? '📋 Form Submitted (No Test)' : '✅ Assessment Completed'],
                ['Violations', selected.proctoringViolations || 0]
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            {/* Q&A */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Assessment Responses
            </div>
            {(selected.questions || []).map((q, i) => {
              const answer = selected.answers instanceof Map ? selected.answers.get(q.id) : selected.answers?.[q.id];
              const audio = selected.audioRecordings instanceof Map ? selected.audioRecordings.get(q.id) : selected.audioRecordings?.[q.id];
              const ev = selected.evaluations instanceof Map ? selected.evaluations.get(q.id) : selected.evaluations?.[q.id];
              return (
                <div key={i} style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="q-number" style={{ width: '24px', height: '24px', fontSize: '11px' }}>Q{i+1}</span>
                    <span className={`q-badge ${q.type}`}>{q.type}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px', lineHeight: '1.6' }}>{q.question}</div>
                  {q.expectedAnswer && (
                    <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '8px' }}>
                      <strong>Expected:</strong> {q.expectedOption ? `${q.expectedOption}. ` : ''}{q.expectedAnswer}
                    </div>
                  )}
                  {answer ? (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                        Candidate Answer
                        {ev && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '6px', background: ev.matched ? 'var(--success)' : 'var(--danger)', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                                {ev.matched ? 'QUALIFIED' : 'REVIEW REQ.'} {typeof ev.score === 'number' ? ` ${Math.round(ev.score * 100)}%` : ''}
                              </span>
                              {ev.details?.variety && (
                                <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'var(--info)', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                                  VARIETY: {ev.details.variety}%
                                </span>
                              )}
                              {ev.details?.keywordCount !== undefined && (
                                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#4c1d95', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                                  THEMES: {ev.details.keywordCount}/{ev.details.totalKeywords}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-red)', fontWeight: 600, background: 'rgba(209,43,43,0.05)', padding: '8px', borderRadius: '6px', borderLeft: '3px solid var(--brand-red)' }}>
                              {ev.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '10px', color: 'var(--text)' }}>"{answer}"</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No answer provided</div>
                  )}
                  {audio && (
                    <audio controls src={audio} style={{ width: '100%', height: '36px', marginTop: '10px' }} />
                  )}
                </div>
              );
            })}

            {/* Actions */}
            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  className="btn-action-tick" 
                  style={{ width: 'auto', padding: '0 24px', height: '44px', gap: '8px' }}
                  onClick={() => { updateStatus(selected._id, 'selected'); setSelected(null); }}
                >
                  <Check size={18} /> SELECT
                </button>
                <button 
                  className="btn-action-x" 
                  style={{ width: 'auto', padding: '0 24px', height: '44px', gap: '8px' }}
                  onClick={() => { updateStatus(selected._id, 'rejected'); setSelected(null); }}
                >
                  <X size={18} /> REJECT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '90vw' }}>
            <div className="modal-header">
              <h2>Candidate Comparison</h2>
              <button className="btn-action-x" onClick={() => setShowCompareModal(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {comparisonData.map((cand, idx) => (
                <div key={cand._id} style={{ borderRight: idx === 0 ? '1px solid var(--border)' : 'none', paddingRight: idx === 0 ? '32px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                      {(cand.firstName?.[0] || '?') + (cand.lastName?.[0] || '')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{cand.firstName} {cand.lastName}</h3>
                      <div className={`status-pill status-${cand.status}`} style={{ display: 'inline-block' }}>{cand.status}</div>
                    </div>
                  </div>

                  <div className="section-tag">Assessment Results</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                    <div className="modal-score" style={{ marginBottom: 0 }}>
                      <div className="score-val">{cand.scores?.total || 0}</div>
                      <div className="score-label">Overall Proficiency Score</div>
                    </div>
                    {cand.proctoringViolations > 0 && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '8px', color: 'var(--danger)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <Info size={14} /> {cand.proctoringViolations} Integrity Violations Recorded
                      </div>
                    )}
                  </div>

                  <div className="skill-grid" style={{ marginBottom: '24px' }}>
                    {[
                      { label: 'Reading Accuracy', val: cand.scores?.reading },
                      { label: 'Voice Flow/WER', val: cand.scores?.voice },
                      { label: 'Quality & Lexical', val: cand.scores?.quality }
                    ].map((s, i) => (
                      <div className="skill-card" key={i}>
                        <div className="skill-header">
                          <span className="skill-label">{s.label}</span>
                          <span className="skill-value">{s.val}%</span>
                        </div>
                        <div className="skill-bar">
                          <div className={`skill-fill ${s.val >= 70 ? 'high' : s.val >= 40 ? 'mid' : 'low'}`} style={{ width: `${s.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'var(--surface2)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                    <div className="section-tag" style={{ marginBottom: '12px' }}>Personal Profile</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                      <div><div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Role</div><div>{getRoleLabel(cand.job)}</div></div>
                      <div><div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Experience</div><div>{cand.experience} yrs</div></div>
                      <div><div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Languages</div><div>{cand.languages}</div></div>
                      <div><div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Violations</div><div style={{ color: cand.proctoringViolations > 0 ? 'var(--danger)' : 'inherit' }}>{cand.proctoringViolations || 0}</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
