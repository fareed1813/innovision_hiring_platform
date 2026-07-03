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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 48px', display: 'flex', gap: '60px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        
        {/* Column 1: Logo + Description + Social */}
        <div style={{ paddingRight: '20px', maxWidth: '380px', flex: '1 1 380px' }}>
          <div style={{ display: 'inline-block', marginBottom: '32px' }}>
            <img src="/logo.png?v=2" style={{ height: '42px' }} alt="Innovision Logo" />
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#aaaaaa', marginBottom: '32px', fontWeight: 400 }}>
            Established in 2007, Innovision Global is a MEA-registered Overseas Manpower Consultancy providing skilled, unskilled & semi-skilled manpower to overseas companies across international markets worldwide.
            <a href="https://innovision.co.in/about" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-red)', textDecoration: 'none', marginLeft: '4px' }}>... read more &gt;</a>
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="https://www.facebook.com/innovision.co.in" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Facebook size={16} fill="currentColor" border="none"/></a>
            <a href="https://www.instagram.com/innovisionlimited/" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Instagram size={16} /></a>
            <a href="https://x.com/Innovision_Ltd" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s', fontFamily: '"Times New Roman", Times, serif', fontWeight: 800, fontSize: '15px', textDecoration: 'none' }}>X</a>
            <a href="https://in.linkedin.com/company/innovision-limited" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Linkedin size={16} /></a>
            <a href="https://www.youtube.com/@InnovisionLimited_" target="_blank" rel="noopener noreferrer" style={{ width:'38px', height:'38px', background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', transition: 'background 0.2s' }}><Youtube size={16} /></a>
          </div>
        </div>

        {/* Column 2: Contact */}
        <div style={{ minWidth: '420px' }}>
          <h4 style={columnTitleStyle}>CONTACT</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Phone + Mail side by side */}
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'nowrap' }}>
              {/* Phone */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#bbbbbb', lineHeight: '1.5' }}>
                <Phone size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontWeight: 400 }}>0124-4387354<br/>0124-2341602</div>
              </div>
              {/* Mail */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#bbbbbb', lineHeight: '1.5' }}>
                <Mail size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontWeight: 400, marginTop: '2px' }}>contact@innovision.co.in</div>
              </div>
            </div>

            {/* Row 2: Address */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#bbbbbb', lineHeight: '1.6' }}>
              <MapPin size={18} color="#e11d48" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontWeight: 400 }}>Plot no. 251, Udyog Vihar, Phase IV,<br/>Sector 18, Gurgaon, Haryana - 122015</div>
            </div>

          </div>
        </div>


      </div>
    </footer>
  );
}
