import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Building2, Users, Wrench, Zap, ArrowRight,
  CheckCircle, Globe, Award, ChevronDown, ChevronRight
} from 'lucide-react';
import Footer from '../components/Footer';

/* ─── International Roles (Category + Sub-roles) ─── */
const INTERNATIONAL_ROLES = [
  {
    key: 'facility_management',
    label: 'Facility Management',
    icon: <Building2 className="security-icon" size={32} strokeWidth={1.5} />,
    desc: 'Facility and housekeeping management roles in offices, hospitals, hotels, and commercial spaces across international postings.',
    subRoles: [
      { key: 'hk_supervisor',   label: 'HK Supervisor',                 desc: 'Supervise housekeeping staff and maintain facility cleanliness standards.' },
      { key: 'housekeeper',     label: 'Housekeeper (M/F)',             desc: 'Housekeeping and cleaning services for premium facilities.' },
      { key: 'pantry_boy',      label: 'Pantry Boy',                    desc: 'Manage pantry inventory, serve beverages, and maintain cleanliness.' },
      { key: 'office_boy',      label: 'Office Boys',                   desc: 'General office support, errands, and day-to-day administrative assistance.' },
      { key: 'me_supervisor',   label: 'M&E Supervisor',                desc: 'Supervise mechanical and electrical operations and maintenance teams.' },
      { key: 'mst',             label: 'MST (Multi Skilled Technician)', desc: 'Multi-skilled technical maintenance across mechanical, electrical, and plumbing systems.' },
      { key: 'electrician',     label: 'Electrician',                   desc: 'Electrical installation, maintenance, and repair services for commercial facilities.' },
    ],
  },
  {
    key: 'security_international',
    label: 'Security',
    icon: <Shield className="security-icon" size={32} strokeWidth={1.5} />,
    desc: 'Security personnel positions across facilities, corporates, malls, and residential complexes at international postings.',
    subRoles: [
      { key: 'security_guard',        label: 'Security Guard',          desc: 'Standard security monitoring for residential areas and retail spaces.' },
      { key: 'armed_guard',           label: 'Armed Guard',             desc: 'Specialized armed security for banks, ATMs, and high-value transports.' },
      { key: 'security_supervisor',   label: 'Security Supervisor',     desc: 'Supervise security personnel and manage shift operations efficiently.' },
      { key: 'asst_security_officer', label: 'Asst Security Officer',   desc: 'Assist in coordinating security protocols and team management.' },
      { key: 'security_officer',      label: 'Security Officer',        desc: 'Oversee overall security operations and compliance for a facility.' },
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
  const navigate = useNavigate();
  const [expandedRole, setExpandedRole] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
            MEA-registered manpower consultancy specializing in overseas workforce deployment from India to key international markets globally.
            Take a skill test with us and unlock rewarding overseas career opportunities with trusted employers.
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
              <div className="hero-stat-label">Deployed Overseas</div>
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
          <h2>International Open Roles — Select Your Category</h2>
          <p className="section-sub">
            Choose a category below and select the role that best matches your skills and experience.
          </p>

          <div className="roles-grid" style={{ animation: 'fade-in-page 0.35s ease' }}>
            {INTERNATIONAL_ROLES.map(role => (
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
                        onClick={() => navigate(`/apply?role=${role.key}&subRole=${sub.key}`)}
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
              { icon: <Globe size={24} />,       title: 'MEA Registered',      desc: 'Fully registered with the Ministry of External Affairs, Government of India for overseas recruitment.' },
              { icon: <Award size={24} />,        title: 'Premium Clients',     desc: 'Partnered with 5-star hotels, corporate campuses, and government facilities across international markets.' },
              { icon: <CheckCircle size={24} />,  title: 'End-to-End Support',  desc: 'From visa processing to travel arrangements, we handle the complete deployment lifecycle for every candidate.' },
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
