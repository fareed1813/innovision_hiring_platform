import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube, ArrowRight } from 'lucide-react';

export default function Footer() {
  const columnTitleStyle = {
    color: '#fff',
    borderLeft: '3px solid var(--brand-red)',
    paddingLeft: '12px',
    marginBottom: '28px',
    fontSize: '14px',
    letterSpacing: '0.15em',
    fontWeight: 700,
    textTransform: 'uppercase'
  };

  const linkStyle = {
    color: '#bbbbbb',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    lineHeight: '1.6',
    transition: 'color 0.2s',
    fontWeight: 400
  };

  return (
    <footer id="contact" style={{ background: 'linear-gradient(to bottom, #0b0b0d, #111113, #000000)', color: '#e5e5e5', paddingTop: '80px', paddingBottom: '30px', borderTop: 'none', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1fr 1fr', gap: '30px' }}>
        
        {/* Column 1: Logo + Description + Social */}
        <div style={{ paddingRight: '20px' }}>
          <div style={{ display: 'inline-block', marginBottom: '32px' }}>
            <img src="/logo.png?v=2" style={{ height: '42px' }} alt="Innovision Logo" />
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#aaaaaa', marginBottom: '32px', fontWeight: 400 }}>
            Established in 2007, Innovision has evolved into one of India's prominent toll management and infrastructure operations companies, delivering nationwide manpower solutions and skilled workforce services through structured systems and disciplined execution
            <a href="https://innovision.co.in/about" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-red)', textDecoration: 'none', marginLeft: '4px' }}>... read more &gt;</a>
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="https://www.facebook.com/innovision.co.in" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Facebook size={16} fill="currentColor" border="none"/></a>
            <a href="https://www.instagram.com/innovisionlimited/" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Instagram size={16} /></a>
            <a href="https://x.com/Innovision_Ltd" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s', fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}>X</a>
            <a href="https://in.linkedin.com/company/innovision-limited" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Linkedin size={16} /></a>
            <a href="https://www.youtube.com/@InnovisionLimited_" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Youtube size={16} /></a>
          </div>
        </div>

        {/* Column 2: Contact */}
        <div>
          <h4 style={columnTitleStyle}>CONTACT</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <li style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#bbbbbb', lineHeight: '1.5' }}>
              <div style={{ background: 'transparent', width: '24px', display: 'flex', justifyContent: 'center' }}>
                <Phone size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
              </div>
              <div style={{ fontWeight: 400 }}>0124-4387354<br/>0124-2341602</div>
            </li>
            <li style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#bbbbbb', lineHeight: '1.5' }}>
              <div style={{ background: 'transparent', width: '24px', display: 'flex', justifyContent: 'center' }}>
                <Mail size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
              </div>
              <div style={{ fontWeight: 400, marginTop: '2px' }}>contact@innovision.co.in</div>
            </li>
            <li style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#bbbbbb', lineHeight: '1.6' }}>
              <div style={{ background: 'transparent', width: '24px', display: 'flex', justifyContent: 'center' }}>
                <MapPin size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
              </div>
              <div style={{ fontWeight: 400 }}>Plot no. 251, Udyog<br/>Vihar, Phase IV,<br/>Sector 18, Gurgaon,<br/>Haryana - 122015</div>
            </li>
          </ul>
        </div>

        {/* Column 3: Quick Links */}
        <div>
          <h4 style={columnTitleStyle}>QUICK LINKS</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <li><a href="https://innovision.co.in" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Quick Links Page</span></a></li>
            <li><a href="https://innovision.co.in/services" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Toll Plaza Management</span></a></li>
            <li><a href="https://innovision.co.in/services" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Manned Private Security Services</span></a></li>
            <li><a href="https://innovision.co.in/services" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Integrated Facility Management</span></a></li>
            <li><a href="https://innovision.co.in/services" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Skill Development</span></a></li>
            <li><a href="https://innovision.co.in/services" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Manpower Sourcing & Payroll</span></a></li>
            <li><a href="/" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Overseas Recruitment</span></a></li>
          </ul>
        </div>

        {/* Column 4: Subsidiaries */}
        <div>
          <h4 style={columnTitleStyle}>SUBSIDIARIES</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <li><a href="https://innovision.co.in" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span style={{ width: '150px' }}>CSR Project - Woke India</span></a></li>
            <li><a href="https://innovision.co.in" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span style={{ width: '150px' }}>Innovision International</span></a></li>
            <li><a href="https://innovision.co.in" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span style={{ width: '150px' }}>Aerodrone Robotics</span></a></li>
            <li><a href="https://innovision.co.in" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span style={{ width: '150px' }}>Innovision HR Consultancy</span></a></li>
          </ul>
        </div>

        {/* Column 5: Investor */}
        <div>
          <h4 style={columnTitleStyle}>INVESTOR</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <li><a href="https://innovision.co.in/investors" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Financial Statements</span></a></li>
            <li><a href="https://innovision.co.in/investors" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>Annual Return</span></a></li>
            <li><a href="https://innovision.co.in/investors" target="_blank" rel="noopener noreferrer" style={linkStyle}><ArrowRight size={16} strokeWidth={1.5} style={{ marginTop: '3px', opacity: 0.8 }} /> <span>IPO Audio Visual</span></a></li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
