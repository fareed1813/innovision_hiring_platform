import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Shield, Building2, Users, Wrench, Zap, ArrowRight,
  CheckCircle, Globe, Award, ChevronDown, ChevronRight,
  Cog, HardHat, Car, Sparkles, Briefcase
} from 'lucide-react';
import Footer from '../components/Footer';



const GlowingDivider = () => (
  <div style={{
    width: '100%', height: '2px',
    background: 'linear-gradient(to right, transparent, #EF2B2D, transparent)',
    boxShadow: '0 0 20px rgba(239,43,45,0.5)',
    margin: 0, zIndex: 10, position: 'relative'
  }} />
);

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

export default function Landing() {
  const navigate = useNavigate();
  const [expandedRole, setExpandedRole] = useState(null);
  const [dynamicRoles, setDynamicRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

          {loadingRoles ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading roles...</div>
          ) : (
            <div className="roles-grid" style={{ animation: 'fade-in-page 0.35s ease' }}>
              {dynamicRoles.map(role => (
                <div key={role._id} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
  
                  {/* Main role card */}
                  <div
                    className={`role-card domestic-role-card ${expandedRole === role._id ? 'selected' : ''}`}
                    onClick={() => {
                      if (role.subRoles && role.subRoles.length > 0) {
                        setExpandedRole(prev => prev === role._id ? null : role._id);
                      } else {
                        navigate(`/apply?role=${role._id}`);
                      }
                    }}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div className="role-card-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ICON_RENDER[role.iconKey] || ICON_RENDER['wrench']}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '16px' }}>{role.name}</h3>
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
                    {role.description && (
                      <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                        {role.description}
                      </p>
                    )}
                  </div>
  
                  {/* Sub-roles list */}
                  {expandedRole === role._id && role.subRoles && role.subRoles.length > 0 && (
                    <div className="subrole-list">
                      {role.subRoles.map(sub => (
                        <button
                          key={sub.key}
                          className="subrole-item"
                          onClick={() => navigate(`/apply?role=${role._id}&subRole=${sub.key}`)}
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
