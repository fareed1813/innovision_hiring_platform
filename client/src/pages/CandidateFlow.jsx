import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mic, MicOff, ChevronRight, ChevronLeft, Shield, ShieldCheck, Car, Sparkles, Users, Wrench, Flag, RotateCcw, Send, CheckCircle, AlertCircle, Info, Maximize, ChevronDown, AlertTriangle, HardHat, Zap, Cog } from 'lucide-react';
import Footer from '../components/Footer';
import { COUNTRY_CODES } from '../utils/countryCodes';

// Icon map for built-in roles (dynamic roles from DB fall back to Wrench)
const ICON_MAP = {
  driver:       <Car      className="driver-icon"   size={32} strokeWidth={1.5} />,
  security:     <Shield   className="security-icon" size={32} strokeWidth={1.5} />,
  housekeeping: <Sparkles className="house-icon"    size={32} strokeWidth={1.5} />,
  supervisor:   <Users    className="super-icon"    size={32} strokeWidth={1.5} />,
  helper:       <Wrench   className="helper-icon"   size={32} strokeWidth={1.5} />,
  electrician:  <Zap      className="helper-icon"   size={32} strokeWidth={1.5} />,
  mechanic:     <Cog      className="helper-icon"   size={32} strokeWidth={1.5} />,
  construction: <HardHat  className="helper-icon"   size={32} strokeWidth={1.5} />,
};

const getIcon = (iconKey) => ICON_MAP[iconKey] || <Wrench className="helper-icon" size={32} strokeWidth={1.5} />;

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

  const initialRole = params.get('role') || '';

  const [step, setStep] = useState(initialRole ? 1 : 0);

  const handleStepChange = (newStep) => {
    if (!document.startViewTransition) { setStep(newStep); window.scrollTo(0, 0); return; }
    document.startViewTransition(() => { setStep(newStep); window.scrollTo(0, 0); });
  };

  const handleQChange = (newQ) => {
    if (!document.startViewTransition) { setCurrentQ(newQ); return; }
    document.startViewTransition(() => setCurrentQ(newQ));
  };

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [dynamicRoles, setDynamicRoles] = useState([]); // fetched from /api/roles
  const [rolesLoading, setRolesLoading] = useState(true);

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

  // Fetch dynamic roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setDynamicRoles(res.data);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

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
      if (data.selectedRole) setSelectedRole(data.selectedRole);
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
      const draft = { form, selectedRole, step, answers, currentQ };
      localStorage.setItem('candidate_draft', JSON.stringify(draft));
    }
  }, [form, selectedRole, step, answers, currentQ]);

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
    if (submittingForm || formSubmitted) return;
    setSubmittingForm(true);
    setFormError('');
    try {
      const personal = {
        ...form,
        phone: `${form.countryCode} ${form.phone}`,
      };
      const res = await api.post('/candidates/submit-form', {
        personal,
        job: selectedRole,
        source: form.source || 'Direct',
        type: 'international',
      });
      setCandidateId(res.data.candidateId);
      setFormRefId(res.data.refId);
      setFormSubmitted(true);
      setResult({ refId: res.data.refId });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        const data = err.response.data;
        if (data.assessmentStatus === 'form_submitted') {
          setCandidateId(data.candidateId);
          setFormRefId(data.refId);
          setFormSubmitted(true);
          setFormError(`You already submitted this form (Ref: ${data.refId}). You can now start the assessment.`);
        } else {
          setDupError(`You have already applied for this role. Only one attempt is permitted.`);
        }
      } else {
        setFormError('Failed to submit form. Please check your connection and try again.');
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  // Fetch questions when starting assessment
  const startAssessment = async () => {
    setValidating(true);
    try {
      const roleName = dynamicRoles.find(r => r._id === selectedRole)?.name?.toLowerCase() || selectedRole;
      const res = await api.get('/questions', { params: { role: selectedRole, roleName } });
      setQuestions(res.data);
      // Shorter time for driver roles
      const time = roleName.includes('driver') ? 10 * 60 : 25 * 60;
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
    rec.lang = 'en-IN';
    rec.maxAlternatives = 3;
    
    activeVoiceStateRef.current = { baseText: answers[qid] || '', accumulated: '' };
    
    rec.onresult = (e) => {
      let fin = '', inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        let best = e.results[i][0];
        for (let a = 1; a < e.results[i].length; a++) {
          if (e.results[i][a].confidence > best.confidence) best = e.results[i][a];
        }
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
            <p className="section-sub">Choose the international role you're applying for. This determines the questions in your assessment.</p>
            <div className="roles-grid">
              {rolesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading roles...</div>
              ) : dynamicRoles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No roles available. Please contact support.</div>
              ) : dynamicRoles.map(role => (
                <div
                  key={role._id}
                  className={`role-card ${selectedRole === role._id ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role._id)}
                >
                  <div className="role-card-icon">{getIcon(role.iconKey)}</div>
                  <h3>{role.name}</h3>
                  {role.description && <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.5' }}>{role.description}</p>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '32px' }}>
              <button className="btn btn-primary btn-lg" disabled={!selectedRole} onClick={() => handleStepChange(1)}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
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

    const renderTextField = (fieldKey, label, type = 'text', placeholder = '', fullWidth = false) => (
      <div className={`form-group ${fullWidth ? 'full-width' : ''}`} key={fieldKey}>
        <label className="form-label">{label}</label>
        <input
          className={`form-input ${touched[fieldKey] && getFieldError(fieldKey) ? 'invalid' : ''}`}
          type={type} placeholder={placeholder}
          value={form[fieldKey]}
          onChange={e => handleInputChange(fieldKey, e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, [fieldKey]: true }))}
        />
        {touched[fieldKey] && getFieldError(fieldKey) && (
          <div className="error-text"><AlertCircle size={12} /> {getFieldError(fieldKey)}</div>
        )}
      </div>
    );

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
              <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                {(() => {
                  const c = COUNTRY_CODES.find(x => x.code === form.countryCode);
                  return c ? `${c.flag} ${c.code}` : form.countryCode;
                })()}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)', transform: openDropdown === 'countryCode' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </div>
            {openDropdown === 'countryCode' && (
              <div className="select-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '280px', zIndex: 100, maxHeight: '250px', overflowY: 'auto' }}>
                {COUNTRY_CODES.map(c => (
                  <div key={c.cca2 + c.code} className={`select-option ${form.countryCode === c.code ? 'selected' : ''}`} onClick={() => { handleInputChange('countryCode', c.code); setOpenDropdown(null); }}>
                    {c.flag} {c.name} ({c.code})
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

    const roleLabel = dynamicRoles.find(r => r._id === selectedRole || r.name.toLowerCase().replace(/\s+/g, '_') === selectedRole)?.name
      || selectedRole;

    return (
      <div className="page-wrapper" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
        <div className="section" style={{ paddingTop: '40px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="section-tag">🌍 International Application</div>
            <h2>Personal Details</h2>
            <p className="section-sub">
              Applying for: <strong>{roleLabel}</strong>
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
              {renderTextField('gulfExp', 'Overseas Experience *', 'text', 'e.g. 2 years in UAE as driver')}
              {renderSelectField('applyingCountry', 'Which Country Are You Applying To? *', ['UAE','Ukraine','Saudi Arabia'])}
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

            {/* Duplicate error */}
            {dupError && (
              <div style={{ 
                marginTop: '32px',
                padding: '24px', 
                background: 'rgba(239, 68, 68, 0.03)', 
                border: '1.5px solid rgba(239, 68, 68, 0.1)', 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                animation: 'slide-up 0.4s ease'
              }}>
                <div style={{ 
                  width: '48px', height: '48px', 
                  borderRadius: '12px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: 'var(--brand-red)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
                    Assessment Already Completed
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                    {dupError} For further assistance, reach out to our support team.
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/#contact')}
                    style={{ padding: '8px 20px', borderRadius: '10px' }}
                  >
                    Contact Support
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--muted2)', fontWeight: 500 }}>
                    support@innovision.co.in
                  </span>
                </div>
              </div>
            )}

            {/* Form submission error */}
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
                <CheckCircle size={16} /> {formError}
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
                {/* Submit Form button */}
                {!formSubmitted ? (
                  <button
                    className="btn btn-ghost btn-lg"
                    disabled={!isFormValid() || submittingForm || !!dupError}
                    onClick={submitForm}
                  >
                    {submittingForm ? 'Saving...' : 'Submit Form'}
                  </button>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#059669',
                    letterSpacing: '0.04em'
                  }}>
                    <CheckCircle size={16} />
                    Form Submitted · Ref: {formRefId}
                  </div>
                )}

                {/* Start Assessment — only enabled after form submitted */}
                <button
                  className="btn btn-primary btn-lg"
                  disabled={!formSubmitted || validating || !!dupError}
                  onClick={(e) => {
                    enterFS();
                    startAssessment();
                  }}
                >
                  {validating ? 'Loading...' : 'Start Assessment'} <ChevronRight size={16} />
                </button>
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
    if (!q) return <div className="section text-center"><p>Loading questions...</p></div>;
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
            <div className="assessment-card active" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
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
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
