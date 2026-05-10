import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Car, Sparkles, Users, Wrench, ArrowRight, CheckCircle, Globe, Award, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import Footer from '../components/Footer';

/* ─── International Roles ─── */
const INTL_ROLES = [
  { key: 'driver',       label: 'Taxi Driver',        icon: <Car       className="driver-icon"    size={32} strokeWidth={1.5} />, desc: 'Professional driver roles across UAE and Saudi Arabia. Valid driving licence and a safe, disciplined driving record required.' },
  { key: 'security',     label: 'Special Security Guard', icon: <Shield className="security-icon" size={32} strokeWidth={1.5} />, desc: 'Armed/unarmed security personnel for high-security facilities, malls, and corporate premises across the UAE and Saudi Arabia.' },
  { key: 'housekeeping', label: 'Housekeeping Staff', icon: <Sparkles  className="house-icon"     size={32} strokeWidth={1.5} />, desc: 'Hotel, hospital & facility cleaning staff for premium hospitality and healthcare clients across UAE, Ukraine, and Saudi Arabia.' },
  { key: 'supervisor',   label: 'Field Supervisor',   icon: <Users     className="super-icon"     size={32} strokeWidth={1.5} />, desc: 'On-ground team lead for facility management, construction, and operations supervision across UAE, Ukraine, Saudi Arabia.' },
  { key: 'helper',       label: 'General Helper',     icon: <Wrench    className="helper-icon"    size={32} strokeWidth={1.5} />, desc: 'Multi-skilled helper for construction, warehousing, and facility maintenance roles across UAE, Saudi Arabia, and Ukraine.' },
];

/* ─── Domestic Roles with Sub-roles ─── */
const DOMESTIC_ROLES = [
  {
    key: 'security_domestic',
    label: 'Security Guard',
    icon: <Shield className="security-icon" size={32} strokeWidth={1.5} />,
    desc: 'Security guard positions across facilities, corporates, malls, and residential complexes within India.',
    subRoles: [
      { key: 'armed_security_guard',   label: 'Armed Security Guard', desc: 'Specialized armed security for banks, ATMs, and high-value transports.' },
      { key: 'unarmed_security_guard', label: 'Unarmed Security Guard', desc: 'Standard security monitoring for residential areas and retail spaces.' },
    ],
  },
  {
    key: 'facility_management',
    label: 'Facility Management',
    icon: <Building2 className="house-icon" size={32} strokeWidth={1.5} />,
    desc: 'Support and facility management roles in offices, hospitals, and commercial spaces across India.',
    subRoles: [
      { key: 'pantry_boy', label: 'Pantry Boy', desc: 'Manage pantry inventory, serve beverages, and maintain cleanliness.' },
    ],
  },
  {
    key: 'other_manpower',
    label: 'Other Man Power',
    icon: <Users className="super-icon" size={32} strokeWidth={1.5} />,
    desc: 'Supervisory, technical, and general manpower roles for domestic deployments across India.',
    subRoles: [
      { key: 'supervisor', label: 'Supervisor', desc: 'Oversee ground operations and coordinate daily workforce tasks.' },
      { key: 'tech',       label: 'Tech', desc: 'Technical maintenance and troubleshooting for mechanical or electrical systems.' },
    ],
  },
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
  const location  = useLocation();
  const navigate  = useNavigate();
  const [activeTab,    setActiveTab]    = useState('international');
  const [expandedRole, setExpandedRole] = useState(null);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedRole(null);
  };

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
          <h2>Open Roles — Select Your Category</h2>
          <p className="section-sub">
            Choose international or domestic roles. Select a role that matches your skills and experience.
          </p>

          {/* Tab Bar */}
          <div className="roles-tab-bar">
            <button
              className={`roles-tab ${activeTab === 'international' ? 'active' : ''}`}
              onClick={() => handleTabChange('international')}
            >
              🌍 International
            </button>
            <button
              className={`roles-tab ${activeTab === 'domestic' ? 'active' : ''}`}
              onClick={() => handleTabChange('domestic')}
            >
              🇮🇳 Domestic
            </button>
          </div>

          {/* International Roles Grid */}
          {activeTab === 'international' && (
            <div className="roles-grid" style={{ animation: 'fade-in-page 0.35s ease' }}>
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
          )}

          {/* Domestic Roles Grid — expandable */}
          {activeTab === 'domestic' && (
            <div className="roles-grid" style={{ animation: 'fade-in-page 0.35s ease' }}>
              {DOMESTIC_ROLES.map(role => (
                <div key={role.key} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {/* Main role card */}
                  <div
                    className={`role-card domestic-role-card ${expandedRole === role.key ? 'selected' : ''}`}
                    onClick={() => setExpandedRole(prev => prev === role.key ? null : role.key)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div className="role-card-icon">{role.icon}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0 }}>{role.label}</h3>
                      <ChevronDown
                        size={18}
                        style={{
                          color: 'var(--brand-red)',
                          transform: expandedRole === role.key ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.25s ease',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      />
                    </div>
                    <p style={{ marginTop: '8px' }}>{role.desc}</p>
                  </div>

                  {/* Sub-roles list */}
                  {expandedRole === role.key && (
                    <div className="subrole-list">
                      {role.subRoles.map(sub => (
                        <button
                          key={sub.key}
                          className="subrole-item"
                          onClick={() => navigate(`/apply?type=domestic&role=${role.key}&subRole=${sub.key}`)}
                        >
                          <ChevronRight size={15} style={{ color: 'var(--brand-red)', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{sub.label}</span>
                            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400, lineHeight: 1.4 }}>{sub.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
