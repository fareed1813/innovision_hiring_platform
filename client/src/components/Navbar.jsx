import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const [solid, setSolid] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeHash, setActiveHash] = useState(location.hash || '');

  useEffect(() => {
    setActiveHash(location.hash || '');
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Always solid on non-landing pages
  const isLanding = location.pathname === '/';
  const navClass = (!isLanding || solid) ? 'navbar solid' : 'navbar transparent';

  const handleScroll = (e, targetId) => {
    if (isLanding) {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
        window.history.pushState(null, '', `/#${targetId}`);
        setActiveHash(`#${targetId}`);
      }
    } else {
      e.preventDefault();
      softNavigate(`/#${targetId}`);
    }
  };

  const softNavigate = (path) => {
    if (!document.startViewTransition) {
      navigate(path);
      return;
    }
    document.startViewTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav className={navClass}>
      <div className="nav-inner">
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => { e.preventDefault(); softNavigate('/'); }}>
          <img src="/logo.png?v=2" alt="Innovision Logo" style={{ height: '60px', width: 'auto' }} />
        </Link>

        <ul className="nav-links">
          <li><Link to="/" className={location.pathname === '/' && !activeHash ? 'active' : ''} onClick={(e) => { if (isLanding) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); window.history.pushState(null, '', '/'); setActiveHash(''); } else { e.preventDefault(); softNavigate('/'); } }}>Home</Link></li>
          <li><Link to="/#roles" className={activeHash === '#roles' || location.pathname.startsWith('/apply') ? 'active' : ''} onClick={(e) => handleScroll(e, 'roles')}>Apply Now</Link></li>
          <li><Link to="/#about" className={activeHash === '#about' ? 'active' : ''} onClick={(e) => handleScroll(e, 'about')}>About</Link></li>
          <li><Link to="/#contact" className={activeHash === '#contact' ? 'active' : ''} onClick={(e) => handleScroll(e, 'contact')}>Contact</Link></li>
        </ul>

        <div className="nav-cta">
          {isAuthenticated ? (
            <>
              <Link to="/admin" className="btn btn-ghost btn-sm">DASHBOARD</Link>
              <button 
                onClick={logout} 
                className="btn btn-primary btn-sm" 
                style={{ gap: '8px', boxShadow: '0 4px 12px rgba(209,43,43,0.2)' }}
              >
                <LogOut size={14} /> LOGOUT
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="btn btn-primary btn-sm">Admin Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
