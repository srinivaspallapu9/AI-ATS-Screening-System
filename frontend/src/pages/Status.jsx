import React, { useState } from 'react';
import { api } from '../services/api';
import { Search, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

export default function Status() {
  const [candidateId, setCandidateId] = useState('');
  const [statusResult, setStatusResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCandidateStatus(candidateId);
      setStatusResult(res);
    } catch (err) {
      console.error(err);
      setError("Candidate ID not found or application is pending processing.");
      setStatusResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ justifyContent: 'center' }}>
          <Clock className="text-indigo-400" /> Application Status Lookup
        </h1>
        <p className="page-subtitle">Check the live status of your job application</p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input
            type="number"
            className="form-input"
            placeholder="Enter your Candidate Application ID (e.g. 1)"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Search size={18} /> {loading ? "Searching..." : "Track Status"}
          </button>
        </form>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '10px', textCenter: 'center' }}>
            {error}
          </div>
        )}

        {statusResult && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ color: '#818cf8', marginBottom: '0.5rem' }}>{statusResult.full_name}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Applied for: {statusResult.job_title} on {statusResult.applied_date}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ATS Match Fit</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: statusResult.ats_match_score >= 65 ? '#34d399' : '#f87171' }}>
                  {statusResult.ats_match_score}%
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI Probability</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>
                  {statusResult.ai_content_probability}%
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Status Outcome:</span>
              <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                {statusResult.decision_status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
