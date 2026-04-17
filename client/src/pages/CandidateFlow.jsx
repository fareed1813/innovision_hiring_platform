import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Mic, MicOff, ChevronRight, ChevronLeft, Shield, ShieldCheck, Car, Sparkles, Users, Wrench, Flag, RotateCcw, Send, CheckCircle, AlertCircle, Info, Maximize, ChevronDown, AlertTriangle } from 'lucide-react';
import Footer from '../components/Footer';

const ROLES_MAP = {
  driver: { label: 'Taxi Driver', icon: <Car className="driver-icon" size={32} strokeWidth={1.5} /> },
  security: { label: 'Security Guard', icon: <Shield className="security-icon" size={32} strokeWidth={1.5} /> },
  housekeeping: { label: 'Housekeeping', icon: <Sparkles className="house-icon" size={32} strokeWidth={1.5} /> },
  supervisor: { label: 'Supervisor', icon: <Users className="super-icon" size={32} strokeWidth={1.5} /> },
  helper: { label: 'General Helper', icon: <Wrench className="helper-icon" size={32} strokeWidth={1.5} /> },
};
const ROLE_KEYS = Object.keys(ROLES_MAP);

const SOURCES = ['Direct / Walk-in', 'Job Portal', 'Social Media', 'Referral', 'Agent', 'WhatsApp'];

const VALIDATION_RULES = {
  firstName: { regex: /^[A-Za-z\s]{2,30}$/, error: "Please enter a valid name." },
  lastName: { regex: /^[A-Za-z\s]{2,30}$/, error: "Please enter a valid name." },
  phone: { regex: /^[\+\-\s0-9]{10,18}$/, error: "Please enter a valid phone." },
  email: { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, error: "Please enter a valid email." },
  city: { regex: /^[A-Za-z0-9\s\-\,]{2,50}$/, error: "Please enter a valid city." },
  experience: { regex: /^[0-9]{1,2}$/, error: "Please enter numbers only." }
};

export default function CandidateFlow() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  
  // If role is pre-selected via URL from the Landing page, jump straight to the Form (Step 1)
  const initialRole = params.get('role') || '';
  const [step, setStep] = useState(initialRole ? 1 : 0);

  const handleStepChange = (newStep) => {
    if (!document.startViewTransition) {
      setStep(newStep);
      window.scrollTo(0, 0);
      return;
    }
    document.startViewTransition(() => {
      setStep(newStep);
      window.scrollTo(0, 0);
    });
  };

  const handleQChange = (newQ) => {
    if (!document.startViewTransition) {
      setCurrentQ(newQ);
      return;
    }
    document.startViewTransition(() => setCurrentQ(newQ));
  };
  
  // Role selection
  const [selectedRole, setSelectedRole] = useState(initialRole);
  
  // Personal details
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', city: '',
    experience: '', passport: '', education: '', languages: '', gulfExp: '', source: ''
  });
  const [touched, setTouched] = useState({});

  const handleInputChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  const getFieldError = (key) => {
    const value = form[key];
    if (!value && !['firstName', 'lastName', 'phone', 'city'].includes(key)) return null; // Only check required fields for empty errors if needed, but here we focus on regex
    const rule = VALIDATION_RULES[key];
    if (rule && value && !rule.regex.test(value)) {
      return rule.error;
    }
    return null;
  };

  const isFormValid = () => {
    const required = ['firstName', 'lastName', 'phone', 'email', 'city', 'experience', 'passport', 'education', 'languages', 'gulfExp'];
    const hasRequired = required.every(key => form[key]?.trim().length >= 1);
    const hasNoErrors = Object.keys(VALIDATION_RULES).every(key => !getFieldError(key));
    return hasRequired && hasNoErrors;
  };
  
  // Custom dropdown state
  const [openDropdown, setOpenDropdown] = useState(null);
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
      if (data.step) setStep(data.step);
      if (data.questions) setQuestions(data.questions);
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
      const draft = { form, selectedRole, step, questions, answers, currentQ };
      localStorage.setItem('candidate_draft', JSON.stringify(draft));
    }
  }, [form, selectedRole, step, questions, answers, currentQ]);

  const handleReset = (qid) => {
    if (resetsRemaining <= 0) return;

    // Stop active recording if it matches this question
    if (speechRecRef.current) {
      try { speechRecRef.current.stop(); } catch(e){}
    }
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      try { mediaRecRef.current.stop(); } catch(e){}
    }
    setIsRecording(false);

    // Reset the internal memory so active recording drops prior text but keeps listening
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
      const full = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      // Proctoring check: If they exit fullscreen while in the assessment step, record a violation
      if (isFull && !full && step === 2) {
        handleViolation('fs');
      }
      setIsFull(full);
    };
    
    const handleBlur = () => {
      // Focus lost (tab switched or app minimized)
      // Use document.hidden as a more reliable check for tab switching
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
      document.body.classList.remove('hide-navbar');
    };
  }, [isFull, step]);

  const enterFS = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  // Pre-warm microphone and trigger fullscreen when assessment step begins
  useEffect(() => {
    if (step === 2) {
      // Trigger fullscreen after the step renders (user gesture context is preserved via React event)
      const fsTimeout = setTimeout(() => enterFS(), 100);
      // Pre-warm microphone
      if (!audioStreamRef.current) {
        navigator.mediaDevices?.getUserMedia({ audio: true })
          .then(stream => { audioStreamRef.current = stream; })
          .catch(() => {});
      }
      return () => clearTimeout(fsTimeout);
    }
  }, [step]);


  // Timer — run regardless of fullscreen so it counts down even on the lockout overlay
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);


  // Fetch questions when starting assessment
  const startAssessment = async () => {
    setValidating(true);
    setDupError('');
    try {
      // 1. Check Duplication first
      const dupCheck = await api.get('/candidates/check-duplication', {
        params: { phone: form.phone, email: form.email, job: selectedRole }
      });
      
      if (dupCheck.data.isDuplicate) {
        setDupError(`You have already completed the assessment for ${ROLES_MAP[selectedRole]?.label}. Only one attempt per role is permitted.`);
        setValidating(false);
        return;
      }

      // 2. If not duplicate, proceed to fetch questions
      const res = await api.get('/questions', { params: { role: selectedRole } });
      setQuestions(res.data);
      const time = selectedRole === 'driver' ? 10 * 60 : 25 * 60;
      setTimeLeft(time);
      setTotalTime(time);
      
      // 3. Change step — fullscreen will be triggered by useEffect below
      handleStepChange(2);
    } catch (err) {
      console.error(err);
      alert('Verification failed. Please try again.');
    } finally {
      setValidating(false);
    }
  };


  // Voice recording toggle
  const toggleVoice = useCallback((qid) => {
    if (isRecording) {
      // Stop
      speechRecRef.current?.stop();
      if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop();
      setIsRecording(false);
      return;
    }

    // Start MediaRecorder (parallel audio capture)
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

    // Start SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN'; // Optimized for Indian English
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
        questions, // Send the snapshot of what was actually shown
        answers,
        audioRecordings,
        proctoring: violations
      };
      const res = await api.post('/candidates', payload);
      setResult(res.data);
      localStorage.removeItem('candidate_draft'); // Success path
      
      // Auto exit fullscreen after completion
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
      
      handleStepChange(3);
    } catch (err) {
      console.error(err);
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

  // ── RESUME DRAFT PROMPT ──
  {showResumePrompt && (
    <div className="submitting-overlay">
      <div className="submitting-card" style={{ maxWidth: '440px', padding: '40px' }}>
        <div className="submitting-icon" style={{ color: 'var(--brand-red)' }}>
          <RotateCcw size={64} />
        </div>
        <h2 className="submitting-title">Resume Previous Session?</h2>
        <p className="submitting-text">We found a saved draft of your assessment. Would you like to continue from where you left off?</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            onClick={handleResume}
          >
            YES, RESUME
          </button>
          <button 
            className="btn btn-ghost" 
            style={{ flex: 1 }}
            onClick={clearDraft}
          >
            START NEW
          </button>
        </div>
      </div>
    </div>
  )}

  // ── STEP 0: Role Selection ──
  if (step === 0) {
    return (
      <div className="page-wrapper" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
        <div className="section" style={{ paddingTop: '40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="section-tag">Step 1 of 3</div>
            <h2>Select Your Role</h2>
            <p className="section-sub">Choose the role you're applying for. This determines the questions in your assessment.</p>
            <div className="roles-grid">
              {ROLE_KEYS.map(key => (
                <div
                  key={key}
                  className={`role-card ${selectedRole === key ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(key)}
                >
                  <div className="role-card-icon">{ROLES_MAP[key].icon}</div>
                  <h3>{ROLES_MAP[key].label}</h3>
                  <div className="role-card-tag">🇦🇪 UAE Deployment</div>
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
    return (
      <div className="page-wrapper" style={{ paddingTop: 'calc(var(--nav-height) + 40px)' }}>
        <div className="section" style={{ paddingTop: '40px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="section-tag">Step 2 of 3</div>
            <h2>Personal Details</h2>
            <p className="section-sub">Fill in your information. This will be used for your deployment profile.</p>
            <div className="form-grid">
              {/* Error display moved to bottom */}

              {[
                { key: 'firstName', label: 'First Name *', type: 'text', placeholder: 'Enter first name' },
                { key: 'lastName', label: 'Last Name *', type: 'text', placeholder: 'Enter last name' },
                { key: 'phone', label: 'Phone *', type: 'tel', placeholder: '+91 ...' },
                { key: 'email', label: 'Email *', type: 'email', placeholder: 'example@email.com' },
                { key: 'city', label: 'City / District *', type: 'text', placeholder: 'Enter your city' },
                { key: 'experience', label: 'Years of Experience *', type: 'number', placeholder: '0' },
                { key: 'passport', label: 'Passport Status *', options: ['Valid Passport (6+ months)', 'Expired / Need Renewal', 'No Passport'] },
                { key: 'education', label: 'Education *', options: ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Post Graduate'] },
                { key: 'languages', label: 'Languages *', type: 'text', placeholder: 'Hindi, English...' },
                { key: 'gulfExp', label: 'Gulf Experience *', options: ['No — First time', 'Yes — UAE', 'Yes — Saudi/Qatar/Other'] },
              ].map(field => (
                <div className="form-group" key={field.key}>
                  <label className="form-label">{field.label}</label>
                  {field.options ? (
                    <div className="custom-select-container" style={{ width: '100%', marginBottom: 0 }}>
                      <div 
                        className={`form-input select-trigger ${openDropdown === field.key ? 'active' : ''}`} 
                        onClick={() => setOpenDropdown(prev => prev === field.key ? null : field.key)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', height: '46px', border: touched[field.key] && getFieldError(field.key) ? '1px solid var(--danger)' : '' }}
                      >
                        <span style={{ color: form[field.key] ? 'var(--text)' : 'var(--muted2)' }}>
                          {form[field.key] || 'Select...'}
                        </span>
                        <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transform: openDropdown === field.key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>

                      {openDropdown === field.key && (
                        <div className="select-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100 }}>
                          <div 
                            className={`select-option ${!form[field.key] ? 'selected' : ''}`}
                            onClick={() => { handleInputChange(field.key, ''); setOpenDropdown(null); }}
                          >
                            Select...
                          </div>
                          {field.options.map(o => (
                            <div 
                              key={o} 
                              className={`select-option ${form[field.key] === o ? 'selected' : ''}`}
                              onClick={() => { handleInputChange(field.key, o); setOpenDropdown(null); }}
                            >
                              {o}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <input
                        className={`form-input ${touched[field.key] && getFieldError(field.key) ? 'invalid' : ''}`}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.key]}
                        onChange={e => handleInputChange(field.key, e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, [field.key]: true }))}
                      />
                      {touched[field.key] && getFieldError(field.key) && (
                        <div className="error-text">
                          <AlertCircle size={12} /> {getFieldError(field.key)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div className="form-group full-width">
                <label className="form-label">How did you hear about us?</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {SOURCES.map(s => (
                    <button key={s} className={`btn btn-sm ${form.source === s ? 'btn-primary' : 'btn-ghost'}`} type="button" onClick={() => setForm(f => ({ ...f, source: s }))}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* NEAT BOTTOM ERROR UI */}
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

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost btn-lg" onClick={() => handleStepChange(0)}>
                <ChevronLeft size={16} /> Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                disabled={!isFormValid() || validating || !!dupError}
                onClick={startAssessment}
              >
                {validating ? 'Verifying...' : 'Start Assessment'} <ChevronRight size={16} />
              </button>
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
        {/* Consolidated Sticky Header - Moved outside page-wrapper to fix position:fixed breaking due to parent transform */}
        <div className="test-sticky-header">
          <div className="test-header-content">
            <div className="test-info">
              {ROLES_MAP[selectedRole]?.label} Assessment · Innovision Limited
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
            <ShieldCheck size={72} strokeWidth={2.5} className="success-pulse-icon" />
          </div>
          <h3 className="results-title">Assessment Submitted!</h3>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
            Thank you for completing the skill assessment. Your responses have been submitted and are under review by the Innovision Overseas team.
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
