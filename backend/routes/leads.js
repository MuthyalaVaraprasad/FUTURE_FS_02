const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Helper to log activities
async function logActivity(leadId, action) {
  try {
    await query.run(
      'INSERT INTO activity_log (lead_id, action) VALUES (?, ?)',
      [leadId, action]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// POST /api/leads/submit
// Simulates a public website contact form submitting a new lead
router.post('/submit', async (req, res) => {
  const { name, email, phone, company, source, message, value } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required fields.' });
  }

  try {
    const leadSource = source || 'Website';
    const leadValue = parseFloat(value) || 0;
    const initialNote = message ? `Message: ${message}` : 'New inquiry submitted.';

    // Create lead
    const result = await query.run(
      `INSERT INTO leads (name, email, phone, company, source, status, value, probability, tags) 
       VALUES (?, ?, ?, ?, ?, 'new', ?, 20, 'New Lead')`,
      [name, email, phone || '', company || '', leadSource, leadValue]
    );

    const leadId = result.id;

    // Save initial message as first note
    await query.run(
      'INSERT INTO notes (lead_id, content) VALUES (?, ?)',
      [leadId, initialNote]
    );

    // Log creation activity
    await logActivity(leadId, `Lead created via Public ${leadSource} Form.`);
    await logActivity(leadId, `System auto-assigned status: 'New'`);

    res.status(201).json({
      message: 'Inquiry submitted successfully!',
      leadId
    });
  } catch (error) {
    console.error('Public lead submission error:', error);
    res.status(500).json({ message: 'Error submitting contact form inquiry.' });
  }
});

// ==========================================
// PRIVATE ENDPOINTS (AUTHENTICATED)
// ==========================================

// Apply JWT authentication middleware to all routes below
router.use(authenticateToken);

// GET /api/leads
// Fetch leads with filtering, search and sorting capabilities
router.get('/', async (req, res) => {
  const { search, status, source, sort_by, order } = req.query;

  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  // Filter by Search Query (Name, Email, Company, Tags)
  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ? OR tags LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal);
  }

  // Filter by Status
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  // Filter by Source
  if (source && source !== 'all') {
    sql += ' AND source = ?';
    params.push(source);
  }

  // Sort settings
  const allowedSortCols = ['name', 'email', 'company', 'status', 'value', 'probability', 'created_at', 'followup_date'];
  const sortCol = allowedSortCols.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  sql += ` ORDER BY ${sortCol} ${sortOrder}`;

  try {
    const leads = await query.all(sql, params);
    res.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ message: 'Error retrieving leads.' });
  }
});

// POST /api/leads
// Manually create a lead from the dashboard
router.post('/', async (req, res) => {
  const { name, email, phone, company, source, status, value, probability, tags, followup_date, bant_budget, bant_authority, bant_need, bant_timeline } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  try {
    const result = await query.run(
      `INSERT INTO leads (name, email, phone, company, source, status, value, probability, tags, followup_date, bant_budget, bant_authority, bant_need, bant_timeline) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone || '',
        company || '',
        source || 'Manual Entry',
        status || 'new',
        parseFloat(value) || 0,
        parseInt(probability) || 20,
        tags || '',
        followup_date || '',
        parseInt(bant_budget) || 0,
        parseInt(bant_authority) || 0,
        parseInt(bant_need) || 0,
        parseInt(bant_timeline) || 0
      ]
    );

    const leadId = result.id;
    await logActivity(leadId, 'Lead created manually by Administrator.');
    if (tags) {
      await logActivity(leadId, `Assigned tags: ${tags}`);
    }

    res.status(201).json({
      message: 'Lead created successfully',
      leadId
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Error creating lead.' });
  }
});

// GET /api/dashboard/stats
// Analytics aggregations for dashboard metrics & HTML5 canvas rendering
router.get('/stats', async (req, res) => {
  try {
    // 1. General Metrics
    const counts = await query.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'proposal' THEN 1 ELSE 0 END) as proposals
      FROM leads
    `);

    const revenue = await query.get(`
      SELECT 
        SUM(value) as total_value,
        SUM(value * (probability / 100.0)) as weighted_pipeline,
        SUM(CASE WHEN status = 'converted' THEN value ELSE 0 END) as actual_revenue
      FROM leads
    `);

    // 2. Leads by Source
    const sources = await query.all(`
      SELECT source, COUNT(*) as count 
      FROM leads 
      GROUP BY source
    `);

    // 3. Leads status breakout
    const statuses = await query.all(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `);

    // 4. Monthly Growth (last 6 months placeholder based on SQLite timestamps)
    // Query groups leads by YYYY-MM based on created_at
    const monthlyLeads = await query.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month, 
        COUNT(*) as count,
        SUM(value) as monthly_value
      FROM leads 
      GROUP BY month 
      ORDER BY month ASC 
      LIMIT 6
    `);

    res.json({
      totalLeads: counts.total || 0,
      newLeads: counts.new_leads || 0,
      contactedLeads: counts.contacted || 0,
      proposalsPending: counts.proposals || 0,
      convertedLeads: counts.converted || 0,
      totalPipelineValue: revenue.total_value || 0,
      weightedPipelineValue: revenue.weighted_pipeline || 0,
      actualRevenue: revenue.actual_revenue || 0,
      sources,
      statuses,
      monthlyLeads
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ message: 'Error retrieving analytics data.' });
  }
});

// GET /api/leads/:id
// Get single lead details
router.get('/:id', async (req, res) => {
  try {
    const lead = await query.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    res.status(500).json({ message: 'Error retrieving lead details.' });
  }
});

// PUT /api/leads/:id
// Update lead fields and log updates in activity timeline
router.put('/:id', async (req, res) => {
  const { name, email, phone, company, source, status, value, probability, tags, followup_date, bant_budget, bant_authority, bant_need, bant_timeline } = req.body;
  const leadId = req.params.id;

  try {
    const oldLead = await query.get('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!oldLead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    await query.run(
      `UPDATE leads 
       SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?, value = ?, probability = ?, tags = ?, followup_date = ?,
           bant_budget = ?, bant_authority = ?, bant_need = ?, bant_timeline = ?
       WHERE id = ?`,
      [
        name,
        email,
        phone,
        company,
        source,
        status,
        parseFloat(value) || 0,
        parseInt(probability) || 0,
        tags,
        followup_date,
        parseInt(bant_budget) || 0,
        parseInt(bant_authority) || 0,
        parseInt(bant_need) || 0,
        parseInt(bant_timeline) || 0,
        leadId
      ]
    );

    // Track status updates specifically in activity logs
    if (oldLead.status !== status) {
      await logActivity(leadId, `Status changed from '${oldLead.status}' to '${status}'.`);
    }

    // Track other major updates
    if (oldLead.value !== parseFloat(value)) {
      await logActivity(leadId, `Deal value adjusted from $${oldLead.value} to $${value}.`);
    }

    if (oldLead.followup_date !== followup_date && followup_date) {
      await logActivity(leadId, `Follow-up date scheduled for ${followup_date}.`);
    }

    res.json({ message: 'Lead updated successfully.' });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Error updating lead details.' });
  }
});

// DELETE /api/leads/:id
// Delete single lead
router.delete('/:id', async (req, res) => {
  try {
    const result = await query.run('DELETE FROM leads WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    res.json({ message: 'Lead deleted successfully.' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Error deleting lead.' });
  }
});

// ==========================================
// NOTES ENDPOINTS
// ==========================================

// GET /api/leads/:id/notes
router.get('/:id/notes', async (req, res) => {
  try {
    const notes = await query.all('SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(notes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ message: 'Error retrieving notes.' });
  }
});

// POST /api/leads/:id/notes
router.post('/:id/notes', async (req, res) => {
  const { content } = req.body;
  const leadId = req.params.id;

  if (!content) {
    return res.status(400).json({ message: 'Note content cannot be empty.' });
  }

  try {
    await query.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [leadId, content]);
    await logActivity(leadId, `Added a follow-up note: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`);
    res.status(201).json({ message: 'Note added successfully.' });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Error adding note.' });
  }
});

// DELETE /api/leads/:id/notes/:noteId
router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    await query.run('DELETE FROM notes WHERE id = ? AND lead_id = ?', [req.params.noteId, req.params.id]);
    await logActivity(req.params.id, 'Removed a follow-up note.');
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Error deleting note.' });
  }
});

// GET /api/leads/:id/timeline
// Fetch activity log history for a lead
router.get('/:id/timeline', async (req, res) => {
  try {
    const timeline = await query.all(
      'SELECT * FROM activity_log WHERE lead_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(timeline);
  } catch (error) {
    console.error('Fetch timeline error:', error);
    res.status(500).json({ message: 'Error retrieving timeline log.' });
  }
});

// ==========================================
// BULK OPERATIONS
// ==========================================

// POST /api/leads/bulk-delete
router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body; // Array of lead IDs
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty IDs array.' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    await query.run(`DELETE FROM leads WHERE id IN (${placeholders})`, ids);
    res.json({ message: `Successfully deleted ${ids.length} leads.` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Error during bulk deletion.' });
  }
});

// POST /api/leads/bulk-update
// Bulk updates lead status
router.post('/bulk-update', async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
    return res.status(400).json({ message: 'Invalid payload elements.' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    await query.run(`UPDATE leads SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);
    
    // Log activities for all updated leads
    for (const leadId of ids) {
      await logActivity(leadId, `Bulk status updated to '${status}'.`);
    }

    res.json({ message: `Successfully updated ${ids.length} leads to '${status}'.` });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: 'Error during bulk update.' });
  }
});

// POST /api/leads/bulk-import
// Bulk imports leads from custom CSV inputs
router.post('/bulk-import', async (req, res) => {
  const { leads } = req.body; // Array of lead objects
  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ message: 'Import array must not be empty.' });
  }

  try {
    let successCount = 0;
    for (const l of leads) {
      if (!l.name || !l.email) continue;
      const res = await query.run(
        `INSERT INTO leads (name, email, phone, company, source, status, value, probability, tags, followup_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          l.name,
          l.email,
          l.phone || '',
          l.company || '',
          l.source || 'CSV Import',
          l.status || 'new',
          parseFloat(l.value) || 0,
          parseInt(l.probability) || 20,
          l.tags || '',
          l.followup_date || ''
        ]
      );
      await logActivity(res.id, 'Imported into CRM database via Bulk Upload Wizard.');
      successCount++;
    }
    res.json({ message: `Bulk import completed. Successfully imported ${successCount} leads.` });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Error during bulk CSV import.' });
  }
});

// POST /api/leads/mock-seed
// Seeder to populate the DB with 15+ highly realistic leads
router.post('/mock-seed', async (req, res) => {
  const mockLeads = [
    { name: 'Alex Johnson', email: 'alex@cloudtech.io', phone: '+1 555-0199', company: 'CloudTech Solutions', source: 'Website', status: 'new', value: 8500, probability: 20, tags: 'High Value, Tech Stack: React', followup_date: '', bant_budget: 0, bant_authority: 0, bant_need: 1, bant_timeline: 0 },
    { name: 'Sarah Miller', email: 'sarah@designlab.co', phone: '+1 555-0142', company: 'DesignLab Studio', source: 'Social Media', status: 'contacted', value: 3200, probability: 40, tags: 'Warm Lead, UI Design', followup_date: '2026-07-10', bant_budget: 1, bant_authority: 0, bant_need: 1, bant_timeline: 1 },
    { name: 'Michael Chang', email: 'm.chang@apexcorp.com', phone: '+852 2891-3000', company: 'Apex Global Corp', source: 'Referral', status: 'proposal', value: 25000, probability: 70, tags: 'Enterprise, VIP Client', followup_date: '2026-07-08', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 0 },
    { name: 'Emma Watson', email: 'emma@watsonretail.com', phone: '+44 20 7946 0958', company: 'Watson Retail Group', source: 'Cold Call', status: 'converted', value: 12000, probability: 100, tags: 'E-commerce, Retail', followup_date: '', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1 },
    { name: 'David Smith', email: 'dsmith@financesmart.com', phone: '+1 555-0187', company: 'FinanceSmart LLC', source: 'Website', status: 'lost', value: 6400, probability: 0, tags: 'Budget Constrained', followup_date: '', bant_budget: 0, bant_authority: 1, bant_need: 1, bant_timeline: 0 },
    { name: 'Chloe Davis', email: 'chloe@healthplus.org', phone: '+1 555-0112', company: 'HealthPlus Network', source: 'Social Media', status: 'new', value: 14500, probability: 30, tags: 'Healthcare, Urgent', followup_date: '2026-07-07', bant_budget: 1, bant_authority: 0, bant_need: 0, bant_timeline: 1 },
    { name: 'Robert Downey', email: 'robert@starkmedia.com', phone: '+1 555-9999', company: 'Stark Media Agency', source: 'Referral', status: 'proposal', value: 35000, probability: 80, tags: 'High Value, Retainer', followup_date: '2026-07-06', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1 },
    { name: 'Jessica Alba', email: 'jessica@honestco.com', phone: '+1 555-0888', company: 'The Honest Company', source: 'Website', status: 'contacted', value: 9800, probability: 50, tags: 'Warm Lead, Shopify', followup_date: '2026-07-15', bant_budget: 0, bant_authority: 1, bant_need: 1, bant_timeline: 1 },
    { name: 'Elon Musk', email: 'elon@x.corp', phone: '+1 555-0042', company: 'X Corp', source: 'Cold Call', status: 'new', value: 150000, probability: 10, tags: 'Whale, AI App', followup_date: '', bant_budget: 1, bant_authority: 0, bant_need: 1, bant_timeline: 0 },
    { name: 'Peter Parker', email: 'peter@dailybugle.com', phone: '+1 555-0100', company: 'Daily Bugle', source: 'Social Media', status: 'converted', value: 1500, probability: 100, tags: 'Photography, Media', followup_date: '', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1 },
    { name: 'Bruce Wayne', email: 'bruce@wayneent.com', phone: '+1 555-0007', company: 'Wayne Enterprises', source: 'Referral', status: 'new', value: 500000, probability: 20, tags: 'Whale, Secure App', followup_date: '2026-07-20', bant_budget: 1, bant_authority: 0, bant_need: 1, bant_timeline: 0 },
    { name: 'Diana Prince', email: 'diana@themuseum.org', phone: '+1 555-0182', company: 'Themyscira Museum', source: 'Website', status: 'contacted', value: 5000, probability: 45, tags: 'Education, Warm Lead', followup_date: '2026-07-14', bant_budget: 0, bant_authority: 0, bant_need: 1, bant_timeline: 1 },
    { name: 'Tony Stark', email: 'tony@starkindustries.com', phone: '+1 555-3000', company: 'Stark Industries', source: 'Referral', status: 'converted', value: 85000, probability: 100, tags: 'Robotics, IoT', followup_date: '', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 1 },
    { name: 'Clark Kent', email: 'clark@dailyplanet.com', phone: '+1 555-0121', company: 'Daily Planet Press', source: 'Cold Call', status: 'lost', value: 2400, probability: 0, tags: 'Competitor Chosen', followup_date: '', bant_budget: 0, bant_authority: 0, bant_need: 1, bant_timeline: 0 },
    { name: 'Steve Rogers', email: 'steve@shield.gov', phone: '+1 555-1941', company: 'SHIELD Public Relations', source: 'Social Media', status: 'proposal', value: 18000, probability: 60, tags: 'Government, Long Cycle', followup_date: '2026-07-09', bant_budget: 1, bant_authority: 1, bant_need: 1, bant_timeline: 0 }
  ];

  try {
    // Clear existing leads first to enable a fresh seed
    await query.run('DELETE FROM leads');
    await query.run('DELETE FROM notes');
    await query.run('DELETE FROM activity_log');

    for (const lead of mockLeads) {
      const res = await query.run(
        `INSERT INTO leads (name, email, phone, company, source, status, value, probability, tags, followup_date, bant_budget, bant_authority, bant_need, bant_timeline) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.company,
          lead.source,
          lead.status,
          lead.value,
          lead.probability,
          lead.tags,
          lead.followup_date,
          lead.bant_budget,
          lead.bant_authority,
          lead.bant_need,
          lead.bant_timeline
        ]
      );

      const leadId = res.id;
      
      // Add typical notes based on status
      if (lead.status === 'new') {
        await query.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [leadId, 'Inquiry received through digital outreach. Form response logged.']);
        await logActivity(leadId, 'Inquiry ingested automatically.');
      } else if (lead.status === 'contacted') {
        await query.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [leadId, 'Initial discovery call conducted. Lead expressed immediate interest. Scheduled follow-up.']);
        await logActivity(leadId, 'Completed discovery phone call.');
        await logActivity(leadId, 'Status set to Contacted.');
      } else if (lead.status === 'proposal') {
        await query.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [leadId, 'Sent comprehensive project breakdown, timeline, and pricing proposal. Waiting on review.']);
        await logActivity(leadId, 'Emailed formal proposal file.');
        await logActivity(leadId, 'Status set to Proposal Sent.');
      } else if (lead.status === 'converted') {
        await query.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [leadId, 'Proposal approved! SLA signed and deposit payment received. Project successfully kickstarted.']);
        await logActivity(leadId, 'Contract signed, lead successfully converted into Client!');
      } else if (lead.status === 'lost') {
        await query.run('INSERT INTO notes (lead_id, content) VALUES (?, ?)', [leadId, 'Client declined proposal. Stated project budget could not sustain standard service rate.']);
        await logActivity(leadId, 'Marked as Lost: Budget constraint issue.');
      }
    }

    res.json({ message: 'Mock data seeded successfully! 15 realistic leads loaded.' });
  } catch (error) {
    console.error('Seeding mock data error:', error);
    res.status(500).json({ message: 'Error seeding mock leads database.' });
  }
});

// GET /api/leads/activity/global
// Retrieve global timeline logs of all updates for activity logs dashboard
router.get('/activity/global', async (req, res) => {
  try {
    const logs = await query.all(`
      SELECT a.id, a.lead_id, a.action, a.created_at, l.name as lead_name
      FROM activity_log a
      LEFT JOIN leads l ON a.lead_id = l.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (error) {
    console.error('Fetch global activity logs error:', error);
    res.status(500).json({ message: 'Error retrieving global activity logs.' });
  }
});

module.exports = router;
