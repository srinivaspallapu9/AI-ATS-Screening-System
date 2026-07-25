import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Jobs
  getJobs: () => axios.get(`${API_BASE}/jobs/`).then(res => res.data),
  getJobById: (id) => axios.get(`${API_BASE}/jobs/${id}`).then(res => res.data),
  createJob: (jobData) => axios.post(`${API_BASE}/jobs/`, jobData).then(res => res.data),

  // Candidate Apply
  applyCandidate: (formData) => axios.post(`${API_BASE}/candidate/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),

  getCandidateStatus: (id) => axios.get(`${API_BASE}/candidate/${id}/status`).then(res => res.data),

  // HR Dashboard
  getHRStats: () => axios.get(`${API_BASE}/hr/stats`).then(res => res.data),
  getCandidates: (params) => axios.get(`${API_BASE}/hr/candidates`, { params }).then(res => res.data),
  getCandidateDetails: (id) => axios.get(`${API_BASE}/hr/candidates/${id}`).then(res => res.data),
  updateCandidateStatus: (id, payload) => axios.put(`${API_BASE}/hr/candidates/${id}/status`, payload).then(res => res.data),

  // AI & RAG Pipeline
  ragSearch: (query, top_k = 5) => axios.post(`${API_BASE}/ai/rag-search`, { query, top_k }).then(res => res.data),

  // MCP Tools
  getMCPTools: () => axios.get(`${API_BASE}/mcp/tools`).then(res => res.data),
  executeMCPTool: (tool_name, args) => axios.post(`${API_BASE}/mcp/execute`, { tool_name, arguments: args }).then(res => res.data),
};
