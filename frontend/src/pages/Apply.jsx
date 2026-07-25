import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UploadCloud, CheckCircle2, AlertTriangle, XCircle, FileText, User, Mail, Phone, Briefcase, Sparkles, Loader2 } from 'lucide-react';

export default function Apply() {
  const [jobs, setJobs] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [file, setFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJobId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load active job postings. Make sure backend is running.");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or drop your resume file (PDF or DOCX).");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('job_id', selectedJobId);
      formData.append('resume', file);

      const res = await api.applyCandidate(formData);
      setResultModal(res);
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Error processing your resume application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Sparkles className="text-indigo-400" /> Candidate Application Portal
        </h1>
        <p className="page-subtitle">Submit your details and upload your resume for real-time AI & ATS screening</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-card">
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <User size={16} style={{ display: 'inline', marginRight: '6px' }} /> Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Srinivas Rao"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} /> Email Address *
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="srinivas@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} style={{ display: 'inline', marginRight: '6px' }} /> Phone Number
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Briefcase size={16} style={{ display: 'inline', marginRight: '6px' }} /> Applying For Job *
                </label>
                <select
                  className="form-select"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  required
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Upload Resume (PDF, DOCX, TXT) *</label>
              <label className="dropzone">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <UploadCloud size={48} style={{ color: '#818cf8', marginBottom: '0.75rem' }} />
                {file ? (
                  <div>
                    <strong style={{ color: '#34d399', fontSize: '1.1rem' }}>Selected: {file.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>Drag & drop your resume here, or click to browse</p>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>Supports PDF & DOCX up to 10MB</p>
                  </div>
                )}
              </label>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1, width: '100%', justifyContent: 'center', padding: '1rem' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing Resume through AI Pipeline...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} /> Submit Resume & Evaluate ATS Match
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Immediate Evaluation Result Modal */}
      {resultModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <h2>Application Processing Complete</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Candidate ID: #{resultModal.candidate_id}</p>
              </div>
              <button className="btn-secondary" onClick={() => setResultModal(null)}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
                <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>ATS Match Score</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: resultModal.ats_match_score >= 65 ? '#34d399' : '#f87171' }}>
                  {resultModal.ats_match_score}%
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Semantic keyword & skill similarity fit</p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
                <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>AI Content Probability</h4>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: resultModal.ai_content_probability >= 70 ? '#f87171' : '#60a5fa' }}>
                  {resultModal.ai_content_probability}%
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>NLP perplexity & burstiness check</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Decision Routing Status</h4>
              {resultModal.decision_status === 'AUTO_SHORTLIST' && (
                <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  <CheckCircle2 size={16} /> Shortlisted
                </span>
              )}
              {resultModal.decision_status === 'AUTO_REJECT' && (
                <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  <XCircle size={16} /> Rejected (Moved to Trash)
                </span>
              )}
              {resultModal.decision_status === 'MANUAL_REVIEW' && (
                <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  <AlertTriangle size={16} /> Under Recruiter Review
                </span>
              )}
              <p style={{ marginTop: '0.75rem', fontSize: '0.92rem', color: '#cbd5e1' }}>{resultModal.decision_reason}</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>AI Resume Summary</h4>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{resultModal.summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
