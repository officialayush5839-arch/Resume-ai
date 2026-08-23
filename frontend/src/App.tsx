import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import LayoutShell from './components/layout/LayoutShell';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Candidates from './pages/Candidates';
import CandidateProfile from './pages/CandidateProfile';
import Jobs from './pages/Jobs';
import JobCandidates from './pages/JobCandidates';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:jobId/candidates" element={<JobCandidates />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ThemeAwareToaster() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: isDark
          ? {
              background: 'rgba(30, 41, 59, 0.90)',
              color: '#F8FAFC',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(99, 102, 241, 0.2)',
              borderRadius: '1rem',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 500,
            }
          : {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0F172A',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 1px 1px rgba(99, 102, 241, 0.15)',
              borderRadius: '1rem',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 500,
            },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: isDark ? '#0A0E1A' : '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: '#F43F5E',
            secondary: isDark ? '#0A0E1A' : '#FFFFFF',
          },
        },
      }}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ThemeAwareToaster />
        <LayoutShell>
          <AnimatedRoutes />
        </LayoutShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
