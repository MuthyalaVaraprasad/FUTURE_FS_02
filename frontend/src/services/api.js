const API_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:5000/api'
  : '/api';

// LocalStorage Keys
const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';
const LOCAL_DB_KEY = 'crm_offline_db';

// Helper to get headers
function getHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
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

// Default Offline Database Seeding Records
const defaultOfflineDb = {
  leads: [
    { id: 1001, name: 'Alex Johnson', email: 'alex@cloudtech.io', phone: '+1 555-0199', company: 'CloudTech Solutions', source: 'Website', status: 'new', value: 8500, probability: 20, tags: 'High Value, Tech Stack: React', followup_date: '', bant_budget: 0, bant_authority: 0, bant_need: 1, bant_timeline: 0, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1002, name: 'Sarah Miller', email: 'sarah@designlab.co', phone: '+1 555-0142', company: 'DesignLab Studio', source: 'Social Media', status: 'contacted', value: 3200, probability: 40, tags: 'Warm Lead, UI Design', followup_date: '2026-07-10', bant_budget: 1, bant_authority: 0, bant_need: 1, bant_timeline: 1, created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1003, name: 'Michael Chang', email: 'm.chang@apexcorp.com', phone: '+852 2891-3000', company: 'Apex Global Corp', source: 'Referral', status: 'proposal', value: 25000, probability: 70, tags: 'Enterprise, VIP Client', followup_date: '2026-07-08', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 0, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1004, name: 'Emma Watson', email: 'emma@watsonretail.com', phone: '+44 20 7946 0958', company: 'Watson Retail Group', source: 'Cold Call', status: 'converted', value: 12000, probability: 100, tags: 'E-commerce, Retail', followup_date: '', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1, created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1005, name: 'David Smith', email: 'dsmith@financesmart.com', phone: '+1 555-0187', company: 'FinanceSmart LLC', source: 'Website', status: 'lost', value: 6400, probability: 0, tags: 'Budget Constrained', followup_date: '', bant_budget: 0, bant_authority: 1, bant_need: 1, bant_timeline: 0, created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1006, name: 'Chloe Davis', email: 'chloe@healthplus.org', phone: '+1 555-0112', company: 'HealthPlus Network', source: 'Social Media', status: 'new', value: 14500, probability: 30, tags: 'Healthcare, Urgent', followup_date: '2026-07-07', bant_budget: 1, bant_authority: 0, bant_need: 0, bant_timeline: 1, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1007, name: 'Robert Downey', email: 'robert@starkmedia.com', phone: '+1 555-9999', company: 'Stark Media Agency', source: 'Referral', status: 'proposal', value: 35000, probability: 80, tags: 'High Value, Retainer', followup_date: '2026-07-06', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1008, name: 'Jessica Alba', email: 'jessica@honestco.com', phone: '+1 555-0888', company: 'The Honest Company', source: 'Website', status: 'contacted', value: 9800, probability: 50, tags: 'Warm Lead, Shopify', followup_date: '2026-07-15', bant_budget: 0, bant_authority: 1, bant_need: 1, bant_timeline: 1, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1009, name: 'Elon Musk', email: 'elon@x.corp', phone: '+1 555-0042', company: 'X Corp', source: 'Cold Call', status: 'new', value: 150000, probability: 10, tags: 'Whale, AI App', followup_date: '', bant_budget: 1, bant_authority: 0, bant_need: 1, bant_timeline: 0, created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 1010, name: 'Peter Parker', email: 'peter@dailybugle.com', phone: '+1 555-0100', company: 'Daily Bugle', source: 'Social Media', status: 'converted', value: 1500, probability: 100, tags: 'Photography, Media', followup_date: '', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1, created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  notes: [
    { id: 2001, lead_id: 1001, content: '[Inquiry] Ingested from online form query.', created_at: new Date().toISOString() },
    { id: 2002, lead_id: 1002, content: '[Discovery] Warm call done. Interested in React.', created_at: new Date().toISOString() }
  ],
  activity_log: [
    { id: 3001, lead_id: 1001, action: 'Lead created via Website Form.', created_at: new Date().toISOString() },
    { id: 3002, lead_id: 1002, action: 'Completed discovery phone call.', created_at: new Date().toISOString() }
  ]
};

// Syncing functions
function getLocalDb() {
  const raw = localStorage.getItem(LOCAL_DB_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(defaultOfflineDb));
    return defaultOfflineDb;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return defaultOfflineDb;
  }
}

function saveLocalDb(db) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

// Exportable API client
export const api = {
  // Authentication
  async login(username, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        // Fallback offline admin check
        if (username === 'admin' && password === 'admin123') {
          const user = { id: 1, username: 'admin', role: 'admin' };
          const mockToken = 'mock-offline-token-' + Date.now();
          localStorage.setItem(TOKEN_KEY, mockToken);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return { message: 'Logged in locally (Offline Mode)', token: mockToken, user };
        } else {
          throw new Error('Invalid username or password.');
        }
      }
      throw err;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  async verifyAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (token.startsWith('mock-offline-token-') || err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
      }
      this.logout();
      return null;
    }
  },

  // Public Form Submission
  async submitPublicLead(leadData) {
    try {
      const res = await fetch(`${API_URL}/leads/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const newLead = {
          id: newId,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone || '',
          company: leadData.company || '',
          source: leadData.source || 'Website',
          status: 'new',
          value: parseFloat(leadData.value) || 0,
          probability: 20,
          tags: 'New Lead',
          followup_date: '',
          bant_budget: 0,
          bant_authority: 0,
          bant_need: 0,
          bant_timeline: 0,
          created_at: new Date().toISOString()
        };
        db.leads.push(newLead);
        
        // Add note
        if (leadData.message) {
          db.notes.push({
            id: Date.now(),
            lead_id: newId,
            content: `[Message] ${leadData.message}`,
            created_at: new Date().toISOString()
          });
        }
        
        // Add activity log
        db.activity_log.unshift({
          id: Date.now() + 1,
          lead_id: newId,
          action: `Lead created via Public ${newLead.source} Ingestion Form.`,
          created_at: new Date().toISOString()
        });
        
        saveLocalDb(db);
        return { message: 'Inquiry submitted successfully locally!', leadId: newId };
      }
      throw err;
    }
  },

  // Leads CRUD
  async getLeads(filters = {}) {
    try {
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
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        let result = [...db.leads];

        if (filters.search) {
          const query = filters.search.toLowerCase();
          result = result.filter(l => 
            l.name.toLowerCase().includes(query) ||
            l.email.toLowerCase().includes(query) ||
            (l.company && l.company.toLowerCase().includes(query)) ||
            (l.tags && l.tags.toLowerCase().includes(query))
          );
        }

        if (filters.status && filters.status !== 'all') {
          result = result.filter(l => l.status === filters.status);
        }

        if (filters.source && filters.source !== 'all') {
          result = result.filter(l => l.source === filters.source);
        }

        if (filters.sort_by) {
          const col = filters.sort_by;
          const isAsc = filters.order === 'asc';
          result.sort((a, b) => {
            let valA = a[col];
            let valB = b[col];
            if (col === 'value' || col === 'probability') {
              valA = parseFloat(valA) || 0;
              valB = parseFloat(valB) || 0;
            } else {
              valA = (valA || '').toString().toLowerCase();
              valB = (valB || '').toString().toLowerCase();
            }
            if (valA < valB) return isAsc ? -1 : 1;
            if (valA > valB) return isAsc ? 1 : -1;
            return 0;
          });
        }

        return result;
      }
      throw err;
    }
  },

  async getLead(id) {
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const found = db.leads.find(l => l.id === parseInt(id));
        if (!found) throw new Error('Lead not found.');
        return found;
      }
      throw err;
    }
  },

  async createLead(leadData) {
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(leadData)
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const newLead = {
          id: newId,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone || '',
          company: leadData.company || '',
          source: leadData.source || 'Manual Entry',
          status: leadData.status || 'new',
          value: parseFloat(leadData.value) || 0,
          probability: parseInt(leadData.probability) || 20,
          tags: leadData.tags || '',
          followup_date: leadData.followup_date || '',
          bant_budget: parseInt(leadData.bant_budget) || 0,
          bant_authority: parseInt(leadData.bant_authority) || 0,
          bant_need: parseInt(leadData.bant_need) || 0,
          bant_timeline: parseInt(leadData.bant_timeline) || 0,
          created_at: new Date().toISOString()
        };
        db.leads.push(newLead);
        
        db.activity_log.unshift({
          id: Date.now(),
          lead_id: newId,
          action: 'Lead created manually (Offline).',
          created_at: new Date().toISOString()
        });

        saveLocalDb(db);
        return { message: 'Lead created successfully', leadId: newId };
      }
      throw err;
    }
  },

  async updateLead(id, leadData) {
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(leadData)
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const idx = db.leads.findIndex(l => l.id === parseInt(id));
        if (idx === -1) throw new Error('Lead not found.');
        
        const oldLead = db.leads[idx];
        db.leads[idx] = {
          ...oldLead,
          ...leadData,
          id: oldLead.id,
          value: parseFloat(leadData.value) || 0,
          probability: parseInt(leadData.probability) || 0
        };

        if (oldLead.status !== leadData.status) {
          db.activity_log.unshift({
            id: Date.now(),
            lead_id: oldLead.id,
            action: `Status changed from '${oldLead.status}' to '${leadData.status}' (Offline).`,
            created_at: new Date().toISOString()
          });
        }

        saveLocalDb(db);
        return { message: 'Lead updated successfully.' };
      }
      throw err;
    }
  },

  async deleteLead(id) {
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        db.leads = db.leads.filter(l => l.id !== parseInt(id));
        db.notes = db.notes.filter(n => n.lead_id !== parseInt(id));
        db.activity_log = db.activity_log.filter(a => a.lead_id !== parseInt(id));
        saveLocalDb(db);
        return { message: 'Lead deleted successfully.' };
      }
      throw err;
    }
  },

  // Notes
  async getNotes(leadId) {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/notes`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        return db.notes
          .filter(n => n.lead_id === parseInt(leadId))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      throw err;
    }
  },

  async addNote(leadId, content) {
    // Normalization: Ensure content sent to the server is always a string.
    // If we receive an object (e.g. { content, category }), extract its content string.
    let noteText = content;
    if (content && typeof content === 'object') {
      noteText = content.content || '';
    }

    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: noteText })
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const newNote = {
          id: Date.now(),
          lead_id: parseInt(leadId),
          content: noteText,
          created_at: new Date().toISOString()
        };
        db.notes.push(newNote);
        
        db.activity_log.unshift({
          id: Date.now() + 1,
          lead_id: parseInt(leadId),
          action: `Added follow-up note locally.`,
          created_at: new Date().toISOString()
        });

        saveLocalDb(db);
        return { message: 'Note added successfully locally.' };
      }
      throw err;
    }
  },

  async deleteNote(leadId, noteId) {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        db.notes = db.notes.filter(n => !(n.id === parseInt(noteId) && n.lead_id === parseInt(leadId)));
        saveLocalDb(db);
        return { message: 'Note deleted successfully.' };
      }
      throw err;
    }
  },

  // Timeline Activity
  async getTimeline(leadId) {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/timeline`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        return db.activity_log.filter(a => a.lead_id === parseInt(leadId));
      }
      throw err;
    }
  },

  // Bulk Operations
  async bulkDeleteLeads(ids) {
    try {
      const res = await fetch(`${API_URL}/leads/bulk-delete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids })
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const numericIds = ids.map(id => parseInt(id));
        db.leads = db.leads.filter(l => !numericIds.includes(l.id));
        db.notes = db.notes.filter(n => !numericIds.includes(n.lead_id));
        db.activity_log = db.activity_log.filter(a => !numericIds.includes(a.lead_id));
        saveLocalDb(db);
        return { message: `Successfully deleted ${ids.length} leads.` };
      }
      throw err;
    }
  },

  async bulkUpdateLeads(ids, status) {
    try {
      const res = await fetch(`${API_URL}/leads/bulk-update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids, status })
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const numericIds = ids.map(id => parseInt(id));
        db.leads = db.leads.map(l => numericIds.includes(l.id) ? { ...l, status } : l);
        
        numericIds.forEach(id => {
          db.activity_log.unshift({
            id: Date.now() + Math.floor(Math.random() * 100),
            lead_id: id,
            action: `Bulk status updated to '${status}' (Offline).`,
            created_at: new Date().toISOString()
          });
        });

        saveLocalDb(db);
        return { message: `Successfully updated ${ids.length} leads.` };
      }
      throw err;
    }
  },

  async bulkImportLeads(leads) {
    try {
      const res = await fetch(`${API_URL}/leads/bulk-import`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ leads })
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        leads.forEach(l => {
          const newId = Date.now() + Math.floor(Math.random() * 1000);
          db.leads.push({
            id: newId,
            name: l.name,
            email: l.email,
            phone: l.phone || '',
            company: l.company || '',
            source: l.source || 'CSV Import',
            status: l.status || 'new',
            value: parseFloat(l.value) || 0,
            probability: parseInt(l.probability) || 20,
            tags: l.tags || '',
            followup_date: l.followup_date || '',
            created_at: new Date().toISOString()
          });
          
          db.activity_log.unshift({
            id: Date.now(),
            lead_id: newId,
            action: 'Lead imported locally.',
            created_at: new Date().toISOString()
          });
        });
        
        saveLocalDb(db);
        return { message: `Imported ${leads.length} leads successfully.` };
      }
      throw err;
    }
  },

  // Developer Seeding
  async seedMockData() {
    try {
      const res = await fetch(`${API_URL}/leads/mock-seed`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        // Reset local DB to defaults plus additional seeded mock profiles
        const db = {
          leads: [
            ...defaultOfflineDb.leads,
            { id: 1011, name: 'Bruce Wayne', email: 'bruce@wayneent.com', phone: '+1 555-0007', company: 'Wayne Enterprises', source: 'Referral', status: 'new', value: 500000, probability: 20, tags: 'Whale, Secure App', followup_date: '2026-07-20', bant_budget: 1, bant_authority: 0, bant_need: 1, bant_timeline: 0, created_at: new Date().toISOString() },
            { id: 1012, name: 'Diana Prince', email: 'diana@themuseum.org', phone: '+1 555-0182', company: 'Themyscira Museum', source: 'Website', status: 'contacted', value: 5000, probability: 45, tags: 'Education, Warm Lead', followup_date: '2026-07-14', bant_budget: 0, bant_authority: 0, bant_need: 1, bant_timeline: 1, created_at: new Date().toISOString() },
            { id: 1013, name: 'Tony Stark', email: 'tony@starkindustries.com', phone: '+1 555-3000', company: 'Stark Industries', source: 'Referral', status: 'converted', value: 85000, probability: 100, tags: 'Robotics, IoT', followup_date: '', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1, created_at: new Date().toISOString() },
            { id: 1014, name: 'Clark Kent', email: 'clark@dailyplanet.com', phone: '+1 555-0121', company: 'Daily Planet Press', source: 'Cold Call', status: 'lost', value: 2400, probability: 0, tags: 'Competitor Chosen', followup_date: '', bant_budget: 0, bant_authority: 0, bant_need: 1, bant_timeline: 0, created_at: new Date().toISOString() },
            { id: 1015, name: 'Steve Rogers', email: 'steve@shield.gov', phone: '+1 555-1941', company: 'SHIELD Public Relations', source: 'Social Media', status: 'proposal', value: 18000, probability: 60, tags: 'Government, Long Cycle', followup_date: '2026-07-09', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 0, created_at: new Date().toISOString() }
          ],
          notes: [...defaultOfflineDb.notes],
          activity_log: [...defaultOfflineDb.activity_log]
        };
        saveLocalDb(db);
        return { message: 'Mock data seeded locally successfully! 15 realistic leads loaded.' };
      }
      throw err;
    }
  },

  // Analytics Metrics
  async getAnalyticsStats() {
    try {
      const res = await fetch(`${API_URL}/leads/stats`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        const leads = db.leads;
        
        const total = leads.length;
        const converted = leads.filter(l => l.status === 'converted').length;
        const newLeads = leads.filter(l => l.status === 'new').length;
        const contactedLeads = leads.filter(l => l.status === 'contacted').length;
        const proposalsPending = leads.filter(l => l.status === 'proposal').length;
        
        const totalPipelineValue = leads.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
        const weightedPipelineValue = leads.reduce((sum, l) => sum + ((parseFloat(l.value) || 0) * ((parseInt(l.probability) || 20) / 100)), 0);
        const actualRevenue = leads.filter(l => l.status === 'converted').reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);

        // Group by Source
        const sourceCounts = {};
        leads.forEach(l => {
          const src = l.source || 'Website';
          sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        });
        const sources = Object.keys(sourceCounts).map(k => ({ source: k, count: sourceCounts[k] }));

        // Group by Status
        const statusCounts = {};
        leads.forEach(l => {
          const stat = l.status || 'new';
          statusCounts[stat] = (statusCounts[stat] || 0) + 1;
        });
        const statuses = Object.keys(statusCounts).map(k => ({ status: k, count: statusCounts[k] }));

        // Group by Month (Growth)
        const monthlyCounts = {};
        leads.forEach(l => {
          const date = new Date(l.created_at || Date.now());
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyCounts[month]) {
            monthlyCounts[month] = { month, count: 0, monthly_value: 0 };
          }
          monthlyCounts[month].count += 1;
          monthlyCounts[month].monthly_value += parseFloat(l.value) || 0;
        });
        const monthlyLeads = Object.keys(monthlyCounts).sort().map(k => monthlyCounts[k]).slice(0, 6);

        return {
          totalLeads: total,
          newLeads,
          contactedLeads,
          proposalsPending,
          convertedLeads,
          totalPipelineValue,
          weightedPipelineValue,
          actualRevenue,
          sources,
          statuses,
          monthlyLeads
        };
      }
      throw err;
    }
  },

  // Global activity audit logs
  async getGlobalActivity() {
    try {
      const res = await fetch(`${API_URL}/leads/activity/global`, {
        method: 'GET',
        headers: getHeaders()
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        const db = getLocalDb();
        // Return latest 100 activities, showing lead names when available
        return db.activity_log.slice(0, 100).map(log => {
          const lead = db.leads.find(l => l.id === log.lead_id);
          return {
            ...log,
            lead_name: lead ? lead.name : 'System'
          };
        });
      }
      throw err;
    }
  }
};
