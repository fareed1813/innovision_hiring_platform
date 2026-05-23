import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Car, Sparkles, Users, Wrench, ArrowRight, CheckCircle, Globe, Award } from 'lucide-react';
import Footer from '../components/Footer';

/* ─── International Roles ─── */
const INTL_ROLES = [
  { key: 'driver',       label: 'Taxi Driver',            icon: <Car       className="driver-icon"   size={32} strokeWidth={1.5} />, desc: 'Professional driver roles across UAE and Saudi Arabia. Valid driving licence and a safe, disciplined driving record required.' },
  { key: 'security',     label: 'Special Security Guard', icon: <Shield    className="security-icon" size={32} strokeWidth={1.5} />, desc: 'Armed/unarmed security personnel for high-security facilities, malls, and corporate premises across the UAE and Saudi Arabia.' },
  { key: 'housekeeping', label: 'Housekeeping Staff',     icon: <Sparkles  className="house-icon"    size={32} strokeWidth={1.5} />, desc: 'Hotel, hospital & facility cleaning staff for premium hospitality and healthcare clients across UAE, Ukraine, and Saudi Arabia.' },
  { key: 'supervisor',   label: 'Field Supervisor',       icon: <Users     className="super-icon"    size={32} strokeWidth={1.5} />, desc: 'On-ground team lead for facility management, construction, and operations supervision across UAE, Ukraine, Saudi Arabia.' },
  { key: 'helper',       label: 'General Helper',         icon: <Wrench    className="helper-icon"   size={32} strokeWidth={1.5} />, desc: 'Multi-skilled helper for construction, warehousing, and facility maintenance roles across UAE, Saudi Arabia, and Ukraine.' },
];

const GlowingDivider = () => (
  <div style={{
    width: '100%', height: '2px',
    background: 'linear-gradient(to right, transparent, #EF2B2D, transparent)',
    boxShadow: '0 0 20px rgba(239,43,45,0.5)',
    margin: 0, zIndex: 10, position: 'relative'
  }} />
);

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();

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

          {/* International Roles Grid */}
          <div className="roles-grid">
            {INTL_ROLES.map(role => (
              <a
                href={`/apply?role=${role.key}`}
                key={role.key}
                className="role-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="role-card-icon">{role.icon}</div>
                <h3>{role.label}</h3>
                <p>{role.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="section" id="about" style={{ background: '#fdf5f5' }}>
        <div className="section-inner">
          <div className="section-tag">About Us</div>
          <h2>Innovision Global</h2>
          <p className="section-sub">
            A MEA-registered Overseas Manpower Consultancy providing skilled, unskilled & semi-skilled manpower to overseas companies since 2007.
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
