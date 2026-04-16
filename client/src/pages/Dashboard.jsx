import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Users, Clock, CheckCircle, XCircle, Search, Download, Eye, Check, X, ChevronLeft, ChevronRight, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

const ROLES = {
  driver: 'Taxi Driver',
  security: 'Security Guard',
  housekeeping: 'Housekeeping',
  supervisor: 'Field Supervisor',
  helper: 'General Helper'
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, selected: 0, rejected: 0 });
  const [candidates, setCandidates] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [compareSelection, setCompareSelection] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonData, setComparisonData] = useState([]);
  const dropdownRef = useRef(null);

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

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/candidates/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCandidates = useCallback(async () => {
    try {
      const limit = tab === 'dashboard' ? 5 : 20;
      const params = { page, limit };
      if (filter !== 'all') params.status = filter;
      if (jobFilter !== 'all') params.job = jobFilter;
      if (search) params.search = search;
      const res = await api.get('/candidates', { params });
      setCandidates(res.data.candidates);
      setTotalPages(res.data.pages);
    } catch (err) { console.error(err); }
  }, [page, filter, jobFilter, search, tab]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

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
          { key: 'dashboard', label: 'Dashboard', icon: <Users size={18} /> },
          { key: 'all', label: 'All Candidates', icon: <Users size={18} /> },
          { key: 'pending', label: 'Pending Review', icon: <Clock size={18} />, badge: stats.pending },
          { key: 'selected', label: 'Selected', icon: <CheckCircle size={18} /> },
          { key: 'rejected', label: 'Rejected', icon: <XCircle size={18} /> },
        ].map(item => (
          <div
            key={item.key}
            className={`sidebar-item ${tab === item.key ? 'active' : ''}`}
            onClick={() => {
              setTab(item.key);
              if (item.key === 'dashboard') { setFilter('all'); }
              else if (item.key === 'all') { setFilter('all'); }
              else { setFilter(item.key); }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
              {tab === 'dashboard' ? 'Dashboard' : tab === 'all' ? 'All Candidates' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Welcome back, {user?.displayName}. Manage UAE deployment candidates.
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
              { label: 'Total Candidates', value: stats.total, icon: <Users size={18} />, key: 'all' },
              { label: 'Pending Review', value: stats.pending, icon: <Clock size={18} />, color: '#d97706', key: 'pending' },
              { label: 'Selected for UAE', value: stats.selected, icon: <CheckCircle size={18} />, color: '#059669', key: 'selected' },
              { label: 'Rejected', value: stats.rejected, icon: <XCircle size={18} />, color: '#dc2626', key: 'rejected' },
            ].map((s, i) => (
              <div 
                className="stat-card" 
                key={i} 
                onClick={() => {
                  setTab(s.key);
                  setFilter(s.key);
                  setPage(1);
                  setSearch('');
                }}
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
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>


          <div className="custom-select-container" ref={dropdownRef}>
            <div 
              className={`select-trigger ${isDropdownOpen ? 'active' : ''}`} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{jobFilter === 'all' ? 'All Roles' : ROLES[jobFilter]}</span>
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
                {Object.entries(ROLES).map(([k, v]) => (
                  <div 
                    key={k} 
                    className={`select-option ${jobFilter === k ? 'selected' : ''}`}
                    onClick={() => { setJobFilter(k); setPage(1); setIsDropdownOpen(false); }}
                  >
                    {v}
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
            {candidates.length === 0 ? (
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
                <td style={{ fontSize: '13px' }}>{ROLES[c.job] || c.job}</td>
                <td><span className={`score-chip ${scoreClass(c.scores?.total || 0)}`}>{c.scores?.total || 0}/100</span></td>
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
      </main>

      {/* Candidate Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px' }}>{selected.firstName} {selected.lastName}</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  {ROLES[selected.job] || selected.job} · Ref: {selected.refId} · {new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                ['Experience', `${selected.experience} yr(s)`], ['Passport', selected.passport || '—'],
                ['Education', selected.education || '—'], ['Languages', selected.languages],
                ['Gulf Exp.', selected.gulfExp || '—'], ['Source', selected.source], ['Status', selected.status],
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
              const audioKey = q.id + '_audio';
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
                              <span style={{ 
                                padding: '3px 8px', 
                                borderRadius: '6px', 
                                background: ev.matched ? 'var(--success)' : 'var(--danger)', 
                                color: '#fff', 
                                fontSize: '10px',
                                fontWeight: 700
                              }}>
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
                  <Check size={18} /> SELECT FOR UAE
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
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      color: 'var(--danger)', 
                      fontSize: '12px', 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
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
                      <div><div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Role</div><div>{ROLES[cand.job]}</div></div>
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
