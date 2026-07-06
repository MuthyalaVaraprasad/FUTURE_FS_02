const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const dbPath = isVercel 
  ? path.join('/tmp', 'database.json')
  : path.join(__dirname, 'database.json');

// In-memory data store structure
let data = {
  leads: [],
  notes: [],
  activity_log: [],
  users: []
};

// Load database from file
function loadDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const templatePath = path.join(__dirname, 'database.json');
      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, dbPath);
        console.log("[DATABASE] Copied template database.json to /tmp/database.json");
      } else {
        saveDb();
      }
    }
    const raw = fs.readFileSync(dbPath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Error loading JSON database:", e);
  }
}

// Save database to file
function saveDb() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving JSON database:", e);
  }
}

const query = {
  get: async (sql, params = []) => {
    loadDb();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    
    // 1. SELECT * FROM users WHERE username = ?
    if (cleanSql.includes('SELECT * FROM users WHERE username = ?')) {
      const username = params[0];
      const found = data.users.find(u => u.username === username) || null;
      console.log(`[DEBUG query.get] users count: ${data.users.length}, queried: ${username}, found: ${found ? 'yes' : 'no'}`);
      return found;
    }
    
    // 2. SELECT id, username, role FROM users WHERE id = ?
    if (cleanSql.includes('SELECT id, username, role FROM users WHERE id = ?')) {
      const id = parseInt(params[0]);
      const user = data.users.find(u => u.id === id);
      return user ? { id: user.id, username: user.username, role: user.role } : null;
    }
    
    // 3. SELECT * FROM leads WHERE id = ?
    if (cleanSql.includes('SELECT * FROM leads WHERE id = ?')) {
      const id = parseInt(params[0]);
      return data.leads.find(l => l.id === id) || null;
    }

    // 4. SELECT COUNT(*) as total, SUM(CASE WHEN status = 'converted' ... ) FROM leads (Dashboard stats counts)
    if (cleanSql.includes("SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted")) {
      const total = data.leads.length;
      const converted = data.leads.filter(l => l.status === 'converted').length;
      const new_leads = data.leads.filter(l => l.status === 'new').length;
      const contacted = data.leads.filter(l => l.status === 'contacted').length;
      const proposals = data.leads.filter(l => l.status === 'proposal').length;
      return { total, converted, new_leads, contacted, proposals };
    }

    // 5. SELECT SUM(value) as total_value, SUM(value * ...) FROM leads (Dashboard stats revenue)
    if (cleanSql.includes("SUM(value * (probability / 100.0)) as weighted_pipeline")) {
      const total_value = data.leads.reduce((s, l) => s + (parseFloat(l.value) || 0), 0);
      const weighted_pipeline = data.leads.reduce((s, l) => s + ((parseFloat(l.value) || 0) * ((parseInt(l.probability) || 20) / 100)), 0);
      const actual_revenue = data.leads.filter(l => l.status === 'converted').reduce((s, l) => s + (parseFloat(l.value) || 0), 0);
      return { total_value, weighted_pipeline, actual_revenue };
    }

    // 6. SELECT COUNT(*) as count FROM leads
    if (cleanSql.includes('SELECT COUNT(*) as count FROM leads') || cleanSql.includes('SELECT COUNT(id) as count FROM leads')) {
      return { count: data.leads.length };
    }

    // 7. SELECT SUM(value) as sum FROM leads WHERE status = 'converted'
    if (cleanSql.includes("SELECT SUM(value) as sum FROM leads WHERE status = 'converted'")) {
      const sum = data.leads.filter(l => l.status === 'converted').reduce((s, l) => s + (parseFloat(l.value) || 0), 0);
      return { sum };
    }

    console.warn("Unmatched SQL GET query:", sql, params);
    return null;
  },

  all: async (sql, params = []) => {
    loadDb();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC
    if (cleanSql.includes('SELECT * FROM notes WHERE lead_id = ?')) {
      const leadId = parseInt(params[0]);
      return data.notes
        .filter(n => n.lead_id === leadId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 2. SELECT * FROM activity_log WHERE lead_id = ?
    if (cleanSql.includes('SELECT * FROM activity_log WHERE lead_id = ?')) {
      const leadId = parseInt(params[0]);
      return data.activity_log.filter(a => a.lead_id === leadId);
    }

    // 3. SELECT source, COUNT(*) as count FROM leads GROUP BY source
    if (cleanSql.includes('SELECT source, COUNT(*) as count') || cleanSql.includes('GROUP BY source')) {
      const groups = {};
      data.leads.forEach(l => {
        const src = l.source || 'Website';
        groups[src] = (groups[src] || 0) + 1;
      });
      return Object.keys(groups).map(k => ({ source: k, count: groups[k] }));
    }

    // 4. SELECT status, COUNT(*) as count FROM leads GROUP BY status
    if (cleanSql.includes('SELECT status, COUNT(*) as count') || cleanSql.includes('GROUP BY status')) {
      const groups = {};
      data.leads.forEach(l => {
        const stat = l.status || 'new';
        groups[stat] = (groups[stat] || 0) + 1;
      });
      return Object.keys(groups).map(k => ({ status: k, count: groups[k] }));
    }

    // 5. strftime('%Y-%m', created_at) as month, COUNT(*), SUM(value) as monthly_value FROM leads
    if (cleanSql.includes("strftime('%Y-%m', created_at) as month") || cleanSql.includes("monthly_value")) {
      const groups = {};
      data.leads.forEach(l => {
        const date = new Date(l.created_at || Date.now());
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groups[month]) {
          groups[month] = { month, count: 0, monthly_value: 0 };
        }
        groups[month].count += 1;
        groups[month].monthly_value += parseFloat(l.value) || 0;
      });
      return Object.keys(groups).sort().map(k => groups[k]).slice(0, 6);
    }

    // 6. SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM leads (Alternative format)
    if (cleanSql.includes('strftime') || cleanSql.includes('month')) {
      const groups = {};
      data.leads.forEach(l => {
        const date = new Date(l.created_at || Date.now());
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        groups[month] = (groups[month] || 0) + 1;
      });
      return Object.keys(groups).sort().map(k => ({ month: k, count: groups[k] }));
    }

    // 7. SELECT * FROM leads (Fetch leads with filter, search and sort parsing)
    if (cleanSql.includes('SELECT * FROM leads') || cleanSql.includes('SELECT id, name, email')) {
      let result = [...data.leads];
      let paramIdx = 0;

      if (cleanSql.includes('name LIKE ? OR email LIKE ?')) {
        const rawSearchVal = params[paramIdx] || '';
        const searchVal = rawSearchVal.replace(/%/g, '').toLowerCase();
        result = result.filter(l => 
          (l.name && l.name.toLowerCase().includes(searchVal)) ||
          (l.email && l.email.toLowerCase().includes(searchVal)) ||
          (l.company && l.company.toLowerCase().includes(searchVal)) ||
          (l.tags && l.tags.toLowerCase().includes(searchVal))
        );
        paramIdx += 4;
      }
      
      if (cleanSql.includes('AND status = ?')) {
        const statusVal = params[paramIdx];
        result = result.filter(l => l.status === statusVal);
        paramIdx += 1;
      }
      
      if (cleanSql.includes('AND source = ?')) {
        const sourceVal = params[paramIdx];
        result = result.filter(l => l.source === sourceVal);
        paramIdx += 1;
      }

      // Handle ORDER BY sorting dynamically
      const matchSort = cleanSql.match(/ORDER BY (\w+) (ASC|DESC)/i);
      if (matchSort) {
        const col = matchSort[1];
        const isAsc = matchSort[2].toUpperCase() === 'ASC';
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

    console.warn("Unmatched SQL ALL query:", sql, params);
    return [];
  },

  run: async (sql, params = []) => {
    loadDb();
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. INSERT INTO users
    if (cleanSql.includes('INSERT INTO users')) {
      const [username, password, role] = params;
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      data.users.push({ id: newId, username, password, role: role || 'admin' });
      saveDb();
      return { id: newId, changes: 1 };
    }

    // 2. INSERT INTO leads
    if (cleanSql.includes('INSERT INTO leads')) {
      const [name, email, phone, company, source, value, probability, tags] = params;
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      
      const newLead = {
        id: newId,
        name,
        email,
        phone: phone || '',
        company: company || '',
        source: source || 'Website',
        status: 'new',
        value: parseFloat(value) || 0,
        probability: parseInt(probability) || 20,
        tags: tags || '',
        followup_date: '',
        bant_budget: 0,
        bant_authority: 0,
        bant_need: 0,
        bant_timeline: 0,
        created_at: new Date().toISOString()
      };
      
      data.leads.push(newLead);
      saveDb();
      return { id: newId, changes: 1 };
    }

    // 3. INSERT INTO notes
    if (cleanSql.includes('INSERT INTO notes')) {
      const [lead_id, content] = params;
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      data.notes.push({
        id: newId,
        lead_id: parseInt(lead_id),
        content,
        created_at: new Date().toISOString()
      });
      saveDb();
      return { id: newId, changes: 1 };
    }

    // 4. INSERT INTO activity_log
    if (cleanSql.includes('INSERT INTO activity_log')) {
      const [lead_id, action] = params;
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      data.activity_log.push({
        id: newId,
        lead_id: parseInt(lead_id),
        action,
        created_at: new Date().toISOString()
      });
      saveDb();
      return { id: newId, changes: 1 };
    }

    // 5. UPDATE leads SET status = ? WHERE id IN (...)
    if (cleanSql.includes('UPDATE leads SET status = ? WHERE id IN')) {
      const status = params[0];
      const ids = params.slice(1).map(id => parseInt(id));
      data.leads = data.leads.map(l => ids.includes(l.id) ? { ...l, status } : l);
      saveDb();
      return { changes: ids.length };
    }

    // 6. UPDATE leads SET ... WHERE id = ?
    if (cleanSql.includes('UPDATE leads SET') && cleanSql.endsWith('WHERE id = ?')) {
      const leadId = parseInt(params[params.length - 1]);
      const leadIdx = data.leads.findIndex(l => l.id === leadId);
      
      if (leadIdx !== -1) {
        const [
          name, email, phone, company, source, status, value, probability, tags, followup_date,
          bant_budget, bant_authority, bant_need, bant_timeline
        ] = params;

        data.leads[leadIdx] = {
          ...data.leads[leadIdx],
          name: name !== undefined ? name : data.leads[leadIdx].name,
          email: email !== undefined ? email : data.leads[leadIdx].email,
          phone: phone !== undefined ? phone : data.leads[leadIdx].phone,
          company: company !== undefined ? company : data.leads[leadIdx].company,
          source: source !== undefined ? source : data.leads[leadIdx].source,
          status: status !== undefined ? status : data.leads[leadIdx].status,
          value: value !== undefined ? parseFloat(value) : data.leads[leadIdx].value,
          probability: probability !== undefined ? parseInt(probability) : data.leads[leadIdx].probability,
          tags: tags !== undefined ? tags : data.leads[leadIdx].tags,
          followup_date: followup_date !== undefined ? followup_date : data.leads[leadIdx].followup_date,
          bant_budget: bant_budget !== undefined ? parseInt(bant_budget) : data.leads[leadIdx].bant_budget,
          bant_authority: bant_authority !== undefined ? parseInt(bant_authority) : data.leads[leadIdx].bant_authority,
          bant_need: bant_need !== undefined ? parseInt(bant_need) : data.leads[leadIdx].bant_need,
          bant_timeline: bant_timeline !== undefined ? parseInt(bant_timeline) : data.leads[leadIdx].bant_timeline
        };
        saveDb();
        return { id: leadId, changes: 1 };
      }
      return { changes: 0 };
    }

    // 7. DELETE FROM leads WHERE id = ?
    if (cleanSql.includes('DELETE FROM leads WHERE id = ?')) {
      const id = parseInt(params[0]);
      data.leads = data.leads.filter(l => l.id !== id);
      data.notes = data.notes.filter(n => n.lead_id !== id);
      data.activity_log = data.activity_log.filter(a => a.lead_id !== id);
      saveDb();
      return { changes: 1 };
    }

    // 8. DELETE FROM notes WHERE id = ? AND lead_id = ?
    if (cleanSql.includes('DELETE FROM notes WHERE id = ? AND lead_id = ?')) {
      const noteId = parseInt(params[0]);
      const leadId = parseInt(params[1]);
      data.notes = data.notes.filter(n => !(n.id === noteId && n.lead_id === leadId));
      saveDb();
      return { changes: 1 };
    }

    // 9. DELETE FROM leads WHERE id IN
    if (cleanSql.includes('DELETE FROM leads WHERE id IN')) {
      const ids = params.map(id => parseInt(id));
      data.leads = data.leads.filter(l => !ids.includes(l.id));
      data.notes = data.notes.filter(n => !ids.includes(n.lead_id));
      data.activity_log = data.activity_log.filter(a => !ids.includes(a.lead_id));
      saveDb();
      return { changes: ids.length };
    }

    // 10. Wipes
    if (cleanSql.includes('DELETE FROM leads')) {
      data.leads = [];
      saveDb();
      return { changes: 1 };
    }
    if (cleanSql.includes('DELETE FROM notes')) {
      data.notes = [];
      saveDb();
      return { changes: 1 };
    }
    if (cleanSql.includes('DELETE FROM activity_log')) {
      data.activity_log = [];
      saveDb();
      return { changes: 1 };
    }

    // 11. Ignored SQL statements
    if (cleanSql.includes('CREATE TABLE') || cleanSql.includes('ALTER TABLE')) {
      return { changes: 0 };
    }

    console.warn("Unmatched SQL RUN query:", sql, params);
    return { id: 0, changes: 0 };
  }
};

async function initDb() {
  loadDb();
  const defaultAdmin = 'admin';
  const defaultPass = 'admin123';
  const existingUser = data.users.find(u => u.username === defaultAdmin);
  
  if (!existingUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPass, salt);
    data.users.push({
      id: Date.now(),
      username: defaultAdmin,
      password: hashedPassword,
      role: 'admin'
    });
    saveDb();
    console.log(`Default admin seeded in JSON database. Username: ${defaultAdmin}, Password: ${defaultPass}`);
  }
}

const db = {
  close: () => {}
};

module.exports = {
  db,
  query,
  initDb
};
