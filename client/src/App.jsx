import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import CandidateFlow from './pages/CandidateFlow';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100); // Slight delay ensures DOM is loaded if navigating to a new page
    } else {
      window.scrollTo(0, 0); // Scroll to top on normal route change
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <AuthProvider>
        <CustomCursor />
        <Navbar />
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'var(--font-body)', fontSize: '14px' },
          duration: 3500,
        }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/apply" element={<CandidateFlow />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
