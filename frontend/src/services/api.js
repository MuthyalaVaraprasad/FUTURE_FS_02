const API_URL = 'http://127.0.0.1:5000/api';

// Helper to get headers
function getHeaders() {
  const token = localStorage.getItem('crm_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to handle response
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      // response might not be JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  // Authentication
  async login(username, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('crm_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async verifyAuth() {
    const token = localStorage.getItem('crm_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      this.logout();
      return null;
    }
  },

  // Public Form Submission
  async submitPublicLead(leadData) {
    const res = await fetch(`${API_URL}/leads/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    return await handleResponse(res);
  },

  // Leads CRUD
  async getLeads(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.source && filters.source !== 'all') params.append('source', filters.source);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.order) params.append('order', filters.order);

    const res = await fetch(`${API_URL}/leads?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async getLead(id) {
    const res = await fetch(`${API_URL}/leads/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async createLead(leadData) {
    const res = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(leadData)
    });
    return await handleResponse(res);
  },

  async updateLead(id, leadData) {
    const res = await fetch(`${API_URL}/leads/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(leadData)
    });
    return await handleResponse(res);
  },

  async deleteLead(id) {
    const res = await fetch(`${API_URL}/leads/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Notes
  async getNotes(leadId) {
    const res = await fetch(`${API_URL}/leads/${leadId}/notes`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  async addNote(leadId, content) {
    const res = await fetch(`${API_URL}/leads/${leadId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    });
    return await handleResponse(res);
  },

  async deleteNote(leadId, noteId) {
    const res = await fetch(`${API_URL}/leads/${leadId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Timeline Activity
  async getTimeline(leadId) {
    const res = await fetch(`${API_URL}/leads/${leadId}/timeline`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Bulk Operations
  async bulkDeleteLeads(ids) {
    const res = await fetch(`${API_URL}/leads/bulk-delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids })
    });
    return await handleResponse(res);
  },

  async bulkUpdateLeads(ids, status) {
    const res = await fetch(`${API_URL}/leads/bulk-update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids, status })
    });
    return await handleResponse(res);
  },

  async bulkImportLeads(leads) {
    const res = await fetch(`${API_URL}/leads/bulk-import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ leads })
    });
    return await handleResponse(res);
  },

  // Developer Seeding
  async seedMockData() {
    const res = await fetch(`${API_URL}/leads/mock-seed`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Analytics Metrics
  async getAnalyticsStats() {
    const res = await fetch(`${API_URL}/leads/stats`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(res);
  },

  // Global activity audit logs
  async getGlobalActivity() {
    const res = await fetch(`${API_URL}/leads/activity/global`, {
      method: 'GET',
      headers: getHeaders()
    });
    return await handleResponse(res);
  }
};
