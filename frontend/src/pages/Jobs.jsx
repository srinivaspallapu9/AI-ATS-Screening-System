import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Briefcase, Plus, CheckCircle2, Award, ShieldAlert } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [minExperience, setMinExperience] = useState(2);
  const [description, setDescription] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(65.0);
  const [maxAiScore, setMaxAiScore] = useState(70.0);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.getJobs();
      setJobs(res);
    } catch (err) {
      console.error("Error loading jobs:", err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createJob({
        title,
        department,
        required_skills: requiredSkills,
        min_experience: Number(minExperience),
        description,
        min_match_score: Number(minMatchScore),
        max_ai_content_score: Number(maxAiScore)
      });
      setShowModal(false);
      setTitle('');
      setRequiredSkills('');
      setDescription('');
      loadJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <Briefcase className="text-indigo-400" /> Active Job Postings
          </h1>
          <p className="page-subtitle">Define target skills, experience criteria, and ATS match thresholds</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Post New Job Role
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {jobs.map((j) => (
          <div key={j.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ color: '#818cf8', fontSize: '1.2rem' }}>{j.title}</h3>
                <span className="badge badge-info">{j.department}</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {j.description}
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Required Skills:</strong>
                <div>
                  {j.required_skills.split(',').map((skill, idx) => (
                    <span key={idx} className="skill-pill">{skill.trim()}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94a3b8' }}>
              <span>Min Exp: {j.min_experience} yrs</span>
              <span>Min ATS: {j.min_match_score}%</span>
              <span>Max AI: {j.max_ai_content_score}%</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>Post New Job Description</h2>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lead Machine Learning Engineer"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Experience (Years)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (Comma separated) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Python, PyTorch, LangChain, FastAPI, Docker"
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description & Responsibilities *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Enter detailed role expectations and qualifications..."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Min Match Score Threshold (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={minMatchScore}
                    onChange={(e) => setMinMatchScore(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max AI Content Limit (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={maxAiScore}
                    onChange={(e) => setMaxAiScore(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Posting Job..." : "Publish Job Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
