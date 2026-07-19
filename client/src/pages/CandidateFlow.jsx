import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mic, MicOff, ChevronRight, ChevronLeft, Shield, Building2, ShieldCheck, Wrench, Flag, RotateCcw, Send, CheckCircle, AlertCircle, Info, Maximize, ChevronDown, AlertTriangle, Zap, Cog, HardHat, Car, Sparkles, Users, Briefcase, FileText, X as XIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Footer from '../components/Footer';
import { COUNTRY_CODES } from '../utils/countryCodes';



const ICON_RENDER = {
  wrench:       <Wrench size={22} />,
  zap:          <Zap size={22} />,
  cog:          <Cog size={22} />,
  construction: <HardHat size={22} />,
  car:          <Car size={22} />,
  sparkles:     <Sparkles size={22} />,
  shield:       <Shield size={22} />,
  users:        <Users size={22} />,
  briefcase:    <Briefcase size={22} />,
};


const SOURCES = ['Direct / Walk-in', 'Job Portal', 'Social Media', 'Referral', 'Agent', 'WhatsApp'];

const VALIDATION_RULES = {
  firstName:  { regex: /^[A-Za-z\s]{2,30}$/,      error: 'Please enter a valid name.' },
  lastName:   { regex: /^[A-Za-z\s]{2,30}$/,      error: 'Please enter a valid name.' },
  phone:      { regex: /^[\+\-\s0-9]{10,18}$/,    error: 'Please enter a valid phone.' },
  email:      { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, error: 'Please enter a valid email.' },
  city:       { regex: /^[A-Za-z0-9\s\-\,]{2,50}$/, error: 'Please enter a valid city.' },
  experience: { regex: /^[0-9]{1,2}$/,             error: 'Please enter numbers only.' },
};

export default function CandidateFlow() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();

  const [dynamicRoles, setDynamicRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [pdfModal, setPdfModal] = useState(null); // { url, title, attachments }

  // Derive base URL for PDF links (no /api suffix)
  const apiBaseUrl = import.meta.env.PROD ? '' : 'http://localhost:5000';

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setDynamicRoles(res.data);
      } catch (err) {
        console.error('Failed to fetch dynamic roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const initialRole    = params.get('role')    || '';
  const initialSubRole = params.get('subRole') || '';

  // If both role + subRole are in URL, skip directly to form (step 1)
  const [step, setStep] = useState(initialRole && initialSubRole ? 1 : 0);

  const handleStepChange = (newStep) => {
    if (!document.startViewTransition) { setStep(newStep); window.scrollTo(0, 0); return; }
    document.startViewTransition(() => { setStep(newStep); window.scrollTo(0, 0); });
  };

  const handleQChange = (newQ) => {
    if (!document.startViewTransition) { setCurrentQ(newQ); return; }
    document.startViewTransition(() => setCurrentQ(newQ));
  };

  const [selectedRole,    setSelectedRole]    = useState(initialRole);
  const [selectedSubRole, setSelectedSubRole] = useState(initialSubRole);
  const [expandedRole,    setExpandedRole]    = useState(null);

  // Personal details (international fields)
  const [form, setForm] = useState({
    firstName: '', lastName: '', countryCode: '+91', phone: '', email: '',
    experience: '', education: '', languages: '', source: '',
    // international fields
    city: '', passport: '', gulfExp: '', applyingCountry: '', dob: '', height: '',
  });
  const [touched, setTouched] = useState({});

  const handleInputChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  const getFieldError = (key) => {
    const value = form[key];
    if (!value && !['firstName', 'lastName', 'phone', 'city'].includes(key)) return null;
    const rule = VALIDATION_RULES[key];
    if (rule && value && !rule.regex.test(value)) {
      return rule.error;
    }
    return null;
  };

  const isFormValid = () => {
    const required = ['firstName','lastName','phone','email','city','experience','passport','education','languages','gulfExp','applyingCountry','dob','height'];
    const hasRequired = required.every(key => form[key]?.trim().length >= 1);
    const hasNoErrors = Object.keys(VALIDATION_RULES).every(key => !getFieldError(key));
    return hasRequired && hasNoErrors;
  };
  
  // Custom dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-select-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Assessment state
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [audioRecordings, setAudioRecordings] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const speechRecRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioStreamRef = useRef(null);
  const activeVoiceStateRef = useRef({ baseText: '', accumulated: '' });
  
  // Results
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [dupError, setDupError] = useState('');
  // 'form_submitted' = form done, test not yet taken | 'assessment_submitted' = test already done
  const [dupStatus, setDupStatus] = useState('');
  // retest request state: '' | 'pending' | 'approved' | 'rejected'
  const [retestPending, setRetestPending] = useState('');
  const [isFull, setIsFull] = useState(false);
  const [reviewed, setReviewed] = useState(new Set());
  const [resetsRemaining, setResetsRemaining] = useState(2);
  const [violations, setViolations] = useState({ tabSwitches: 0, fullscreenExits: 0 });
  const lastViolationRef = useRef(0);
  const handleSubmitRef = useRef(null);

  // ── Form submission state (separate from assessment) ──
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [candidateId, setCandidateId] = useState(null);
  const [formRefId, setFormRefId] = useState('');
  const [retestReason, setRetestReason] = useState('');

  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // ── OFFLINE RECOVERY: Load from LocalStorage ──
  useEffect(() => {
    const draft = localStorage.getItem('candidate_draft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.form?.firstName || data.answers) {
          setShowResumePrompt(true);
        }
      } catch (e) { console.error('Draft parse failed:', e); }
    }
  }, []);

  const handleResume = () => {
    const draft = localStorage.getItem('candidate_draft');
    if (draft) {
      const data = JSON.parse(draft);
      if (data.form) setForm(data.form);
      if (data.selectedRole)    setSelectedRole(data.selectedRole);
      if (data.selectedSubRole) setSelectedSubRole(data.selectedSubRole);
      setStep(Math.min(data.step || 0, 1));
      if (data.answers) setAnswers(data.answers);
      if (data.currentQ !== undefined) setCurrentQ(data.currentQ);
    }
    setShowResumePrompt(false);
  };

  const clearDraft = () => {
    localStorage.removeItem('candidate_draft');
    setShowResumePrompt(false);
  };

  // ── OFFLINE RECOVERY: Auto-Sync ──
  useEffect(() => {
    if (step > 0 && step < 3) {
      const draft = { form, selectedRole, selectedSubRole, step, answers, currentQ };
      localStorage.setItem('candidate_draft', JSON.stringify(draft));
    }
  }, [form, selectedRole, selectedSubRole, step, answers, currentQ]);

  const handleReset = (qid) => {
    if (resetsRemaining <= 0) return;

    if (speechRecRef.current) {
      try { speechRecRef.current.stop(); } catch(e){}
    }
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      try { mediaRecRef.current.stop(); } catch(e){}
    }
    setIsRecording(false);

    activeVoiceStateRef.current = { baseText: '', accumulated: '' };

    setAnswers(prev => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
    setAudioRecordings(prev => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
    setResetsRemaining(prev => prev - 1);
  };

  const toggleReview = (idx) => {
    setReviewed(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const getQuestionStatus = (idx) => {
    const q = questions[idx];
    const qid = q?.qid || q?.id;
    if (reviewed.has(idx)) return 'review';
    if (answers[qid]) return 'answered';
    return 'unanswered';
  };

  // Handle Fullscreen Events and Navbar Hiding
  useEffect(() => {
    const handleViolation = (type) => {
      if (step !== 2) return;
      const now = Date.now();
      if (now - lastViolationRef.current < 2000) return;
      lastViolationRef.current = now;

      setViolations(prev => ({
        ...prev,
        [type === 'tab' ? 'tabSwitches' : 'fullscreenExits']: prev[type === 'tab' ? 'tabSwitches' : 'fullscreenExits'] + 1
      }));
    };

    const checkFS = () => {
      const apiFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      const isF11 = window.innerHeight >= window.screen.height - 2;
      const full = apiFull || isF11;

      if (isFull && !full && step === 2) {
        handleViolation('fs');
      }
      setIsFull(full);
    };
    
    const handleBlur = () => {
      if (step === 2 && document.hidden) handleViolation('tab');
    };
    
    const handleVisibility = () => {
      if (document.hidden) handleViolation('tab');
    };
    
    document.addEventListener('fullscreenchange', checkFS);
    document.addEventListener('webkitfullscreenchange', checkFS);
    document.addEventListener('mozfullscreenchange', checkFS);
    document.addEventListener('MSFullscreenChange', checkFS);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', checkFS);
    
    checkFS();
    
    if (step === 2) {
      document.body.classList.add('hide-navbar');
    } else {
      document.body.classList.remove('hide-navbar');
    }

    return () => {
      document.removeEventListener('fullscreenchange', checkFS);
      document.removeEventListener('webkitfullscreenchange', checkFS);
      document.removeEventListener('mozfullscreenchange', checkFS);
      document.removeEventListener('MSFullscreenChange', checkFS);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', checkFS);
      document.body.classList.remove('hide-navbar');
    };
  }, [isFull, step]);

  const enterFS = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  // Pre-warm microphone when assessment starts
  useEffect(() => {
    if (step === 2 && !audioStreamRef.current) {
      navigator.mediaDevices?.getUserMedia({ audio: true })
        .then(stream => { audioStreamRef.current = stream; })
        .catch(() => {});
    }
  }, [step]);

  // Keep ref in sync so the timer's stale closure always calls the latest handleSubmit
  useEffect(() => { handleSubmitRef.current = handleSubmit; });

  // Timer — only restarts when step changes
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(id); handleSubmitRef.current?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Exit fullscreen helper
  const exitFS = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  };

  // ── Submit form details to DB ──
  const submitForm = async () => {
    // Allow re-entry only when in retest mode (dupError cleared before calling)
    if (submittingForm) return;
    setSubmittingForm(true);
    setFormError('');
    try {
      const personal = {
        ...form,
        phone: `${form.countryCode} ${form.phone}`,
      };
      const res = await api.post('/candidates/submit-form', {
        personal,
        job: selectedSubRole || selectedRole,
        source: form.source || 'Direct',
        type: 'international',
        retestReason
      });
      const data = res.data;

      // Retest request submitted — waiting for admin
      if (data.retestStatus === 'pending') {
        setCandidateId(data.candidateId);
        setFormRefId(data.refId);
        setRetestPending('pending');
        setDupError(''); // keep dupStatus for UI context
        return;
      }

      // Normal fresh submission
      setCandidateId(data.candidateId);
      setFormRefId(data.refId);
      setFormSubmitted(true);
      setDupStatus('');
      setRetestPending('');
      setResult({ refId: data.refId });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        const data = err.response.data;
        if (data.assessmentStatus === 'form_submitted') {
          // Form already submitted but test not taken — let them proceed
          setCandidateId(data.candidateId);
          setFormRefId(data.refId);
          setFormSubmitted(true);
          setDupStatus('form_submitted');
          setFormError(`Form already submitted (Ref: ${data.refId}). You can now start the assessment.`);
        } else if (data.retestStatus === 'pending') {
          // Already has a pending retest request
          setCandidateId(data.candidateId);
          setRetestPending('pending');
          setDupStatus('assessment_submitted');
        } else if (data.retestStatus === 'approved') {
          // Admin already approved the retest — let them proceed
          setCandidateId(data.candidateId);
          setFormRefId(data.refId);
          setFormSubmitted(true);
          setRetestPending('approved');
          setDupStatus('');
          setDupError('');
          setFormError('Retest approved! You can now start the assessment.');
        } else if (data.retestStatus === 'rejected') {
          // Admin rejected retest
          setCandidateId(data.candidateId);
          setRetestPending('rejected');
          setDupStatus('assessment_submitted');
          setDupError(data.message || 'Your retest request was rejected by the admin.');
        } else {
          // Test completed, no retest status — hard block
          setCandidateId(data.candidateId);
          setDupStatus('assessment_submitted');
          setDupError(data.message || 'You have already applied for this role. Only one attempt is permitted.');
        }
      } else {
        setFormError('Failed to submit form. Please check your connection and try again.');
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  // Poll for retest status if pending
  useEffect(() => {
    let intervalId;
    if (retestPending === 'pending' && candidateId) {
      intervalId = setInterval(async () => {
        try {
          const res = await api.get(`/candidates/retest-status/${candidateId}`);
          if (res.data.retestStatus === 'approved') {
            setRetestPending('approved');
            setFormSubmitted(true);
            setDupStatus('');
            setDupError('');
            setFormError('Retest approved! You can now start the assessment.');
          } else if (res.data.retestStatus === 'rejected') {
            setRetestPending('rejected');
            setDupError('Your retest request was rejected by the admin.');
          }
        } catch (err) {
          // ignore network errors for polling
        }
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [retestPending, candidateId]);

  // Fetch questions when starting assessment
  const startAssessment = async () => {
    setValidating(true);
    try {
      const res = await api.get('/questions', { params: { role: selectedRole, roleName: selectedRole } });
      setQuestions(res.data);
      const time = 25 * 60;
      setTimeLeft(time);
      setTotalTime(time);
      handleStepChange(2);
    } catch (err) {
      console.error(err);
      exitFS();
      alert('Failed to load questions. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Voice recording toggle
  const toggleVoice = useCallback((qid) => {
    if (isRecording) {
      speechRecRef.current?.stop();
      if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (audioStreamRef.current) {
      try {
        const mr = new MediaRecorder(audioStreamRef.current, { mimeType: 'audio/webm;codecs=opus' });
        const chunks = [];
        mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            setAudioRecordings(prev => ({ ...prev, [qid]: reader.result }));
          };
        };
        mr.start();
        mediaRecRef.current = mr;
      } catch (e) { console.warn('MediaRecorder failed:', e); }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    
    activeVoiceStateRef.current = { baseText: answers[qid] || '', accumulated: '' };
    
    rec.onresult = (e) => {
      let fin = '', inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        let best = e.results[i][0];
        if (e.results[i].isFinal) fin += best.transcript;
        else inter += best.transcript;
      }
      if (fin) activeVoiceStateRef.current.accumulated += fin;
      
      const { baseText, accumulated } = activeVoiceStateRef.current;
      const sep = baseText && !baseText.endsWith(' ') ? ' ' : '';
      setAnswers(prev => ({ ...prev, [qid]: baseText + sep + accumulated + inter }));
    };
    
    rec.onend = () => {
      const { baseText, accumulated } = activeVoiceStateRef.current;
      const sep = baseText && !baseText.endsWith(' ') ? ' ' : '';
      setAnswers(prev => ({ ...prev, [qid]: baseText + sep + accumulated }));
      setIsRecording(false);
      if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop();
    };
    
    rec.onerror = (ev) => {
      if (ev.error !== 'no-speech') setIsRecording(false);
    };
    
    rec.start();
    speechRecRef.current = rec;
    setIsRecording(true);
  }, [isRecording, answers]);

  // Submit assessment
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const payload = {
        personal: form,
        job: selectedRole,
        source: form.source || 'Direct',
        questions,
        answers,
        audioRecordings,
        proctoring: violations,
        ...(candidateId ? { candidateId } : {})
      };
      const res = await api.post('/candidates', payload);
      setResult(res.data);
      localStorage.removeItem('candidate_draft');
      exitFS();
      handleStepChange(3);
    } catch (err) {
      console.error(err);
      exitFS();
      if (err.response?.status === 409) {
        setSubmitError({
          title: 'Duplicate Application',
          message: err.response.data.message || 'You have already completed the assessment for this role.',
          refId: err.response.data.refId || 'N/A',
          isDuplicate: true
        });
      } else {
        setSubmitError({
          title: 'Submission Failed',
          message: 'An unexpected error occurred while saving your assessment. Please check your internet connection and try again.',
          isDuplicate: false
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── STEP 0: Role Selection ──
  if (step === 0) {
    return (
      <div className="page-wrapper" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
        {/* Resume prompt overlay */}
        {showResumePrompt && (
          <div className="submitting-overlay">
            <div className="submitting-card" style={{ maxWidth: '440px', padding: '40px' }}>
              <div className="submitting-icon" style={{ color: 'var(--brand-red)' }}>
                <RotateCcw size={64} />
              </div>
              <h2 className="submitting-title">Resume Previous Session?</h2>
              <p className="submitting-text">We found a saved draft of your application. Would you like to continue from where you left off? Your form answers are preserved.</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleResume}>
                  YES, RESUME
                </button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={clearDraft}>
                  START NEW
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="section" style={{ paddingTop: '40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="section-tag">Step 1 of 3</div>
            <h2>Select Your Role</h2>
            <p className="section-sub">Choose a category and select the role that matches your skills.
          {loadingRoles ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Loading roles...
            </div>
          ) : (
            <div className="roles-grid" style={{ animation: 'fade-in-page 0.35s ease' }}>
              {dynamicRoles.map(role => (
                <div key={role._id} style={{ display: 'flex', flexDirection: 'column', gap: '0', height: '100%' }}>
                  {/* Main role card */}
                  <div
                    className={`role-card domestic-role-card ${expandedRole === role._id ? 'selected' : ''}`}
                    onClick={() => {
                      if (role.subRoles && role.subRoles.length > 0) {
                        setExpandedRole(prev => prev === role._id ? null : role._id);
                      } else {
                        setSelectedRole(role._id);
                        setSelectedSubRole(role._id);
                        setStep(2);
                      }
                    }}
                    style={{ cursor: 'pointer', userSelect: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <div className="role-card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ICON_RENDER[role.iconKey] || ICON_RENDER['wrench']}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', flex: 1 }}>{role.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {role.attachments && role.attachments.length > 0 && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setPdfModal({
                                title: role.name,
                                attachments: role.attachments.map(att => ({
                                  label: att.fileName,
                                  url: `${apiBaseUrl}/api/roles/${role._id}/attachments/${att._id}`
                                }))
                              });
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              background: 'var(--brand-red)', color: '#fff',
                              border: 'none', borderRadius: '6px',
                              fontSize: '11px', fontWeight: 700,
                              padding: '4px 9px', cursor: 'pointer',
                              transition: 'opacity 0.2s'
                            }}
                            title="View uploaded PDF"
                          >
                            <FileText size={12} /> View PDF
                          </button>
                        )}
                        {role.subRoles && role.subRoles.length > 0 ? (
                          <ChevronDown
                            size={18}
                            style={{
                              color: 'var(--brand-red)',
                              transform: expandedRole === role._id ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.25s ease',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}
                          />
                        ) : (
                          <ChevronRight size={18} style={{ color: 'var(--brand-red)', flexShrink: 0, marginTop: '2px' }} />
                        )}
                      </div>
                    </div>
                    {role.description && (
                      <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                        {role.description}
                      </p>
                    )}
                  </div>

                  {/* Sub-roles list */}
                  {expandedRole === role._id && role.subRoles && role.subRoles.length > 0 && (
                    <div className="subrole-list">
                      {(role.subRoles || []).map(sub => (
                        <button
                          key={sub.key}
                          className="subrole-item"
                          onClick={() => {
                            setSelectedRole(role._id);
                            setSelectedSubRole(sub.key);
                            setStep(2);
                          }}
                        >
                          <ChevronRight size={15} style={{ color: 'var(--brand-red)', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{sub.label}</span>
                              {role.attachments && role.attachments.length > 0 && (
                                <span
                                  role="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setPdfModal({
                                      title: `${role.name} — ${sub.label}`,
                                      attachments: role.attachments.map(att => ({
                                        label: att.fileName,
                                        url: `${apiBaseUrl}/api/roles/${role._id}/attachments/${att._id}`
                                      }))
                                    });
                                  }}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: 'var(--brand-red)', color: '#fff',
                                    borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                    padding: '3px 8px', cursor: 'pointer', flexShrink: 0
                                  }}
                                  title="View uploaded PDF"
                                >
                                  <FileText size={11} /> View PDF
                                </span>
                              )}
                            </div>
                            {sub.desc && (
                              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400, lineHeight: 1.4 }}>{sub.desc}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
            </p>
          </div>
        </div>

        {/* ── PDF Viewer Modal ── */}
        {pdfModal && (
          <div
            onClick={() => setPdfModal(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              animation: 'fade-in-page 0.2s ease'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--white)',
                borderRadius: '16px',
                width: '100%', maxWidth: '900px',
                height: '90vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface2)', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: 'rgba(209,43,43,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--brand-red)'
                  }}>
                    <FileText size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{pdfModal.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Job Description PDF</div>
                  </div>
                </div>
                <button
                  onClick={() => setPdfModal(null)}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '6px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text)', transition: 'background 0.2s'
                  }}
                  title="Close"
                >
                  <XIcon size={18} />
                </button>
              </div>

              {/* Tab selector when multiple attachments */}
              {pdfModal.attachments.length > 1 && (
                <div style={{
                  display: 'flex', gap: '4px', padding: '10px 20px',
                  borderBottom: '1px solid var(--border)', overflowX: 'auto',
                  background: 'var(--surface)', flexShrink: 0
                }}>
                  {pdfModal.attachments.map((att, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPdfModal(prev => ({ ...prev, activeIdx: idx }))}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                        background: (pdfModal.activeIdx ?? 0) === idx ? 'var(--brand-red)' : 'var(--border)',
                        color: (pdfModal.activeIdx ?? 0) === idx ? '#fff' : 'var(--text)'
                      }}
                    >
                      {att.label}
                    </button>
                  ))}
                </div>
              )}

              {/* PDF iframe */}
              <iframe
                src={pdfModal.attachments[pdfModal.activeIdx ?? 0]?.url}
                title={pdfModal.title}
                style={{ flex: 1, border: 'none', width: '100%' }}
              />
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  // ── STEP 1: Personal Details ──
  if (step === 1) {
    const renderSelectField = (fieldKey, label, options) => (
      <div className="form-group" key={fieldKey}>
        <label className="form-label">{label}</label>
        <div className="custom-select-container" style={{ width: '100%', marginBottom: 0 }}>
          <div
            className={`form-input select-trigger ${openDropdown === fieldKey ? 'active' : ''}`}
            onClick={() => setOpenDropdown(prev => prev === fieldKey ? null : fieldKey)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', height: '46px' }}
          >
            <span style={{ color: form[fieldKey] ? 'var(--text)' : 'var(--muted2)' }}>
              {form[fieldKey] || 'Select...'}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transform: openDropdown === fieldKey ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          {openDropdown === fieldKey && (
            <div className="select-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, maxHeight: '250px', overflowY: 'auto' }}>
              <div className={`select-option ${!form[fieldKey] ? 'selected' : ''}`} onClick={() => { handleInputChange(fieldKey, ''); setOpenDropdown(null); }}>Select...</div>
              {options.map(o => (
                <div key={o} className={`select-option ${form[fieldKey] === o ? 'selected' : ''}`} onClick={() => { handleInputChange(fieldKey, o); setOpenDropdown(null); }}>{o}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );

    // ── Searchable country picker with flags ──
    const renderCountryField = () => {
      const isOpen = openDropdown === 'applyingCountry';
      const filtered = COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
      );
      const selected = COUNTRY_CODES.find(c => c.name === form.applyingCountry);
      return (
        <div className="form-group" key="applyingCountry">
          <label className="form-label">Which Country Are You Applying To? *</label>
          <div className="custom-select-container" style={{ width: '100%', marginBottom: 0 }}>
            <div
              className={`form-input select-trigger ${isOpen ? 'active' : ''}`}
              onClick={() => {
                setOpenDropdown(prev => prev === 'applyingCountry' ? null : 'applyingCountry');
                setCountrySearch('');
              }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', height: '46px', gap: '8px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: form.applyingCountry ? 'var(--text)' : 'var(--muted2)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected ? (
                  <><img src={`https://flagcdn.com/w20/${selected.cca2.toLowerCase()}.png`} width="20" alt={selected.name} style={{ borderRadius: '2px', objectFit: 'cover' }} />{selected.name}</>
                ) : 'Select a country...'}
              </span>
              <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </div>
            {isOpen && (
              <div className="select-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, maxHeight: '300px', display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Search box */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <input
                    autoFocus
                    className="form-input"
                    placeholder="🔍  Search country..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ height: '36px', fontSize: '13px', padding: '0 12px' }}
                  />
                </div>
                {/* Country list */}
                <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>No countries found</div>
                  ) : filtered.map(c => (
                    <div
                      key={c.cca2}
                      className={`select-option ${form.applyingCountry === c.name ? 'selected' : ''}`}
                      onClick={() => { handleInputChange('applyingCountry', c.name); setOpenDropdown(null); setCountrySearch(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', margin: '0 4px', borderRadius: '6px' }}
                    >
                      <img src={`https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png`} width="20" alt={c.name} style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: 'var(--text)', flex: 1, fontWeight: form.applyingCountry === c.name ? 600 : 400 }}>{c.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.05em' }}>{c.cca2}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderTextField = (fieldKey, label, type = 'text', placeholder = '', fullWidth = false) => {
      const isDate = type === 'date';
      return (
        <div className={`form-group ${fullWidth ? 'full-width' : ''}`} key={fieldKey}>
          <label className="form-label">{label}</label>
          {isDate ? (
            <div style={{ display: 'flex', width: '100%' }}>
              <DatePicker
                selected={form[fieldKey] ? new Date(form[fieldKey]) : null}
                onChange={(date) => {
                  if (date) {
                    const tzOffset = date.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 10);
                    handleInputChange(fieldKey, localISOTime);
                  } else {
                    handleInputChange(fieldKey, '');
                  }
                }}
                onBlur={() => setTouched(prev => ({ ...prev, [fieldKey]: true }))}
                dateFormat="MM/dd/yyyy"
                placeholderText="mm/dd/yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                className={`form-input ${touched[fieldKey] && getFieldError(fieldKey) ? 'invalid' : ''}`}
                wrapperClassName="react-datepicker-wrapper-full"
              />
            </div>
          ) : (
            <input
              className={`form-input ${touched[fieldKey] && getFieldError(fieldKey) ? 'invalid' : ''}`}
              type={type}
              placeholder={placeholder}
              value={form[fieldKey]}
              onChange={e => handleInputChange(fieldKey, e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, [fieldKey]: true }))}
            />
          )}
          {touched[fieldKey] && getFieldError(fieldKey) && (
            <div className="error-text"><AlertCircle size={12} /> {getFieldError(fieldKey)}</div>
          )}
        </div>
      );
    };

    const renderPhoneField = (fieldKey, label) => (
      <div className="form-group" key={fieldKey}>
        <label className="form-label">{label}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Country Code Dropdown */}
          <div className="custom-select-container" style={{ width: '130px', marginBottom: 0 }}>
            <div
              className={`form-input select-trigger ${openDropdown === 'countryCode' ? 'active' : ''}`}
              onClick={() => setOpenDropdown(prev => prev === 'countryCode' ? null : 'countryCode')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', height: '46px', padding: '0 12px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                {(() => {
                  const c = COUNTRY_CODES.find(x => x.code === form.countryCode);
                  return c ? <><img src={`https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png`} width="20" alt={c.name} style={{ borderRadius: '2px' }} /> {c.code}</> : form.countryCode;
                })()}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)', transform: openDropdown === 'countryCode' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </div>
            {openDropdown === 'countryCode' && (
              <div className="select-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '280px', zIndex: 100, maxHeight: '250px', overflowY: 'auto' }}>
                {COUNTRY_CODES.map(c => (
                  <div key={c.cca2 + c.code} className={`select-option ${form.countryCode === c.code ? 'selected' : ''}`} onClick={() => { handleInputChange('countryCode', c.code); setOpenDropdown(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={`https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png`} width="20" alt={c.name} style={{ borderRadius: '2px', flexShrink: 0 }} /> {c.name} ({c.code})
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Phone Input */}
          <input
            style={{ flex: 1 }}
            className={`form-input ${touched[fieldKey] && getFieldError(fieldKey) ? 'invalid' : ''}`}
            type="tel" placeholder="Enter phone number"
            value={form[fieldKey]}
            onChange={e => handleInputChange(fieldKey, e.target.value.replace(/[^\d\s\-\+]/g, ''))}
            onBlur={() => setTouched(prev => ({ ...prev, [fieldKey]: true }))}
          />
        </div>
        {touched[fieldKey] && getFieldError(fieldKey) && (
          <div className="error-text"><AlertCircle size={12} /> {getFieldError(fieldKey)}</div>
        )}
      </div>
    );

    const parentRole = dynamicRoles.find(r => r._id === selectedRole);
    const subRoleObj = parentRole?.subRoles?.find(s => s.key === selectedSubRole);
    const subRoleLabel = subRoleObj ? subRoleObj.label : (parentRole?.name || selectedSubRole);
    const categoryLabel = parentRole?.name || selectedRole;
    const roleDisplay   = (subRoleLabel && subRoleLabel !== categoryLabel) ? `${categoryLabel} — ${subRoleLabel}` : categoryLabel;

    return (
      <div className="page-wrapper" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
        <div className="section" style={{ paddingTop: '40px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="section-tag">🌍 International Application</div>
            <h2>Personal Details</h2>
            <p className="section-sub">
              Applying for: <strong>{roleDisplay}</strong>
            </p>

            <div className="form-grid">
              {renderTextField('firstName', 'First Name *', 'text', 'Enter first name')}
              {renderTextField('lastName', 'Last Name *', 'text', 'Enter last name')}
              {renderPhoneField('phone', 'Phone *')}
              {renderTextField('email', 'Email *', 'email', 'example@email.com')}
              {renderTextField('experience', 'Years of Experience *', 'number', '0')}
              {renderSelectField('education', 'Education *', ['Below 10th','10th Pass','12th Pass','Graduate','Post Graduate'])}
              {renderTextField('languages', 'Languages Known *', 'text', 'Hindi, English...')}

              {/* International fields */}
              {renderTextField('city', 'City / District *', 'text', 'Enter your city')}
              {renderSelectField('passport', 'Passport Status *', [
                'ECR (Emigration Check Required)',
                'ECNR (Emigration Check Not Required)',
                'No Passport / In Process'
              ])}
              {renderTextField('gulfExp', 'Overseas Experience *', 'text', 'e.g. 2 years overseas as driver')}
              {renderCountryField()}
              {renderTextField('dob', 'Date of Birth *', 'date', '')}
              {renderTextField('height', 'Height *', 'text', "e.g. 5'8\" or 173 cm")}

              {/* Source */}
              <div className="form-group full-width">
                <label className="form-label">How did you hear about us?</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {SOURCES.map(s => (
                    <button key={s} className={`btn btn-sm ${form.source === s ? 'btn-primary' : 'btn-ghost'}`} type="button" onClick={() => setForm(f => ({ ...f, source: s }))}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Assessment already taken: show retest banner ── */}
            {dupStatus === 'assessment_submitted' && (
              <div style={{ 
                marginTop: '32px',
                padding: '24px', 
                background: retestPending === 'pending' ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.03)',
                border: `1.5px solid ${retestPending === 'pending' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.15)'}`,
                borderRadius: '16px',
                display: 'flex', alignItems: 'flex-start', gap: '20px',
                animation: 'slide-up 0.4s ease'
              }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', 
                  background: retestPending === 'pending' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.1)',
                  color: retestPending === 'pending' ? '#d97706' : 'var(--brand-red)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px'
                }}>
                  {retestPending === 'pending' ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                </div>
                <div style={{ flex: 1 }}>

                  {/* Sub-state: no retest requested yet — show form */}
                  {!retestPending && (
                    <>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                        Application Already Completed
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '4px' }}>
                        {dupError}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                        Both the <strong>form submission</strong> and <strong>assessment test</strong> are locked. Contact our support team or submit a retest request below.
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Request a Retest
                        </div>
                        <textarea 
                          className="form-input" 
                          placeholder="Explain why you need to retake the assessment (required)..." 
                          value={retestReason}
                          onChange={(e) => setRetestReason(e.target.value)}
                          style={{ width: '100%', minHeight: '70px', fontSize: '13px', marginBottom: '10px', resize: 'vertical' }}
                        />
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={submitForm}
                          disabled={!retestReason.trim() || submittingForm}
                          style={{ padding: '8px 20px', borderRadius: '10px' }}
                        >
                          {submittingForm ? 'Submitting...' : 'Request Retest'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Sub-state: pending admin approval */}
                  {retestPending === 'pending' && (
                    <>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#d97706', marginBottom: '6px' }}>
                        Retest Request Submitted — Awaiting Admin Approval
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6', marginBottom: '14px' }}>
                        Your request has been received and is under review. Once the admin approves it, you will be able to retake the assessment. Please check back later.
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '7px 14px',
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#d97706'
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                        Pending Admin Review
                      </div>
                    </>
                  )}

                  {/* Sub-state: rejected by admin */}
                  {retestPending === 'rejected' && (
                    <>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--brand-red)', marginBottom: '6px' }}>
                        Retest Request Rejected
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                        {dupError || 'Your retest request was reviewed and rejected by the admin. For further assistance, please contact our support team.'}
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}

            {/* Form submission info/error */}
            {formError && !dupError && (
              <div style={{
                marginTop: '16px',
                padding: '14px 20px',
                background: formSubmitted ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)',
                border: `1.5px solid ${formSubmitted ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.15)'}`,
                borderRadius: '12px',
                fontSize: '13px',
                color: formSubmitted ? '#059669' : 'var(--danger)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {formSubmitted ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {formError}
              </div>
            )}

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Back */}
              <button className="btn btn-ghost btn-lg" onClick={() => {
                if (initialRole) {
                  navigate('/#roles');
                } else {
                  handleStepChange(0);
                }
              }}>
                <ChevronLeft size={16} /> Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                {/* Submit Form button — 3 states */}
                {dupStatus === 'assessment_submitted' ? (
                  /* Test already taken: hard lock on form too */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1.5px solid rgba(239,68,68,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', fontWeight: 700,
                    color: 'var(--brand-red)', letterSpacing: '0.04em'
                  }}>
                    <Shield size={15} /> Form Locked
                  </div>
                ) : !formSubmitted ? (
                  <button
                    className="btn btn-ghost btn-lg"
                    disabled={!isFormValid() || submittingForm}
                    onClick={submitForm}
                  >
                    {submittingForm ? 'Saving...' : 'Submit Form'}
                  </button>
                ) : (
                  /* Form submitted, test not yet taken */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px', fontWeight: 700,
                    color: '#059669', letterSpacing: '0.04em'
                  }}>
                    <CheckCircle size={16} />
                    Form Submitted · Ref: {formRefId}
                  </div>
                )}

                {/* Start Assessment — 3 states */}
                {dupStatus === 'assessment_submitted' ? (
                  /* Test already done: show a locked badge */
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 28px',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1.5px solid rgba(239,68,68,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px', fontWeight: 700,
                    color: 'var(--brand-red)', letterSpacing: '0.04em',
                    cursor: 'not-allowed',
                    userSelect: 'none'
                  }}>
                    <Shield size={16} /> Assessment Locked
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    disabled={!formSubmitted || validating}
                    onClick={() => { enterFS(); startAssessment(); }}
                  >
                    {validating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Loading...
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Start Assessment <ChevronRight size={16} />
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── STEP 2: Assessment ──
  if (step === 2) {
    const q = questions[currentQ];
    if (!q) return <div className="section text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '40px' }}><div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /><p style={{ margin: 0 }}>Loading questions...</p></div>;
    const qid = q.qid || q.id;

    const answeredCount = Object.keys(answers).length;
    const reviewCount = reviewed.size;
    const unansweredCount = questions.length - answeredCount;

    return (
      <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
        {/* Fullscreen Lockdown Overlay */}
        {!isFull && (
          <div className="fullscreen-lockout">
            <div className="lockout-card">
              <div className="section-tag">Assessment Integrity</div>
              <h2>Assessment in Progress</h2>
              <p className="section-sub">Please stay in fullscreen mode. Any attempt to switch tabs or exit will be recorded for evaluation.</p>
              
              {violations.tabSwitches + violations.fullscreenExits > 0 && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid var(--danger)', 
                  padding: '12px 16px', 
                  borderRadius: '10px',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '24px'
                }}>
                  <AlertCircle size={18} />
                  Integrity Alert: {violations.tabSwitches + violations.fullscreenExits} violation(s) recorded. Please remain in fullscreen.
                </div>
              )}

              <button 
                className="btn btn-primary btn-lg" 
                style={{ gap: '12px', paddingLeft: '40px', paddingRight: '40px' }}
                onClick={enterFS}
              >
                <Maximize size={18} /> RE-ENTER FULL SCREEN
              </button>
            </div>
          </div>
        )}

        {/* Hide the test completely if not in fullscreen */}
        <div style={{ display: isFull ? 'block' : 'none' }}>
          {/* Consolidated Sticky Header */}
          <div className="test-sticky-header">
            <div className="test-header-content">
              <div className="test-info">
                {(dynamicRoles.find(r => r._id === selectedRole)?.name || selectedRole)} Assessment · Innovision Global
              </div>
              <div className={`test-timer ${timeLeft < 60 ? 'critical' : ''}`}>
                <span className="timer-label">Time remaining :</span>
                <span className="timer-value">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="test-progress-strip">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="page-wrapper" style={{ padding: 0 }}>
            <div className="test-main-layout">
          {/* Main Assessment Card */}
          <div className="test-card-container">
            <div className="assessment-card active" style={{ height: '620px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '16px', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <span className="q-number">Question {currentQ + 1} of {questions.length}</span>
                  <span className={`q-badge ${q.type}`}>{q.type === 'fluency' ? 'Communication' : q.type}</span>
                </div>

                {q.passage && (
                  <div className="passage-box" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '24px' }}>
                    {q.passage}
                  </div>
                )}

                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', lineHeight: '1.6', color: 'var(--text)' }}>
                  {q.question}
                </div>

                {/* MCQ Options */}
                {q.options?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {q.options.map(opt => (
                      <button
                        key={opt.key}
                        className={`btn ${answers[qid] === opt.key ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ justifyContent: 'flex-start', textTransform: 'none', letterSpacing: 'normal', fontWeight: 500, padding: '14px 20px' }}
                        onClick={() => setAnswers(prev => ({ ...prev, [qid]: opt.key }))}
                      >
                        <span style={{ fontWeight: 800, marginRight: '12px', opacity: 0.6 }}>{opt.key}.</span> {opt.text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    {q.type === 'fluency' ? (
                      <div style={{ 
                        padding: '32px', 
                        background: 'var(--surface2)', 
                        borderRadius: '16px', 
                        border: '1px dashed var(--border)',
                        textAlign: 'center',
                        marginBottom: '8px',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        {answers[qid] ? (
                          <div style={{ width: '100%' }}>
                            <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Live Transcript</p>
                            <p style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500, lineHeight: 1.6 }}>{answers[qid]}</p>
                          </div>
                        ) : (
                          <>
                            <Mic size={28} style={{ color: 'var(--brand-red)', marginBottom: '12px' }} />
                            <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 700 }}>
                              Voice Participation Required
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                              Please read the passage above clearly into your microphone.
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <textarea
                        className="form-input"
                        placeholder="Type your detailed response here..."
                        value={answers[qid] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [qid]: e.target.value }))}
                        onPaste={e => e.preventDefault()}
                        onCopy={e => e.preventDefault()}
                        style={{ width: '100%', minHeight: q.type === 'essay' ? '220px' : '120px', fontSize: '14px' }}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                      <button
                        className={`mic-btn ${isRecording ? 'recording' : ''}`}
                        onClick={() => toggleVoice(qid)}
                        title={isRecording ? 'Stop recording' : 'Start voice input'}
                      >
                        {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                        {isRecording ? 'Listening… tap again to stop' : 'Tap to use voice input'}
                      </span>
                    </div>

                    {q.type === 'fluency' && (
                      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleReset(qid)}
                          disabled={resetsRemaining <= 0 || (!answers[qid] && !isRecording)}
                          style={{ color: resetsRemaining > 0 ? 'var(--brand-red)' : 'var(--muted)' }}
                        >
                          <RotateCcw size={14} style={{ marginRight: '6px' }} />
                          Reset Recording
                        </button>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                          Resets Remaining: {resetsRemaining}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-ghost" disabled={currentQ === 0} onClick={() => handleQChange(currentQ - 1)}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button 
                    className={`btn ${reviewed.has(currentQ) ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => toggleReview(currentQ)}
                    style={{ gap: '8px' }}
                  >
                    <Flag size={16} fill={reviewed.has(currentQ) ? 'currentColor' : 'none'} />
                    {reviewed.has(currentQ) ? 'Flagged' : 'Mark for Review'}
                  </button>
                </div>
                
                {currentQ < questions.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => handleQChange(currentQ + 1)}>
                    Next Question <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ background: 'var(--success)' }}>
                    <Send size={16} /> {submitting ? 'Submitting...' : 'Finish Assessment'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator Side Panel */}
          <aside className="test-sidebar">
            <div className="sidebar-section">
              <h4 className="sidebar-title">Test Progress</h4>
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-dot answered"></span>
                  <span className="stat-label">Answered</span>
                  <span className="stat-value">{answeredCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-dot review"></span>
                  <span className="stat-label">Review</span>
                  <span className="stat-value">{reviewCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-dot unanswered"></span>
                  <span className="stat-label">Remaining</span>
                  <span className="stat-value">{unansweredCount}</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h4 className="sidebar-title">Question Navigator</h4>
              <div className="question-grid">
                {questions.map((_, idx) => {
                  const status = getQuestionStatus(idx);
                  return (
                    <button
                      key={idx}
                      className={`q-nav-btn ${status} ${currentQ === idx ? 'current' : ''}`}
                      onClick={() => handleQChange(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-footer">
              <p>Need help? Contact the on-site supervisor.</p>
            </div>
          </aside>
        </div>
      </div>
      </div>
      
      {/* LUXURY SUBMISSION OVERLAY */}
      {submitting && (
        <div className="submitting-overlay">
          <div className="submitting-card">
            <div className="submitting-icon">
              <ShieldCheck size={80} strokeWidth={2} />
            </div>
            <h2 className="submitting-title">Generating Your Evaluation</h2>
            <p className="submitting-text">Please wait while our AI engine analyzes your performance...</p>
          </div>
        </div>
      )}

      {/* ERROR OVERLAY */}
      {submitError && (
        <div className="submitting-overlay">
          <div className="submitting-card" style={{ maxWidth: '440px', padding: '40px' }}>
            <div className="submitting-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--brand-red)' }}>
              <AlertTriangle size={64} />
            </div>
            <h2 className="submitting-title" style={{ color: 'var(--text)' }}>{submitError.title}</h2>
            <p className="submitting-text" style={{ color: 'var(--muted)', fontSize: '15px' }}>
              {submitError.message}
            </p>
            {submitError.refId && (
              <div style={{ marginTop: '20px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', border: '1px dashed var(--border)', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
                Reference ID: <span style={{ color: 'var(--brand-red)' }}>{submitError.refId}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', width: '100%' }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1 }}
                onClick={() => setSubmitError(null)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => navigate('/')}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  }

  // ── STEP 3: Results ──
  return (
    <div className="page-wrapper" style={{ paddingTop: 'calc(var(--nav-height) + 60px)', paddingBottom: '60px' }}>
      <div className="section" style={{ paddingTop: '40px' }}>
        <div className="results-card">
          <div className="results-icon-container">
            <CheckCircle size={72} strokeWidth={2.5} className="success-pulse-icon" style={{ color: 'var(--success)' }} />
          </div>
          <h3 className="results-title">Assessment Submitted! 🎉</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
            Thank you for completing the skill assessment. Your responses have been submitted and are under review by the Innovision Global team.
          </p>
          {result?.refId && (
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Your Reference ID</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 900, color: 'var(--brand-red)' }}>
                {result.refId}
              </div>
            </div>
          )}
          {!retestPending ? (
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/')}>
                Back to Home
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setRetestPending('input_reason')}>
                Retake Test
              </button>
            </div>
          ) : retestPending === 'input_reason' ? (
            <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', textAlign: 'left', animation: 'slide-up 0.3s ease' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Reason for Retake Request
              </div>
              <textarea 
                className="form-input" 
                placeholder="Please explain why you need to retake the test..."
                value={retestReason}
                onChange={(e) => setRetestReason(e.target.value)}
                style={{ width: '100%', minHeight: '80px', fontSize: '13px', marginBottom: '16px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setRetestPending('')}>Cancel</button>
                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ flex: 1 }} 
                  onClick={submitForm}
                  disabled={!retestReason.trim() || submittingForm}
                >
                  {submittingForm ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          ) : retestPending === 'pending' ? (
            <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', padding: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', color: '#d97706', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', animation: 'slide-up 0.3s ease' }}>
              <AlertTriangle size={24} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>Request Submitted</div>
                <div style={{ fontSize: '12px', color: 'rgba(217,119,6,0.8)' }}>Awaiting Admin Approval</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
}
