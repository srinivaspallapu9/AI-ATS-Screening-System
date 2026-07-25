import React, { useState } from 'react';
import Apply from './pages/Apply';
import HRDashboard from './pages/HRDashboard';
import Jobs from './pages/Jobs';
import Status from './pages/Status';
import { Sparkles, Users, Briefcase, Clock, ShieldCheck } from 'lucide-react';
import './styles/main.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('apply'); // 'apply', 'hr', 'jobs', 'status'

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="brand-logo">
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          <span>AI-ATS Screening System</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${currentPage === 'apply' ? 'active' : ''}`}
            onClick={() => setCurrentPage('apply')}
          >
            <Sparkles size={18} /> Apply Now
          </button>
          <button
            className={`nav-btn ${currentPage === 'hr' ? 'active' : ''}`}
            onClick={() => setCurrentPage('hr')}
          >
            <Users size={18} /> HR Dashboard
          </button>
          <button
            className={`nav-btn ${currentPage === 'jobs' ? 'active' : ''}`}
            onClick={() => setCurrentPage('jobs')}
          >
            <Briefcase size={18} /> Job Roles
          </button>
          <button
            className={`nav-btn ${currentPage === 'status' ? 'active' : ''}`}
            onClick={() => setCurrentPage('status')}
          >
            <Clock size={18} /> Application Status
          </button>
        </div>
      </nav>

      {/* Main Content View */}
      <main className="main-content">
        {currentPage === 'apply' && <Apply />}
        {currentPage === 'hr' && <HRDashboard />}
        {currentPage === 'jobs' && <Jobs />}
        {currentPage === 'status' && <Status />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
        <p>AI-Based ATS Resume Screening Engine &bull; Powered by LangChain, RAG Vector Embeddings & Model Context Protocol (MCP)</p>
      </footer>
    </div>
  );
}
