import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Car, Sparkles, Users, Wrench, ArrowRight, CheckCircle, Globe, Award, ChevronLeft, ChevronRight, Zap, Cog, HardHat, Briefcase } from 'lucide-react';
import Footer from '../components/Footer';
import api from '../utils/api';

/* ─── Icon map for dynamic roles ─── */
const ICON_MAP = {
  driver:       <Car       className="driver-icon"   size={32} strokeWidth={1.5} />,
  security:     <Shield    className="security-icon" size={32} strokeWidth={1.5} />,
  housekeeping: <Sparkles  className="house-icon"    size={32} strokeWidth={1.5} />,
  supervisor:   <Users     className="super-icon"    size={32} strokeWidth={1.5} />,
  helper:       <Wrench    className="helper-icon"   size={32} strokeWidth={1.5} />,
  electrician:  <Zap       className="helper-icon"   size={32} strokeWidth={1.5} />,
  mechanic:     <Cog       className="helper-icon"   size={32} strokeWidth={1.5} />,
  construction: <HardHat   className="helper-icon"   size={32} strokeWidth={1.5} />,
};
const getIcon = (iconKey) => ICON_MAP[iconKey] || <Briefcase className="helper-icon" size={32} strokeWidth={1.5} />;

const GlowingDivider = () => (
  <div style={{
    width: '100%', height: '2px',
    background: 'linear-gradient(to right, transparent, #EF2B2D, transparent)',
    boxShadow: '0 0 20px rgba(239,43,45,0.5)',
    margin: 0, zIndex: 10, position: 'relative'
  }} />
);

/* ─── Job Carousel Component ─── */
function JobCarousel({ roles }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const next = () => goTo((current + 1) % roles.length);
  const prev = () => goTo((current - 1 + roles.length) % roles.length);

  // Auto-advance every 3.5 seconds
  useEffect(() => {
    if (roles.length <= 1) return;
    timerRef.current = setInterval(next, 3500);
    return () => clearInterval(timerRef.current);
  }, [current, roles.length]);

  if (!roles.length) return null;

  // Show up to 3 visible cards on desktop
  const visibleCount = Math.min(3, roles.length);
  const visibleRoles = [];
  for (let i = 0; i < visibleCount; i++) {
    visibleRoles.push(roles[(current + i) % roles.length]);
  }

  return (
    <div className="job-carousel-wrapper">
      {roles.length > 1 && (
        <button className="carousel-nav-btn carousel-prev" onClick={prev} aria-label="Previous">
          <ChevronLeft size={20} />
        </button>
      )}

      <div className="job-carousel-track">
        {visibleRoles.map((role, i) => (
          <a
            key={role._id + '-' + i}
            href={`/apply?role=${role._id}`}
            className={`job-carousel-slide ${i === 0 ? 'slide-active' : ''}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="carousel-slide-icon">{getIcon(role.iconKey)}</div>
            <div className="carousel-slide-badge">Now Hiring</div>
            <h4 className="carousel-slide-title">{role.name}</h4>
            {role.description && (
              <p className="carousel-slide-desc">{role.description}</p>
            )}
            <span className="carousel-slide-cta">
              Apply Now <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </span>
          </a>
        ))}
      </div>

      {roles.length > 1 && (
        <button className="carousel-nav-btn carousel-next" onClick={next} aria-label="Next">
          <ChevronRight size={20} />
        </button>
      )}

      {/* Dot indicators */}
      {roles.length > 1 && (
        <div className="carousel-dots">
          {roles.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${idx === current ? 'active' : ''}`}
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Fetch dynamic roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setRoles(res.data);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash, location.key]);

  return (
    <div className="page-wrapper">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🌍 MEA Registered Manpower Consultancy</div>
          <h1>
            Build Your Career<br />
            With <span>Innovision</span> Global
          </h1>
          <p>
            MEA-registered manpower consultancy specializing in overseas workforce deployment from India to key global markets, including the UAE, Qatar, Saudi Arabia, and Ukraine. Take a skill test with us and unlock rewarding overseas career opportunities with trusted employers.
          </p>
          <div className="hero-buttons">
            <a href="#roles" className="btn btn-primary btn-lg">
              Apply Now <ArrowRight size={16} />
            </a>
            <a href="#roles" className="btn btn-ghost-white btn-lg">
              View Open Roles
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">500+</div>
              <div className="hero-stat-label">Deployed to UAE</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">50+</div>
              <div className="hero-stat-label">Client Facilities</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">5★</div>
              <div className="hero-stat-label">Hospitality Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Open Roles ── */}
      <section className="section" id="roles">
        <div className="section-inner">
          <div className="section-tag">Careers</div>
          <h2>International Open Roles</h2>
          <p className="section-sub">
            Select the role that matches your skills and experience to begin your international career assessment.
          </p>

          {/* Dynamic Roles Grid */}
          {rolesLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 16px' }} />
              Loading available roles...
            </div>
          ) : roles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
              No roles currently available. Please check back soon.
            </div>
          ) : (
            <div className="roles-grid">
              {roles.map(role => (
                <a
                  href={`/apply?role=${role._id}`}
                  key={role._id}
                  className="role-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="role-card-icon">{getIcon(role.iconKey)}</div>
                  <h3>{role.name}</h3>
                  {role.description && <p>{role.description}</p>}
                </a>
              ))}
            </div>
          )}

          {/* ── Latest Openings Carousel ── */}
          {roles.length > 0 && (
            <div style={{ marginTop: '64px' }}>
              <div className="section-tag" style={{ marginBottom: '8px' }}>🆕 Latest Openings</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: 'var(--text)' }}>
                Newly Added Opportunities
              </h3>
              <p className="section-sub" style={{ marginBottom: '32px' }}>
                Fresh job openings — be among the first to apply.
              </p>
              <JobCarousel roles={roles} />
            </div>
          )}
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="section" id="about" style={{ background: '#fdf5f5' }}>
        <div className="section-inner">
          <div className="section-tag">About Us</div>
          <h2>Innovision Global</h2>
          <p className="section-sub">
            A MEA-registered Overseas Manpower Consultancy providing skilled, unskilled &amp; semi-skilled manpower to overseas companies since 2007.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: <Globe size={24} />, title: 'MEA Registered', desc: 'Fully registered with the Ministry of External Affairs, Government of India for overseas recruitment.' },
              { icon: <Award size={24} />, title: 'Premium Clients', desc: 'Partnered with 5-star hotels, corporate campuses, and government facilities across Dubai and Abu Dhabi.' },
              { icon: <CheckCircle size={24} />, title: 'End-to-End Support', desc: 'From visa processing to travel arrangements, we handle the complete deployment lifecycle for every candidate.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
                <div style={{ color: 'var(--brand-red)', marginBottom: '16px' }}>{item.icon}</div>
                <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>{item.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.7' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <GlowingDivider />
      <Footer />
    </div>
  );
}
