/**
 * COE-Pay: Dean / College Administrator View Controller
 * Handles institutional metrics, request authorization workflow,
 * student roster management, categories, and audit logs.
 */

const CoeAdminView = {
  render() {
    const container = document.getElementById('admin-view-container');
    if (!container) return;

    const user = window.coeAuth.getUser();
    const profile = window.coeAuth.getProfile() || { full_name: 'Engr. Ivanlee Mendoza', designation: 'Head Engineer & Academic Program Coordinator' };
    const currentTerm = window.coepayDb.getCurrentTerm();
    const requests = window.coepayDb.getPaymentRequests();
    const students = window.coepayDb.getStudents();
    const assignments = window.coepayDb.getAssignments();
    const transactions = window.coepayDb.getTransactions();

    // Financial Metrics
    const verifiedTrans = transactions.filter(t => t.status === 'verified');
    const totalCollected = verifiedTrans.reduce((sum, t) => sum + Number(t.amount_paid), 0);

    const authorizedRequests = requests.filter(r => r.status === 'authorized');
    const totalExpected = assignments.reduce((sum, a) => sum + Number(a.request.amount || 0), 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const pendingAuthCount = requests.filter(r => r.status === 'pending_authorization').length;
    const pendingVerifyCount = transactions.filter(t => t.status === 'pending').length;

    container.innerHTML = `
      <!-- Admin Subheader -->
      <div class="view-header">
        <div>
          <span class="badge badge-admin"><i class="fa-solid fa-user-tie"></i> Head Engineer / Coordinator Console</span>
          <h1 class="page-title">${profile.full_name || 'Engr. Ivanlee Mendoza'}</h1>
          <p class="page-subtitle">
            <strong>${profile.designation || 'Head Engineer & Academic Program Coordinator'}</strong> • 
            Responsibility: <strong>Approve Requests & Add Students</strong> • Current Term: <strong>${currentTerm.academic_year} (${currentTerm.semester})</strong>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" onclick="CoeAdminView.exportSqlDump()">
            <i class="fa-solid fa-file-code"></i> Export MySQL Dump (.sql)
          </button>
          <button class="btn btn-outline" onclick="CoeAdminView.exportCsvReport()">
            <i class="fa-solid fa-file-csv"></i> Financial Report (.csv)
          </button>
          <button class="btn btn-outline-primary" onclick="CoeMasterlistUpload.openModal()">
            <i class="fa-solid fa-file-arrow-up"></i> Bulk Upload Masterlist
          </button>
          <button class="btn btn-primary" onclick="CoeAdminView.openAddStudentModal()">
            <i class="fa-solid fa-user-plus"></i> Enroll Student
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="stats-grid">
        <div class="stat-card clickable-card" onclick="CoeAdminView.openCollectionsModal()" title="Click to inspect verified collections breakdown and transaction ledger">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</div>
          <div class="stat-icon bg-blue-subtle">
            <i class="fa-solid fa-peso-sign text-primary"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Verified Collections</div>
            <div class="stat-value">₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-arrow-trend-up"></i> Collected via GCash Gateway</div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoeAdminView.openComplianceModal()" title="Click to inspect collection compliance rate and cohort progress">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</div>
          <div class="stat-icon bg-emerald-subtle">
            <i class="fa-solid fa-chart-pie text-emerald"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Collection Compliance Rate</div>
            <div class="stat-value">${collectionRate}%</div>
            <div class="stat-footnote text-muted">Target: ₱${totalExpected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="stat-card clickable-card ${pendingAuthCount > 0 ? 'card-pulse' : ''}" onclick="CoeAdminView.openPendingAuthorizationsModal()" title="Click to review pending authorization queue">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${pendingAuthCount > 0 ? 'Review (' + pendingAuthCount + ')' : 'View'}</div>
          <div class="stat-icon bg-amber-subtle">
            <i class="fa-solid fa-stamp text-amber"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Pending Authorizations</div>
            <div class="stat-value">${pendingAuthCount}</div>
            <div class="stat-footnote ${pendingAuthCount > 0 ? 'text-amber' : 'text-muted'}">
              ${pendingAuthCount > 0 ? 'Requires Dean Decision' : 'All Requests Processed'}
            </div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoeAdminView.openActiveStudentsModal()" title="Click to view active COE students and cohort roster summary">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</div>
          <div class="stat-icon bg-indigo-subtle">
            <i class="fa-solid fa-users-viewfinder text-indigo"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Active COE Students</div>
            <div class="stat-value">${students.length}</div>
            <div class="stat-footnote text-muted">Across 5 Program Cohorts</div>
          </div>
        </div>
      </div>

      <!-- Tabbed Navigation for Admin -->
      <div class="admin-tabs-nav">
        <button class="tab-btn active" onclick="CoeAdminView.switchTab('authorizations')">
          <i class="fa-solid fa-clipboard-check"></i> Payment Authorizations (${pendingAuthCount})
        </button>
        <button class="tab-btn" onclick="CoeAdminView.switchTab('roster')">
          <i class="fa-solid fa-graduation-cap"></i> Student Roster & Clearances
        </button>
        <button class="tab-btn" onclick="CoeAdminView.switchTab('categories')">
          <i class="fa-solid fa-tags"></i> Payment Categories
        </button>
        <button class="tab-btn" onclick="CoeAdminView.switchTab('audit')">
          <i class="fa-solid fa-shield-virus"></i> Security & Audit Trail
        </button>
      </div>

      <!-- TAB 1: Payment Authorizations -->
      <div id="admin-tab-authorizations" class="admin-tab-content active">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Payment Requests Authorization Queue</h2>
              <p class="card-subtitle">Review, approve, or reject proposed student fees and collections submitted by faculty personnel.</p>
            </div>
            <div class="filter-group">
              <select id="admin-request-filter" class="form-select form-select-sm" onchange="CoeAdminView.filterRequests()">
                <option value="all">All Request Statuses</option>
                <option value="pending_authorization" selected>Pending Authorization (${pendingAuthCount})</option>
                <option value="authorized">Authorized & Active</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Purpose / Contribution Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Deadline</th>
                    <th>Target Cohort</th>
                    <th>Submitted By</th>
                    <th>Status</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-requests-table-body">
                  <!-- Populated by renderRequests() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Student Roster & Clearances -->
      <div id="admin-tab-roster" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">College of Engineering Student Masterlist</h2>
              <p class="card-subtitle">Manage student accounts, verify program enrollment, and inspect individual financial clearances.</p>
            </div>
            <div class="roster-filters flex-gap">
              <input type="text" id="roster-search" class="form-control form-control-sm" placeholder="Search student name or ID..." onkeyup="CoeAdminView.filterRoster()">
              <select id="roster-year-filter" class="form-select form-select-sm" onchange="CoeAdminView.filterRoster()">
                <option value="all">All Year Levels</option>
                <option value="4">4th Year</option>
                <option value="3">3rd Year</option>
                <option value="2">2nd Year</option>
                <option value="1">1st Year</option>
              </select>
              <select id="roster-status-filter" class="form-select form-select-sm" onchange="CoeAdminView.filterRoster()">
                <option value="all">All Clearance Statuses</option>
                <option value="cleared">✅ 100% Cleared (Paid in Full)</option>
                <option value="pending">⏳ With Pending Verification</option>
                <option value="unpaid">⚠️ With Unpaid / Overdue</option>
              </select>
              <button class="btn btn-sm btn-success" onclick="CoeAdminView.dispatchDefaultPasswordsToAll()" title="Send default password (password123) and login credentials to all official masterlist student emails">
                <i class="fa-solid fa-paper-plane"></i> Send Passwords to All
              </button>
              <button class="btn btn-sm btn-primary" onclick="CoeMasterlistUpload.openModal()" title="Upload CSV or Excel masterlist to insert or update students">
                <i class="fa-solid fa-file-arrow-up"></i> Bulk Upload
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Program</th>
                    <th>Year & Section</th>
                    <th>Contact</th>
                    <th>Clearance Summary</th>
                    <th>Account Status</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-roster-table-body">
                  <!-- Populated by renderRoster() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Payment Categories -->
      <div id="admin-tab-categories" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Official COE Payment Categories</h2>
              <p class="card-subtitle">Approved contribution categories recognized by the Dean's Office.</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="CoeAdminView.openAddCategoryModal()">
              <i class="fa-solid fa-plus"></i> New Category
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody id="admin-categories-table-body">
                  <!-- Populated by renderCategories() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: Security & Audit Trail -->
      <div id="admin-tab-audit" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Immutable System Audit Log</h2>
              <p class="card-subtitle">Real-time ledger of security events, authorizations, payments, and administrative actions.</p>
            </div>
            <div class="flex-gap">
              <button class="btn btn-sm btn-outline" onclick="CoeAdminView.renderAuditLogs()">
                <i class="fa-solid fa-rotate"></i> Refresh Log
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table font-mono-sm">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP / User Agent</th>
                  </tr>
                </thead>
                <tbody id="admin-audit-table-body">
                  <!-- Populated by renderAuditLogs() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderRequests();
    this.renderRoster();
    this.renderCategories();
    this.renderAuditLogs();
  },

  switchTab(tabKey) {
    document.querySelectorAll('.admin-tabs-nav .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    const activeBtn = Array.from(document.querySelectorAll('.admin-tabs-nav .tab-btn')).find(b => b.textContent.toLowerCase().includes(tabKey));
    if (activeBtn) activeBtn.classList.add('active');

    const tabContent = document.getElementById(`admin-tab-${tabKey}`);
    if (tabContent) tabContent.classList.add('active');
  },

  filterRequests() {
    this.renderRequests();
  },

  renderRequests() {
    const filterVal = document.getElementById('admin-request-filter')?.value || 'all';
    let requests = window.coepayDb.getPaymentRequests();

    if (filterVal !== 'all') {
      requests = requests.filter(r => r.status === filterVal);
    }

    const tbody = document.getElementById('admin-requests-table-body');
    if (!tbody) return;

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No payment requests found matching this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map(req => {
      const statusBadge = CoeAdminView.getStatusBadge(req.status);
      const targetCohort = req.target_year_level 
        ? `Year ${req.target_year_level} ${req.target_section ? '(' + req.target_section + ')' : '(All Sections)'}`
        : 'All COE Students';

      const isPending = req.status === 'pending_authorization';

      return `
        <tr>
          <td><span class="badge badge-light">REQ-${req.request_id}</span></td>
          <td>
            <strong>${req.title}</strong>
            <div class="text-muted small">${req.description.substring(0, 50)}...</div>
          </td>
          <td><span class="badge badge-outline">${req.category_name}</span></td>
          <td class="font-bold text-primary">₱${parseFloat(req.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
          <td class="small">${new Date(req.deadline).toLocaleDateString()}</td>
          <td><span class="cohort-tag"><i class="fa-solid fa-users"></i> ${targetCohort}</span></td>
          <td>
            <div>${req.creator_name}</div>
            <div class="text-muted small">${req.creator_designation}</div>
          </td>
          <td>${statusBadge}</td>
          <td class="text-right">
            <div class="action-buttons">
              <button class="btn btn-xs btn-outline" onclick="CoeAdminView.viewRequestDetails(${req.request_id})">
                <i class="fa-solid fa-eye"></i> Details
              </button>
              ${isPending ? `
                <button class="btn btn-xs btn-success" onclick="CoeAdminView.openAuthorizeModal(${req.request_id})">
                  <i class="fa-solid fa-check"></i> Authorize
                </button>
                <button class="btn btn-xs btn-danger" onclick="CoeAdminView.openRejectModal(${req.request_id})">
                  <i class="fa-solid fa-xmark"></i> Reject
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  getStatusBadge(status) {
    switch (status) {
      case 'authorized':
        return '<span class="badge badge-success"><i class="fa-solid fa-check-circle"></i> Authorized</span>';
      case 'pending_authorization':
        return '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending Dean Authorization</span>';
      case 'rejected':
        return '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>';
      case 'closed':
        return '<span class="badge badge-secondary"><i class="fa-solid fa-lock"></i> Closed</span>';
      default:
        return `<span class="badge badge-light">${status}</span>`;
    }
  },

  viewRequestDetails(requestId) {
    const req = window.coepayDb.getRequestById(requestId);
    if (!req) return;

    const modalBody = `
      <div class="request-details-view">
        <div class="detail-header-card">
          <div class="flex-between">
            <div>
              <span class="badge badge-outline">${req.category_name}</span>
              <h3>${req.title}</h3>
            </div>
            <div>${this.getStatusBadge(req.status)}</div>
          </div>
          <p class="mt-2 text-muted">${req.description}</p>
        </div>

        <div class="grid-2-col mt-3">
          <div class="info-block">
            <div class="label">Amount per Student:</div>
            <div class="value font-bold text-primary">₱${parseFloat(req.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="info-block">
            <div class="label">Submission Deadline:</div>
            <div class="value">${new Date(req.deadline).toLocaleString()}</div>
          </div>
          <div class="info-block">
            <div class="label">Target Audience:</div>
            <div class="value">${req.target_year_level ? 'Year ' + req.target_year_level + (req.target_section ? ' - ' + req.target_section : '') : 'All COE Students'}</div>
          </div>
          <div class="info-block">
            <div class="label">Academic Term:</div>
            <div class="value">${req.academic_year} (${req.semester})</div>
          </div>
        </div>

        <div class="gcash-box mt-3">
          <div class="label"><i class="fa-solid fa-wallet text-primary"></i> Designated GCash Collection Account:</div>
          <div class="flex-between mt-1">
            <div><strong>${req.gcash_account_name}</strong> (${req.gcash_account_number})</div>
            <button class="btn btn-xs btn-outline" onclick="navigator.clipboard.writeText('${req.gcash_account_number}'); alert('GCash number copied!');">
              <i class="fa-regular fa-copy"></i> Copy
            </button>
          </div>
        </div>

        <div class="stats-box mt-3">
          <h4>Collection Progress</h4>
          <div class="progress-bar-container mt-1">
            <div class="progress-bar-fill" style="width: ${req.stats.collectionRate}%;"></div>
          </div>
          <div class="flex-between mt-1 small text-muted">
            <span>Collected: ₱${req.stats.totalCollected.toLocaleString()} (${req.stats.paidStudents} paid)</span>
            <span>Target: ₱${req.stats.targetExpected.toLocaleString()} (${req.stats.totalStudents} total students)</span>
          </div>
        </div>

        ${req.authorization_remarks ? `
          <div class="remarks-box mt-3">
            <strong>Dean Authorization Remarks:</strong>
            <p>${req.authorization_remarks}</p>
            <div class="small text-muted">Authorized by ${req.authorizer_name || 'Admin'} on ${req.authorized_at}</div>
          </div>
        ` : ''}
      </div>
    `;

    window.coeApp.showModal('Payment Request Particulars', modalBody, null);
  },

  openAuthorizeModal(requestId) {
    const req = window.coepayDb.getRequestById(requestId);
    if (!req) return;

    const modalBody = `
      <div>
        <p>You are about to authorize <strong>${req.title}</strong> for collection.</p>
        <div class="alert alert-info mt-2">
          <i class="fa-solid fa-info-circle"></i> Authorizing this request will automatically generate payment obligations for all students matching: 
          <strong>${req.target_year_level ? 'Year ' + req.target_year_level + (req.target_section ? ' - ' + req.target_section : '') : 'All COE Students'}</strong>.
        </div>
        <div class="form-group mt-3">
          <label class="form-label">Head Engineer's / Coordinator's Authorization Remarks (Optional):</label>
          <textarea id="auth-remarks-input" class="form-control" rows="3" placeholder="e.g. Authorized for collection per Academic Council Resolution..."></textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="CoeAdminView.confirmAuthorize(${requestId})">
        <i class="fa-solid fa-stamp"></i> Approve & Dispatch to Students
      </button>
    `;

    window.coeApp.showModal('Authorize Payment Request', modalBody, footer);
  },

  confirmAuthorize(requestId) {
    const remarks = document.getElementById('auth-remarks-input')?.value || '';
    const adminUser = window.coeAuth.getUser();

    try {
      const result = window.coepayDb.authorizePaymentRequest(requestId, adminUser, remarks);
      window.coeApp.closeModal();
      window.coeApp.showToast(`Request authorized successfully! Generated ${result.assignedCount} student assignments.`, 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  openRejectModal(requestId) {
    const req = window.coepayDb.getRequestById(requestId);
    if (!req) return;

    const modalBody = `
      <div>
        <p>Please specify the justification for rejecting <strong>${req.title}</strong>.</p>
        <div class="form-group mt-3">
          <label class="form-label">Rejection Remarks (Required):</label>
          <textarea id="reject-remarks-input" class="form-control" rows="3" placeholder="Provide reason so personnel can adjust amount, purpose, or requirements..." required></textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="CoeAdminView.confirmReject(${requestId})">
        <i class="fa-solid fa-xmark"></i> Confirm Rejection
      </button>
    `;

    window.coeApp.showModal('Reject Payment Request', modalBody, footer);
  },

  confirmReject(requestId) {
    const remarks = document.getElementById('reject-remarks-input')?.value || '';
    if (!remarks.trim()) {
      alert("Please provide rejection remarks.");
      return;
    }
    const adminUser = window.coeAuth.getUser();

    try {
      window.coepayDb.rejectPaymentRequest(requestId, adminUser, remarks);
      window.coeApp.closeModal();
      window.coeApp.showToast('Payment request has been rejected.', 'warning');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  renderRoster() {
    const tbody = document.getElementById('admin-roster-table-body');
    if (!tbody) return;

    const searchQuery = document.getElementById('roster-search')?.value.toLowerCase() || '';
    const yearFilter = document.getElementById('roster-year-filter')?.value || 'all';
    const statusFilter = document.getElementById('roster-status-filter')?.value || 'all';

    let students = window.coepayDb.getStudents();

    if (yearFilter !== 'all') {
      students = students.filter(s => s.year_level === Number(yearFilter));
    }

    if (searchQuery) {
      students = students.filter(s => 
        s.student_number.toLowerCase().includes(searchQuery) ||
        s.full_name.toLowerCase().includes(searchQuery) ||
        s.section.toLowerCase().includes(searchQuery)
      );
    }

    // Filter by clearance status
    if (statusFilter !== 'all') {
      students = students.filter(s => {
        const studentAssignments = window.coepayDb.getAssignments({ student_id: s.student_id });
        const totalAssigned = studentAssignments.length;
        const paidAssigned = studentAssignments.filter(a => a.status === 'paid').length;
        const pendingAssigned = studentAssignments.filter(a => a.status === 'pending_verification').length;

        if (statusFilter === 'cleared') {
          return totalAssigned > 0 && totalAssigned === paidAssigned;
        } else if (statusFilter === 'pending') {
          return pendingAssigned > 0;
        } else if (statusFilter === 'unpaid') {
          return studentAssignments.some(a => a.status === 'unpaid' || a.status === 'overdue');
        }
        return true;
      });
    }

    if (students.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No students found matching this criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = students.map(s => {
      const studentAssignments = window.coepayDb.getAssignments({ student_id: s.student_id });
      const totalAssigned = studentAssignments.length;
      const paidAssigned = studentAssignments.filter(a => a.status === 'paid').length;
      const isCleared = totalAssigned > 0 && totalAssigned === paidAssigned;

      return `
        <tr>
          <td><strong>${s.student_number}</strong></td>
          <td>
            <strong>${s.full_name}</strong>
            <div class="small text-muted"><i class="fa-regular fa-envelope"></i> ${s.email || 'N/A'}</div>
          </td>
          <td><span class="badge badge-outline">${s.program}</span></td>
          <td>Year ${s.year_level} - ${s.section}</td>
          <td class="small">${s.contact_number || 'N/A'}</td>
          <td>
            ${isCleared 
              ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 100% Cleared (Paid)</span>'
              : `<span class="badge ${paidAssigned > 0 ? 'badge-amber' : 'badge-danger'}">${paidAssigned}/${totalAssigned} Settled</span>`
            }
          </td>
          <td>
            ${s.is_active ? '<span class="status-dot status-active">Active</span>' : '<span class="status-dot status-inactive">Inactive</span>'}
          </td>
          <td class="text-right">
            <div class="flex-gap justify-end">
              <button class="btn btn-xs btn-outline-info" title="Send default password (password123) to ${s.email}" onclick="CoeAdminView.dispatchStudentDefaultPassword('${s.student_number}')">
                <i class="fa-solid fa-paper-plane"></i> Send Password
              </button>
              <button class="btn btn-xs btn-outline-primary" onclick="CoeAdminView.viewStudentClearance(${s.student_id})">
                <i class="fa-solid fa-file-invoice"></i> View Record
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterRoster() {
    this.renderRoster();
  },

  viewStudentClearance(studentId) {
    const student = window.coepayDb.getStudentById(studentId);
    if (!student) return;

    const studentAssignments = window.coepayDb.getAssignments({ student_id: studentId });
    const totalAssigned = studentAssignments.length;
    const paidAssigned = studentAssignments.filter(a => a.status === 'paid').length;
    const isCleared = totalAssigned > 0 && totalAssigned === paidAssigned;
    const totalPaidAmount = studentAssignments.filter(a => a.status === 'paid').reduce((sum, a) => sum + Number(a.request.amount || 0), 0);

    const modalBody = `
      <div class="clearance-view-container">
        <div class="student-card-header flex-between">
          <div>
            <h4>${student.full_name}</h4>
            <p class="text-muted">${student.student_number} • ${student.program} - Year ${student.year_level} (${student.section})</p>
          </div>
          <div>
            ${isCleared 
              ? '<span class="badge badge-success" style="font-size: 0.85rem; padding: 0.5rem 0.8rem;"><i class="fa-solid fa-shield-check"></i> 100% EXAM CLEARED</span>'
              : `<span class="badge badge-amber">${paidAssigned}/${totalAssigned} Obligations Settled</span>`}
          </div>
        </div>

        <div class="stats-grid mt-3" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 1rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Verified Settlement:</div>
            <div class="stat-value text-success">₱${totalPaidAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Clearance Verification:</div>
            <div class="stat-value text-primary">${isCleared ? 'Compliant' : 'Incomplete'}</div>
          </div>
        </div>

        <h5 class="mt-3">Assigned COE Financial Obligations & Transaction Details</h5>
        <div class="table-responsive mt-2">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Obligation</th>
                <th>Amount</th>
                <th>Status</th>
                <th>GCash Reference No.</th>
                <th>Date Paid / Verified</th>
                <th class="text-right">Receipt / Voucher</th>
              </tr>
            </thead>
            <tbody>
              ${studentAssignments.map(a => {
                const trans = a.transaction || {};
                const isPaid = a.status === 'paid';
                return `
                  <tr>
                    <td><strong>${a.request.title}</strong><div class="text-muted small">${a.request.category_name}</div></td>
                    <td class="font-bold ${isPaid ? 'text-success' : 'text-main'}">₱${parseFloat(a.request.amount).toFixed(2)}</td>
                    <td>${CoeAdminView.getAssignmentStatusBadge(a.status)}</td>
                    <td>${trans.gcash_reference_number ? `<code class="gcash-ref-code">${trans.gcash_reference_number}</code>` : '<span class="text-muted">-</span>'}</td>
                    <td class="small">${trans.verified_at || trans.payment_timestamp || '-'}</td>
                    <td class="text-right">
                      ${isPaid ? `
                        <button class="btn btn-xs btn-outline-success" onclick="CoeStudentView.openClearanceCertModal(${a.assignment_id})">
                          <i class="fa-solid fa-print"></i> Official Voucher
                        </button>
                      ` : a.status === 'pending_verification' ? `
                        <button class="btn btn-xs btn-outline" onclick="CoePersonnelView.inspectReceipt(${trans.transaction_id})">
                          <i class="fa-solid fa-eye"></i> Inspect
                        </button>
                      ` : '<span class="text-muted small">Unsettled</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    window.coeApp.showModal(`Student Financial Clearance Ledger • ${student.student_number}`, modalBody, null, 'modal-lg');
  },

  getAssignmentStatusBadge(status) {
    switch (status) {
      case 'paid':
        return '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Paid</span>';
      case 'pending_verification':
        return '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Verification</span>';
      case 'overdue':
        return '<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>';
      default:
        return '<span class="badge badge-secondary">Unpaid</span>';
    }
  },

  renderCategories() {
    const categories = window.coepayDb.getAllCategories();
    const tbody = document.getElementById('admin-categories-table-body');
    if (!tbody) return;

    tbody.innerHTML = categories.map(cat => `
      <tr>
        <td>${cat.category_id}</td>
        <td><strong>${cat.category_name}</strong></td>
        <td>${cat.description || '-'}</td>
        <td>${cat.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}</td>
        <td class="small">${cat.created_at}</td>
      </tr>
    `).join('');
  },

  renderAuditLogs() {
    const logs = window.coepayDb.getAuditLogs(60);
    const tbody = document.getElementById('admin-audit-table-body');
    if (!tbody) return;

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>#${l.log_id}</td>
        <td>${l.created_at}</td>
        <td><span class="user-pill">${l.username} (${l.user_role})</span></td>
        <td><span class="action-tag action-${l.action_type.toLowerCase()}">${l.action_type}</span></td>
        <td>${l.entity_name} (${l.entity_id || '-'})</td>
        <td>${l.details}</td>
        <td class="text-muted small">${l.ip_address}</td>
      </tr>
    `).join('');
  },

  openAddStudentModal() {
    const modalBody = `
      <form id="add-student-form" onsubmit="event.preventDefault(); CoeAdminView.saveNewStudent();">
        <div class="grid-2-col">
          <div class="form-group">
            <label class="form-label">Student ID Number *</label>
            <input type="text" id="new-student-no" class="form-control" placeholder="e.g. 2026-04501" required>
          </div>
          <div class="form-group">
            <label class="form-label">Institutional Email *</label>
            <input type="email" id="new-student-email" class="form-control" placeholder="student@student.icct.edu.ph" required>
          </div>
        </div>

        <div class="grid-3-col mt-2">
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input type="text" id="new-student-fname" class="form-control" required>
          </div>
          <div class="form-group">
            <label class="form-label">Middle Name</label>
            <input type="text" id="new-student-mname" class="form-control">
          </div>
          <div class="form-group">
            <label class="form-label">Last Name *</label>
            <input type="text" id="new-student-lname" class="form-control" required>
          </div>
        </div>

        <div class="grid-3-col mt-2">
          <div class="form-group">
            <label class="form-label">Program</label>
            <select id="new-student-program" class="form-select">
              <option value="BSCpE">BS Computer Engineering</option>
              <option value="BSEE">BS Electrical Engineering</option>
              <option value="BSECE">BS Electronics Engineering</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Year Level *</label>
            <select id="new-student-year" class="form-select" required>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4" selected>4th Year</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Section *</label>
            <input type="text" id="new-student-section" class="form-control" placeholder="e.g. BSCpE-4A" required>
          </div>
        </div>

        <div class="form-group mt-2">
          <label class="form-label">Contact Number</label>
          <input type="text" id="new-student-contact" class="form-control" placeholder="09XXXXXXXXX">
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-student-form').requestSubmit();">
        <i class="fa-solid fa-save"></i> Save & Enroll
      </button>
    `;

    window.coeApp.showModal('Enroll New Engineering Student', modalBody, footer);
  },

  saveNewStudent() {
    const adminUser = window.coeAuth.getUser();
    const data = {
      student_number: document.getElementById('new-student-no').value,
      email: document.getElementById('new-student-email').value,
      first_name: document.getElementById('new-student-fname').value,
      middle_name: document.getElementById('new-student-mname').value,
      last_name: document.getElementById('new-student-lname').value,
      program: document.getElementById('new-student-program').value,
      year_level: document.getElementById('new-student-year').value,
      section: document.getElementById('new-student-section').value,
      contact_number: document.getElementById('new-student-contact').value
    };

    try {
      window.coepayDb.createStudent(data, adminUser);
      window.coeApp.closeModal();
      window.coeApp.showToast(`Enrolled student ${data.student_number} successfully.`, 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  openAddCategoryModal() {
    const modalBody = `
      <form id="add-category-form" onsubmit="event.preventDefault(); CoeAdminView.saveNewCategory();">
        <div class="form-group">
          <label class="form-label">Category Name *</label>
          <input type="text" id="new-cat-name" class="form-control" placeholder="e.g. Embedded Systems Lab Kit" required>
        </div>
        <div class="form-group mt-2">
          <label class="form-label">Description</label>
          <textarea id="new-cat-desc" class="form-control" rows="3" placeholder="Explain the purpose of this fee category..."></textarea>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('add-category-form').requestSubmit();">
        <i class="fa-solid fa-plus"></i> Create Category
      </button>
    `;

    window.coeApp.showModal('Add Payment Category', modalBody, footer);
  },

  saveNewCategory() {
    const adminUser = window.coeAuth.getUser();
    const name = document.getElementById('new-cat-name').value;
    const desc = document.getElementById('new-cat-desc').value;

    try {
      window.coepayDb.createCategory(name, desc, adminUser);
      window.coeApp.closeModal();
      window.coeApp.showToast(`Category "${name}" created.`, 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  exportSqlDump() {
    const sql = window.coepayDb.generateSqlDump();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coepay_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    window.coeApp.showToast('MySQL database dump exported successfully!', 'success');
  },

  exportCsvReport() {
    const assignments = window.coepayDb.getAssignments();
    let csv = "Assignment_ID,Student_Number,Student_Name,Program,Year_Level,Section,Request_Title,Category,Amount,Status,GCash_Ref,Verified_At\n";

    assignments.forEach(a => {
      const trans = a.transaction || {};
      csv += `"${a.assignment_id}","${a.student.student_number}","${a.student.full_name}","${a.student.program}","${a.student.year_level}","${a.student.section}","${a.request.title}","${a.request.category_name}","${a.request.amount}","${a.status}","${trans.gcash_reference_number || ''}","${trans.verified_at || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coepay_financial_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.coeApp.showToast('Financial CSV report exported!', 'success');
  },

  /**
   * Dispatches default login password (password123) and instructions to an individual student
   */
  dispatchStudentDefaultPassword(studentNumber) {
    try {
      const emailRecord = window.coepayDb.dispatchDefaultPasswordToStudent(studentNumber);
      window.coeApp.showToast(`Default password dispatched to ${emailRecord.recipient_email}!`, 'success');
      window.coeApp.updateEmailDispatchBadge();
      window.coeApp.renderEmailViewerModal(
        emailRecord.subject,
        `${emailRecord.recipient_name} <${emailRecord.recipient_email}>`,
        emailRecord.dispatched_at,
        emailRecord.body_text
      );
    } catch (err) {
      alert(err.message);
    }
  },

  /**
   * Bulk dispatches default password (password123) to all official masterlist student emails
   */
  dispatchDefaultPasswordsToAll() {
    const students = window.coepayDb.getStudents();
    if (!confirm(`Dispatch official login credentials and default password (password123) to all ${students.length} students in the masterlist? Each student will receive a formatted notification at their registered email.`)) {
      return;
    }

    try {
      const results = window.coepayDb.dispatchDefaultPasswordsToAllMasterlist();
      window.coeApp.showToast(`Successfully dispatched credentials to all ${results.length} students!`, 'success');
      window.coeApp.updateEmailDispatchBadge();

      const summaryRows = results.map(r => `
        <tr>
          <td><strong>${r.student_number}</strong></td>
          <td>${r.full_name}</td>
          <td><i class="fa-regular fa-envelope"></i> ${r.email}</td>
          <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> ${r.status}</span></td>
          <td class="small text-muted font-mono">${r.dispatched_at}</td>
        </tr>
      `).join('');

      const modalBody = `
        <div class="dispatch-summary-wrapper py-2">
          <div class="alert alert-success">
            <i class="fa-solid fa-circle-check"></i> Dispatched default login credentials to <strong>${results.length} student emails</strong> in the official masterlist.
          </div>
          <div class="table-responsive mt-3" style="max-height: 320px; overflow-y: auto;">
            <table class="data-table small">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Recipient Email</th>
                  <th>Delivery Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
              </tbody>
            </table>
          </div>
          <div class="mt-3 small text-muted">
            <i class="fa-solid fa-info-circle"></i> Default password configured: <code class="font-bold">password123</code>. All transmission receipts recorded in the immutable audit trail and outbox.
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-outline" onclick="window.coeApp.openEmailDispatchDrawer()"><i class="fa-solid fa-inbox"></i> View Outbox</button>
        <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Done</button>
      `;

      window.coeApp.showModal('Default Password Dispatch Report', modalBody, footer);
    } catch (err) {
      alert(err.message);
    }
  },

  /**
   * Stat Card 1: Total Verified Collections Breakdown & Ledger
   */
  openCollectionsModal() {
    const transactions = window.coepayDb.getTransactions();
    const verifiedTrans = transactions.filter(t => t.status === 'verified');
    const totalCollected = verifiedTrans.reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);
    const gcashTotal = verifiedTrans.filter(t => (t.gateway_type || 'gcash').toLowerCase() !== 'bank').reduce((s, t) => s + Number(t.amount_paid || 0), 0);
    const bankTotal = verifiedTrans.filter(t => (t.gateway_type || '').toLowerCase() === 'bank').reduce((s, t) => s + Number(t.amount_paid || 0), 0);

    // Grouping by Category / Purpose
    const byCategory = {};
    verifiedTrans.forEach(t => {
      const cat = t.category_name || (t.request ? t.request.category_name : 'General College Fee');
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
      byCategory[cat].count++;
      byCategory[cat].total += Number(t.amount_paid || 0);
    });

    const categoryEntries = Object.entries(byCategory);

    const modalBody = `
      <div class="collections-breakdown-modal">
        <!-- Top Stats Row -->
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Verified Sum</div>
            <div class="stat-value text-success" style="font-size: 1.4rem;">₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-muted">${verifiedTrans.length} Verified Transactions</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">GCash Gateway</div>
            <div class="stat-value text-primary" style="font-size: 1.4rem;">₱${gcashTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-qrcode"></i> Automated / QR Ingestion</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Bank Transfers</div>
            <div class="stat-value text-indigo" style="font-size: 1.4rem;">₱${bankTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-muted">Direct Institutional Clearing</div>
          </div>
        </div>

        <!-- Category Breakdown Grid -->
        <h5 class="mb-2"><i class="fa-solid fa-tags text-primary"></i> Collections by Contribution Category</h5>
        <div class="grid-3-col mb-3" style="gap: 0.75rem;">
          ${categoryEntries.length > 0 ? categoryEntries.map(([cat, data]) => `
            <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.65rem 0.85rem;">
              <div class="font-bold small text-truncate" title="${cat}">${cat}</div>
              <div class="text-success font-bold mt-1">₱${data.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div class="text-muted small">${data.count} paid transaction${data.count === 1 ? '' : 's'}</div>
            </div>
          `).join('') : '<div class="alert alert-info py-2">No category data recorded yet.</div>'}
        </div>

        <!-- Transactions Table -->
        <div class="flex-between align-center mb-2">
          <h5 class="m-0"><i class="fa-solid fa-list-check text-emerald"></i> Verified Payment Transactions Ledger</h5>
          <span class="badge badge-success">${verifiedTrans.length} Verified Records</span>
        </div>
        <div class="table-responsive" style="max-height: 320px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Ref #</th>
                <th>Student</th>
                <th>Fee Purpose</th>
                <th>Amount</th>
                <th>Reference Number</th>
                <th>Verified At</th>
                <th>Verifier</th>
              </tr>
            </thead>
            <tbody>
              ${verifiedTrans.length > 0 ? verifiedTrans.map(t => `
                <tr>
                  <td><strong>#${t.transaction_id}</strong></td>
                  <td>
                    <strong>${t.student_name || (t.student ? t.student.full_name : 'COE Student')}</strong>
                    <div class="text-muted small">${t.student_number || (t.student ? t.student.student_number : '-')}</div>
                  </td>
                  <td>
                    <strong>${t.request_title || (t.request ? t.request.title : 'Department Obligation')}</strong>
                    <div class="text-muted small">${t.category_name || (t.request ? t.request.category_name : '-')}</div>
                  </td>
                  <td class="font-bold text-success">₱${parseFloat(t.amount_paid).toFixed(2)}</td>
                  <td><code class="gcash-ref-code">${t.gcash_reference_number || '-'}</code></td>
                  <td class="small">${t.verified_at || t.submitted_at || '-'}</td>
                  <td class="small text-muted">${t.verifier_name || 'Engr. Santos'}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" class="text-center py-3 text-muted">No verified transactions found.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoeAdminView.exportCsvReport()">
        <i class="fa-solid fa-file-csv text-success"></i> Export Report (.csv)
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal('Total Verified Collections Breakdown', modalBody, footer, 'modal-lg');
  },

  /**
   * Stat Card 2: Collection Compliance Rate & Cohort Assessment
   */
  openComplianceModal() {
    const students = window.coepayDb.getStudents();
    const assignments = window.coepayDb.getAssignments();
    const transactions = window.coepayDb.getTransactions();

    const verifiedTrans = transactions.filter(t => t.status === 'verified');
    const totalCollected = verifiedTrans.reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);
    const totalExpected = assignments.reduce((sum, a) => sum + Number(a.request.amount || 0), 0);
    const remainingBalance = Math.max(0, totalExpected - totalCollected);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // Student Clearance Summary
    let fullyClearedCount = 0;
    let pendingCount = 0;
    let unpaidCount = 0;

    students.forEach(s => {
      const sAssign = assignments.filter(a => a.student_id === s.student_id);
      if (sAssign.length === 0) return;
      const isPaidAll = sAssign.every(a => a.status === 'paid');
      const hasPending = sAssign.some(a => a.status === 'pending_verification');
      if (isPaidAll) fullyClearedCount++;
      else if (hasPending) pendingCount++;
      else unpaidCount++;
    });

    // Grouping by Cohort / Section
    const cohortMap = {};
    students.forEach(s => {
      const key = `Year ${s.year_level} - ${s.section}`;
      if (!cohortMap[key]) {
        cohortMap[key] = {
          name: key,
          program: s.program || 'BSCpE',
          studentCount: 0,
          expected: 0,
          collected: 0
        };
      }
      cohortMap[key].studentCount++;
    });

    assignments.forEach(a => {
      const s = a.student;
      if (!s) return;
      const key = `Year ${s.year_level} - ${s.section}`;
      if (cohortMap[key]) {
        cohortMap[key].expected += Number(a.request.amount || 0);
        if (a.status === 'paid') {
          cohortMap[key].collected += Number(a.request.amount || 0);
        }
      }
    });

    const cohortList = Object.values(cohortMap);

    const modalBody = `
      <div class="compliance-modal-wrapper">
        <!-- Progress Bar Card -->
        <div class="card mb-3 p-3" style="border: 1px solid var(--border-color); background: var(--bg-main);">
          <div class="flex-between align-center mb-1">
            <span class="font-bold">Overall Institutional Collection Compliance</span>
            <span class="badge badge-emerald font-bold" style="font-size: 0.95rem;">${collectionRate}% Compliance</span>
          </div>
          <div class="progress-bar-container mt-2" style="height: 12px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
            <div class="progress-bar-fill" style="width: ${collectionRate}%; height: 100%; background: linear-gradient(90deg, #10B981, #059669); transition: width 0.5s ease;"></div>
          </div>
          <div class="flex-between small text-muted mt-2">
            <span><strong class="text-success">₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> Collected</span>
            <span><strong class="text-danger">₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> Remaining</span>
            <span>Target: <strong>₱${totalExpected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        <!-- 3 KPIs Row -->
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">100% Cleared Students</div>
            <div class="stat-value text-success" style="font-size: 1.35rem;">${fullyClearedCount} / ${students.length}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-shield-check"></i> Examination Cleared</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Pending Verification</div>
            <div class="stat-value text-amber" style="font-size: 1.35rem;">${pendingCount} Students</div>
            <div class="stat-footnote text-amber"><i class="fa-solid fa-clock"></i> In Verification Queue</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Unsettled Obligations</div>
            <div class="stat-value text-danger" style="font-size: 1.35rem;">${unpaidCount} Students</div>
            <div class="stat-footnote text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Follow-up Needed</div>
          </div>
        </div>

        <!-- Cohort Breakdown Table -->
        <h5 class="mb-2"><i class="fa-solid fa-layer-group text-primary"></i> Compliance Breakdown by Program Cohort</h5>
        <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Cohort / Section</th>
                <th>Program</th>
                <th>Enrolled</th>
                <th>Target Expected</th>
                <th>Verified Collected</th>
                <th>Compliance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${cohortList.map(c => {
                const rate = c.expected > 0 ? Math.round((c.collected / c.expected) * 100) : 100;
                return `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.program}</td>
                    <td>${c.studentCount} Students</td>
                    <td>₱${c.expected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td class="font-bold text-success">₱${c.collected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div class="flex-between align-center" style="gap: 6px;">
                        <span class="font-bold">${rate}%</span>
                        <div style="flex:1; max-width: 60px; height: 6px; background: #e2e8f0; border-radius: 999px; overflow:hidden;">
                          <div style="width: ${rate}%; height: 100%; background: ${rate >= 75 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444'};"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${rate >= 75 ? 'badge-success' : rate >= 40 ? 'badge-amber' : 'badge-danger'}">
                        ${rate >= 75 ? 'High Compliance' : rate >= 40 ? 'Moderate' : 'Action Required'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoeAdminView.switchTab('roster'); document.getElementById('roster-status-filter').value = 'unpaid'; CoeAdminView.filterRoster(); window.coeApp.closeModal();">
        <i class="fa-solid fa-filter text-amber"></i> Filter Roster: Unpaid Students
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal('Collection Compliance & Cohort Assessment', modalBody, footer, 'modal-lg');
  },

  /**
   * Stat Card 3: Pending Authorizations Queue
   */
  openPendingAuthorizationsModal() {
    const requests = window.coepayDb.getPaymentRequests();
    const pending = requests.filter(r => r.status === 'pending_authorization');

    if (pending.length === 0) {
      const authorized = requests.filter(r => r.status === 'authorized');
      const modalBody = `
        <div class="text-center py-3">
          <div style="font-size: 3rem; color: #10B981; margin-bottom: 0.75rem;">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <h4>All Payment Requests Authorized!</h4>
          <p class="text-muted" style="max-width: 480px; margin: 0 auto;">
            There are currently <strong>0 pending authorizations</strong> waiting for Dean/Coordinator approval. All department fee requests have been processed.
          </p>

          <div class="stats-grid mt-4 mb-2" style="grid-template-columns: repeat(2, 1fr); text-align: left; gap: 0.75rem;">
            <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
              <div class="stat-label">Active Authorized Requests</div>
              <div class="stat-value text-primary" style="font-size: 1.3rem;">${authorized.length} Requests</div>
              <div class="stat-footnote text-success"><i class="fa-solid fa-check-double"></i> Published to Students</div>
            </div>
            <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
              <div class="stat-label">Pending Verification Queue</div>
              <div class="stat-value text-amber" style="font-size: 1.3rem;">${window.coepayDb.getTransactions().filter(t => t.status === 'pending').length} Receipts</div>
              <div class="stat-footnote text-muted">Officer Review Active</div>
            </div>
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-outline" onclick="CoeAdminView.switchTab('authorizations'); window.coeApp.closeModal();">
          <i class="fa-solid fa-list"></i> Open Authorizations Queue
        </button>
        <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Done</button>
      `;

      window.coeApp.showModal('Payment Request Authorizations Queue', modalBody, footer);
      return;
    }

    const modalBody = `
      <div class="pending-auth-modal">
        <div class="alert alert-amber mb-3">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <strong>${pending.length} Payment Request(s)</strong> require your official authorization before obligations are published to students.
        </div>

        <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Ref #</th>
                <th>Fee Purpose & Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Target Cohort</th>
                <th>Submitted By</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pending.map(r => `
                <tr>
                  <td><strong>#${r.request_id}</strong></td>
                  <td>
                    <strong>${r.title}</strong>
                    <div class="text-muted small">${r.description ? r.description.slice(0, 50) + '...' : '-'}</div>
                  </td>
                  <td><span class="badge badge-secondary">${r.category_name}</span></td>
                  <td class="font-bold text-primary">₱${parseFloat(r.amount).toFixed(2)}</td>
                  <td><span class="badge badge-outline">${r.target_year_level ? 'Year ' + r.target_year_level + (r.target_section ? ' - ' + r.target_section : '') : 'All COE'}</span></td>
                  <td class="small">${r.creator_name || 'Faculty Personnel'}</td>
                  <td class="text-right">
                    <button class="btn btn-xs btn-success" onclick="CoeAdminView.openAuthorizeModal(${r.request_id})" title="Authorize this request">
                      <i class="fa-solid fa-stamp"></i> Authorize
                    </button>
                    <button class="btn btn-xs btn-outline-danger" onclick="CoeAdminView.openRejectModal(${r.request_id})" title="Reject this request">
                      <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoeAdminView.switchTab('authorizations'); window.coeApp.closeModal();">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> Go to Full Tab
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal(`Pending Authorizations (${pending.length} Awaiting Approval)`, modalBody, footer, 'modal-lg');
  },

  /**
   * Stat Card 4: Active COE Students & Cohort Roster Directory
   */
  openActiveStudentsModal() {
    const students = window.coepayDb.getStudents();
    const assignments = window.coepayDb.getAssignments();

    // Clearance Counts
    let clearedCount = 0;
    let pendingCount = 0;
    let unpaidCount = 0;

    students.forEach(s => {
      const sAssign = assignments.filter(a => a.student_id === s.student_id);
      if (sAssign.length === 0) return;
      if (sAssign.every(a => a.status === 'paid')) clearedCount++;
      else if (sAssign.some(a => a.status === 'pending_verification')) pendingCount++;
      else unpaidCount++;
    });

    const modalBody = `
      <div class="active-students-modal">
        <!-- Top Stats Row -->
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Enrolled</div>
            <div class="stat-value text-primary" style="font-size: 1.35rem;">${students.length}</div>
            <div class="stat-footnote text-muted">Active in Masterlist</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Fully Cleared</div>
            <div class="stat-value text-success" style="font-size: 1.35rem;">${clearedCount}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-shield-check"></i> 100% Paid</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Pending Verif.</div>
            <div class="stat-value text-amber" style="font-size: 1.35rem;">${pendingCount}</div>
            <div class="stat-footnote text-amber"><i class="fa-solid fa-clock"></i> In Queue</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Unpaid Dues</div>
            <div class="stat-value text-danger" style="font-size: 1.35rem;">${unpaidCount}</div>
            <div class="stat-footnote text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Incomplete</div>
          </div>
        </div>

        <div class="flex-between align-center mb-2">
          <h5 class="m-0"><i class="fa-solid fa-graduation-cap text-indigo"></i> Active Students Directory</h5>
          <span class="badge badge-indigo">BS Computer Engineering</span>
        </div>

        <div class="table-responsive" style="max-height: 320px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Year & Section</th>
                <th>Registered Email</th>
                <th>Clearance</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => {
                const sAssign = assignments.filter(a => a.student_id === s.student_id);
                const isPaidAll = sAssign.length > 0 && sAssign.every(a => a.status === 'paid');
                const hasPending = sAssign.some(a => a.status === 'pending_verification');
                return `
                  <tr>
                    <td><strong>${s.student_number}</strong></td>
                    <td><strong>${s.full_name}</strong></td>
                    <td><span class="badge badge-outline">Year ${s.year_level} (${s.section})</span></td>
                    <td class="small text-muted"><i class="fa-regular fa-envelope"></i> ${s.email || '-'}</td>
                    <td>
                      ${isPaidAll 
                        ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Cleared</span>' 
                        : hasPending 
                        ? '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending</span>' 
                        : '<span class="badge badge-danger">Unpaid</span>'}
                    </td>
                    <td class="text-right">
                      <button class="btn btn-xs btn-outline-primary" onclick="CoeAdminView.viewStudentClearance(${s.student_id})" title="Inspect student clearance breakdown">
                        <i class="fa-solid fa-receipt"></i> Clearance
                      </button>
                      <button class="btn btn-xs btn-outline-success" onclick="CoeAdminView.dispatchStudentDefaultPassword('${s.student_number}')" title="Send default password to email">
                        <i class="fa-solid fa-paper-plane"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoeAdminView.switchTab('roster'); window.coeApp.closeModal();">
        <i class="fa-solid fa-table-list"></i> Full Student Roster Tab
      </button>
      <button class="btn btn-outline-primary" onclick="CoeMasterlistUpload.openModal(); window.coeApp.closeModal();">
        <i class="fa-solid fa-file-arrow-up"></i> Bulk Upload
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal(`Active COE Students Directory (${students.length} Enrolled)`, modalBody, footer, 'modal-lg');
  }
};

// Export to global window object
window.CoeAdminView = CoeAdminView;
