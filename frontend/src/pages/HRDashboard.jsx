import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Search, Filter, Mail,
  Brain, FileText, Cpu, Sparkles, RefreshCw, Send, ArrowRight, ShieldAlert, Award
} from 'lucide-react';

export default function HRDashboard() {
  const [stats, setStats] = useState({ total_candidates: 0, shortlisted: 0, rejected: 0, pending: 0, ai_flagged: 0, avg_ats_score: 0 });
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'rag', 'mcp'

  // Filters
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiFlaggedOnly, setAiFlaggedOnly] = useState(false);

  // Selected Candidate Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [statusUpdateReason, setStatusUpdateReason] = useState('');

  // RAG Search State
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);

  // MCP State
  const [mcpTools, setMcpTools] = useState([]);
  const [mcpResponse, setMcpResponse] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedJob, selectedStatus, aiFlaggedOnly]);

  const loadDashboardData = async () => {
    try {
      const statsRes = await api.getHRStats();
      setStats(statsRes);

      const jobsRes = await api.getJobs();
      setJobs(jobsRes);

      const params = {};
      if (selectedJob) params.job_id = selectedJob;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (aiFlaggedOnly) params.ai_flagged = true;
      if (searchTerm) params.search = searchTerm;

      const candidatesRes = await api.getCandidates(params);
      setCandidates(candidatesRes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDashboardData();
  };

  const openCandidateDetails = async (id) => {
    try {
      const data = await api.getCandidateDetails(id);
      setSelectedCandidate(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedCandidate) return;
    try {
      await api.updateCandidateStatus(selectedCandidate.id, {
        status: newStatus,
        reason: statusUpdateReason || `Recruiter manually changed status to ${newStatus}`
      });
      setStatusUpdateReason('');
      openCandidateDetails(selectedCandidate.id);
      loadDashboardData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleRAGSearch = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    try {
      const res = await api.ragSearch(ragQuery, 5);
      setRagResults(res.results || []);
    } catch (err) {
      console.error("RAG search error:", err);
    } finally {
      setRagLoading(false);
    }
  };

  const loadMCPTools = async () => {
    try {
      const res = await api.getMCPTools();
      setMcpTools(res.tools || []);
    } catch (err) {
      console.error("MCP tools error:", err);
    }
  };

  const runMCPTool = async (toolName) => {
    try {
      let args = {};
      if (toolName === "search_candidates_rag") {
        args = { query: "Python FastAPI Developer", top_k: 3 };
      } else if (toolName === "evaluate_job_match") {
        args = {
          resume_text: "Experienced Python Engineer with FastAPI and Docker skills.",
          job_description: "Senior Python Backend Engineer role",
          required_skills: "Python, FastAPI, Docker"
        };
      }
      const res = await api.executeMCPTool(toolName, args);
      setMcpResponse({ tool: toolName, response: res });
    } catch (err) {
      console.error("MCP execution error:", err);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <Brain className="text-indigo-400" /> HR Recruiter Intelligence Dashboard
          </h1>
          <p className="page-subtitle">Real-time candidate screening, ATS score metrics, AI detection, and LangChain RAG vector search</p>
        </div>
        <button className="btn-secondary" onClick={loadDashboardData}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Top Metrics Header */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.total_candidates}</div>
            <div className="stat-lbl">Total Applicants</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.shortlisted}</div>
            <div className="stat-lbl">Shortlisted / Interview</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.rejected}</div>
            <div className="stat-lbl">Rejected / Trash</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.ai_flagged}</div>
            <div className="stat-lbl">Excess AI Flags</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.avg_ats_score}%</div>
            <div className="stat-lbl">Avg ATS Score</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          className={`nav-btn ${activeTab === 'candidates' ? 'active' : ''}`}
          onClick={() => setActiveTab('candidates')}
        >
          <Users size={18} /> Candidate Applications ({candidates.length})
        </button>
        <button
          className={`nav-btn ${activeTab === 'rag' ? 'active' : ''}`}
          onClick={() => setActiveTab('rag')}
        >
          <Sparkles size={18} /> LangChain RAG Candidate Search
        </button>
        <button
          className={`nav-btn ${activeTab === 'mcp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('mcp'); loadMCPTools(); }}
        >
          <Cpu size={18} /> Model Context Protocol (MCP) Tools
        </button>
      </div>

      {/* TAB 1: CANDIDATES LIST */}
      {activeTab === 'candidates' && (
        <div className="glass-card">
          {/* Filters Control Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto auto', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search candidates by name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <select className="form-select" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
              <option value="">All Job Roles</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            <select className="form-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="AUTO_SHORTLIST">Auto Shortlisted</option>
              <option value="INTERVIEW">Interview Scheduled</option>
              <option value="MANUAL_REVIEW">Manual Review</option>
              <option value="AUTO_REJECT">Auto Rejected</option>
              <option value="MANUAL_REJECT">Manually Rejected</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={aiFlaggedOnly}
                onChange={(e) => setAiFlaggedOnly(e.target.checked)}
              />
              High AI Risk Only
            </label>

            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
              <Filter size={16} /> Filter
            </button>
          </form>

          {/* Table */}
          {candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No candidates found matching the active filter criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Target Job</th>
                    <th>ATS Match Fit</th>
                    <th>AI Probability</th>
                    <th>Decision Status</th>
                    <th>Applied Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ display: 'block', color: 'white' }}>{c.full_name}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c.email}</span>
                      </td>
                      <td>{c.job_title}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <strong style={{ width: '40px', textAlign: 'right', color: c.ats_match_score >= 65 ? '#34d399' : '#f87171' }}>
                            {c.ats_match_score}%
                          </strong>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${c.ats_match_score}%`,
                                background: c.ats_match_score >= 65 ? 'var(--success-gradient)' : 'var(--danger-gradient)'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.is_ai_flagged ? 'badge-danger' : c.ai_content_probability >= 50 ? 'badge-warning' : 'badge-info'}`}>
                          {c.ai_content_probability}% AI
                        </span>
                      </td>
                      <td>
                        {c.decision_status.includes('SHORTLIST') && (
                          <span className="badge badge-success"><CheckCircle2 size={14} /> {c.decision_status}</span>
                        )}
                        {c.decision_status === 'INTERVIEW' && (
                          <span className="badge badge-success" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}><Mail size={14} /> INTERVIEW</span>
                        )}
                        {c.decision_status.includes('REJECT') && (
                          <span className="badge badge-danger"><XCircle size={14} /> {c.decision_status}</span>
                        )}
                        {c.decision_status === 'MANUAL_REVIEW' && (
                          <span className="badge badge-warning"><AlertTriangle size={14} /> REVIEW</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{c.created_at}</td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openCandidateDetails(c.id)}>
                          Review Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LANGCHAIN RAG VECTOR SEARCH */}
      {activeTab === 'rag' && (
        <div className="glass-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3><Sparkles className="text-indigo-400" style={{ display: 'inline', marginRight: '8px' }} /> LangChain Vector RAG Query Engine</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
              Query candidate resume embeddings using natural language (e.g. "Find candidates with experience in FastAPI and Docker who built scalable backend microservices").
            </p>
          </div>

          <form onSubmit={handleRAGSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ask RAG search engine..."
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={ragLoading}>
              {ragLoading ? "Searching Vector Index..." : "Run RAG Query"}
            </button>
          </form>

          {ragResults.length > 0 && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {ragResults.map((r, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#818cf8', fontSize: '1.1rem' }}>{r.candidate_name} (Candidate #{r.candidate_id})</h4>
                    <span className="badge badge-success">Vector Similarity: {r.relevance_score}%</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '0.5rem' }}>Skills: {r.skills}</p>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{r.snippet}</p>
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <button className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openCandidateDetails(r.candidate_id)}>
                      Open Full Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MCP TOOLS PROTOCOL */}
      {activeTab === 'mcp' && (
        <div className="glass-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3><Cpu className="text-indigo-400" style={{ display: 'inline', marginRight: '8px' }} /> Model Context Protocol (MCP) Integration</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
              Exposes standard MCP tool definitions to allow external AI assistants (like Claude, Gemini, or custom agents) to invoke ATS functions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#818cf8' }}>Discovered MCP Tools ({mcpTools.length})</h4>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {mcpTools.map((t, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#34d399' }}>{t.name}</strong>
                      <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }} onClick={() => runMCPTool(t.name)}>
                        Test Tool
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>{t.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '1rem', color: '#818cf8' }}>Tool Output Log</h4>
              <div style={{ background: '#090d16', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px', minHeight: '250px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#a7f3d0' }}>
                {mcpResponse ? (
                  <pre>{JSON.stringify(mcpResponse, null, 2)}</pre>
                ) : (
                  <span style={{ color: '#64748b' }}>Click "Test Tool" to execute an MCP protocol action...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS MODAL */}
      {selectedCandidate && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <h2>{selectedCandidate.full_name}</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{selectedCandidate.email} • {selectedCandidate.phone || 'No phone'} • Applying for: {selectedCandidate.job_title}</p>
              </div>
              <button className="btn-secondary" onClick={() => setSelectedCandidate(null)}>Close</button>
            </div>

            {/* Score & Risk Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ATS Match Fit</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: selectedCandidate.ats_match_score >= 65 ? '#34d399' : '#f87171' }}>
                  {selectedCandidate.ats_match_score}%
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI Content Probability</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: selectedCandidate.is_ai_flagged ? '#f87171' : '#60a5fa' }}>
                  {selectedCandidate.ai_content_probability}%
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className="badge badge-info">{selectedCandidate.decision_status}</span>
                </div>
              </div>
            </div>

            {/* Skills Breakdown */}
            {selectedCandidate.match_breakdown?.match_result && (
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>Skill Match Breakdown</h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#34d399' }}>Matched Skills: </strong>
                  {selectedCandidate.match_breakdown.match_result.matched_skills?.map((s, i) => (
                    <span key={i} className="skill-pill skill-pill-match">{s}</span>
                  ))}
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#f87171' }}>Missing Skills: </strong>
                  {selectedCandidate.match_breakdown.match_result.missing_skills?.map((s, i) => (
                    <span key={i} className="skill-pill skill-pill-missing">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Summary */}
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Executive Resume Summary</h4>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>{selectedCandidate.summary}</p>
            </div>

            {/* Manual Recruiter Actions */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-glow)', padding: '1.25rem', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '0.75rem', color: '#818cf8' }}>Recruiter Manual Actions & Automated Email Trigger</h4>
              <input
                type="text"
                className="form-input"
                placeholder="Optional notes or interview details to include in candidate email..."
                value={statusUpdateReason}
                onChange={(e) => setStatusUpdateReason(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-success" onClick={() => handleStatusChange('INTERVIEW')}>
                  <Mail size={16} /> Schedule Interview
                </button>
                <button className="btn-primary" onClick={() => handleStatusChange('MANUAL_SHORTLIST')}>
                  <CheckCircle2 size={16} /> Mark Shortlisted
                </button>
                <button className="btn-danger" onClick={() => handleStatusChange('MANUAL_REJECT')}>
                  <XCircle size={16} /> Reject Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
