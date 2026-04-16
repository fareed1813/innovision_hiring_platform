import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Car, Sparkles, Users, Wrench, ArrowRight, CheckCircle, Globe, Award } from 'lucide-react';
import Footer from '../components/Footer';

const ROLES = [
  { key: 'driver', label: 'Taxi Driver', icon: <Car className="driver-icon" size={32} strokeWidth={1.5} />, desc: 'Taxi/driver role for UAE deployments. Valid UAE driving licence and safe driving practices required.' },
  { key: 'security', label: 'Special Security Guard', icon: <Shield className="security-icon" size={32} strokeWidth={1.5} />, desc: 'Armed/unarmed security for high-security facilities, malls, and corporate premises in Dubai & Abu Dhabi.' },
  { key: 'housekeeping', label: 'Housekeeping Staff', icon: <Sparkles className="house-icon" size={32} strokeWidth={1.5} />, desc: 'Hotel, hospital & facility cleaning staff for 3★–5★ hospitality clients in UAE.' },
  { key: 'supervisor', label: 'Field Supervisor', icon: <Users className="super-icon" size={32} strokeWidth={1.5} />, desc: 'On-ground team lead for facility management or construction site supervision across UAE projects.' },
  { key: 'helper', label: 'General Helper', icon: <Wrench className="helper-icon" size={32} strokeWidth={1.5} />, desc: 'Multi-skilled helper for construction, warehouse, or facility maintenance roles across UAE.' },
];

const GlowingDivider = () => (
  <div style={{ 
    width: '100%', 
    height: '2px', 
    background: 'linear-gradient(to right, transparent, #EF2B2D, transparent)',
    boxShadow: '0 0 20px rgba(239,43,45,0.5)',
    margin: 0,
    zIndex: 10,
    position: 'relative'
  }} />
);

export default function Landing() {
  const location = useLocation();

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
          <div className="hero-badge">🇦🇪 UAE Overseas Deployment</div>
          <h1>
            Build Your Career<br />
            With <span>Innovision</span> Overseas
          </h1>
          <p>
            MOIA-registered manpower consultancy specializing in India-to-UAE workforce deployment.
            Take a skill assessment and get deployed to premium facilities across Dubai & Abu Dhabi.
          </p>
          <div className="hero-buttons">
            <Link to="/apply" className="btn btn-primary btn-lg">
              Apply Now <ArrowRight size={16} />
            </Link>
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
          <h2>Open Roles for UAE Deployment</h2>
          <p className="section-sub">
            Select a role that matches your skills and experience. Complete the assessment to get shortlisted for deployment.
          </p>
          <div className="roles-grid">
            {ROLES.map(role => (
              <Link to={`/apply?role=${role.key}`} key={role.key} className="role-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="role-card-icon">{role.icon}</div>
                <h3>{role.label}</h3>
                <p>{role.desc}</p>
                <div className="role-card-tag">🇦🇪 UAE Deployment <ArrowRight size={12} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="section" id="about" style={{ background: '#fdf5f5' }}>
        <div className="section-inner">
          <div className="section-tag">About Us</div>
          <h2>Innovision Overseas Pvt. Ltd.</h2>
          <p className="section-sub">
            A MOIA-registered overseas manpower consultancy delivering skilled workforce solutions from India to the UAE since 2007.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {[
                { icon: <Globe size={24} />, title: 'MOIA Registered', desc: 'Fully registered with the Ministry of External Affairs, Government of India for overseas recruitment.' },
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
