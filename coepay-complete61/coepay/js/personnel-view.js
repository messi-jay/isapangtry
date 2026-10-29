/**
 * COE-Pay: Faculty & Personnel View Controller
 * Handles payment request drafting/submission, transaction verification queue,
 * GCash receipt inspection, and section collection sheets.
 */

const CoePersonnelView = {
  render() {
    const container = document.getElementById('personnel-view-container');
    if (!container) return;

    const personnel = window.coeAuth.getProfile();
    const user = window.coeAuth.getUser();
    const currentTerm = window.coepayDb.getCurrentTerm();

    // Requests created by this personnel
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const allRequests = window.coepayDb.getPaymentRequests();

    // Transactions pending verification for requests created by this personnel (or all if chair)
    const myRequestIds = myRequests.map(r => r.request_id);
    const allPendingTransactions = window.coepayDb.getTransactions({ status: 'pending' });
    const pendingTransactions = allPendingTransactions.filter(t => myRequestIds.includes(t.request_id));

    // Stats
    const totalCollectedForMyReqs = myRequests.reduce((sum, r) => sum + r.stats.totalCollected, 0);
    const totalExpectedForMyReqs = myRequests.reduce((sum, r) => sum + r.stats.targetExpected, 0);
    const rate = totalExpectedForMyReqs > 0 ? Math.round((totalCollectedForMyReqs / totalExpectedForMyReqs) * 100) : 0;

    container.innerHTML = `
      <!-- Personnel / Officer Subheader -->
      <div class="view-header">
        <div>
          <span class="badge badge-personnel"><i class="fa-solid fa-clipboard-user"></i> Student Officer & Collection Console</span>
          <h1 class="page-title">${personnel.full_name || 'Pearl Catequista'}</h1>
          <p class="page-subtitle">
            <strong>${personnel.designation || 'College Student Officer & Financial Treasurer'}</strong> • 
            Responsibility: <strong>Request for adding items, seminars, and other fees; inspect receipts</strong>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="CoePersonnelView.openCreateRequestModal()">
            <i class="fa-solid fa-circle-plus"></i> Request Fee / Seminar / Item
          </button>
        </div>
      </div>

      <!-- Personnel Metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-blue-subtle">
            <i class="fa-solid fa-peso-sign text-primary"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Collected for Your Requests</div>
            <div class="stat-value">₱${totalCollectedForMyReqs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-circle-check"></i> Credited to GCash Account</div>
          </div>
        </div>

        <div class="stat-card ${pendingTransactions.length > 0 ? 'card-pulse' : ''}">
          <div class="stat-icon bg-amber-subtle">
            <i class="fa-solid fa-receipt text-amber"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Pending Verification Queue</div>
            <div class="stat-value">${pendingTransactions.length}</div>
            <div class="stat-footnote ${pendingTransactions.length > 0 ? 'text-amber' : 'text-muted'}">
              ${pendingTransactions.length > 0 ? 'Receipts Awaiting Inspection' : 'Queue Cleared'}
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-emerald-subtle">
            <i class="fa-solid fa-chart-line text-emerald"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Target Compliance Rate</div>
            <div class="stat-value">${rate}%</div>
            <div class="stat-footnote text-muted">Target: ₱${totalExpectedForMyReqs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-indigo-subtle">
            <i class="fa-solid fa-folder-tree text-indigo"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Active Initiated Requests</div>
            <div class="stat-value">${myRequests.length}</div>
            <div class="stat-footnote text-muted">Academic Term: ${currentTerm.semester}</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs-nav">
        <button class="tab-btn active" onclick="CoePersonnelView.switchTab('verification')">
          <i class="fa-solid fa-shield-check"></i> Verification Queue (${pendingTransactions.length})
        </button>
        <button class="tab-btn" onclick="CoePersonnelView.switchTab('requests')">
          <i class="fa-solid fa-list-check"></i> My Payment Requests (${myRequests.length})
        </button>
        <button class="tab-btn" onclick="CoePersonnelView.switchTab('roster-monitor')">
          <i class="fa-solid fa-table-list"></i> Section Collection Monitoring
        </button>
      </div>

      <!-- TAB 1: Verification Queue -->
      <div id="personnel-tab-verification" class="admin-tab-content active">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Student Payment Verification Queue</h2>
              <p class="card-subtitle">Verify student GCash receipts, reference numbers, and match against your designated mobile wallet.</p>
            </div>
            <div class="small text-muted">
              <i class="fa-solid fa-shield-halved text-primary"></i> Anti-Fraud Reference Check Active
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Student Details</th>
                    <th>Request / Obligation</th>
                    <th>GCash Reference No.</th>
                    <th>Sender Info</th>
                    <th>Amount Paid</th>
                    <th>Payment Date</th>
                    <th>Receipt</th>
                    <th class="text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody id="personnel-verification-table-body">
                  <!-- Populated by renderVerificationQueue() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: My Payment Requests -->
      <div id="personnel-tab-requests" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Initiated Payment Requests</h2>
              <p class="card-subtitle">Contribution programs created by you under this academic term.</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="CoePersonnelView.openCreateRequestModal()">
              <i class="fa-solid fa-plus"></i> New Request
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Target Cohort</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Collection Progress</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="personnel-requests-table-body">
                  <!-- Populated by renderMyRequests() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Section Collection Monitoring -->
      <div id="personnel-tab-roster-monitor" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Class & Section Master Collection Sheet</h2>
              <p class="card-subtitle">View student settlement compliance breakdown by section and export official billing sheets.</p>
            </div>
            <div class="flex-gap">
              <select id="personnel-monitor-request-select" class="form-select form-select-sm" onchange="CoePersonnelView.renderSectionMonitor()">
                ${myRequests.map(r => `<option value="${r.request_id}">${r.title} (₱${r.amount})</option>`).join('')}
              </select>
              <select id="personnel-monitor-status-filter" class="form-select form-select-sm" onchange="CoePersonnelView.renderSectionMonitor()">
                <option value="all">All Students</option>
                <option value="paid">✅ Paid Only (Settled)</option>
                <option value="pending_verification">⏳ Pending Verification</option>
                <option value="unpaid">⚠️ Unpaid / Overdue</option>
              </select>
              <button class="btn btn-sm btn-outline" onclick="CoePersonnelView.exportSectionCsv()">
                <i class="fa-solid fa-download"></i> Export Sheet (.csv)
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Payment Status</th>
                    <th>GCash Reference</th>
                    <th>Amount</th>
                    <th>Verified Timestamp</th>
                    <th class="text-right">Inspection Action</th>
                  </tr>
                </thead>
                <tbody id="personnel-monitor-table-body">
                  <!-- Populated by renderSectionMonitor() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderVerificationQueue();
    this.renderMyRequests();
    this.renderSectionMonitor();
  },

  switchTab(tabKey) {
    document.querySelectorAll('#personnel-view-container .admin-tabs-nav .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#personnel-view-container .admin-tab-content').forEach(c => c.classList.remove('active'));

    const activeBtn = Array.from(document.querySelectorAll('#personnel-view-container .admin-tabs-nav .tab-btn')).find(b => b.textContent.toLowerCase().includes(tabKey));
    if (activeBtn) activeBtn.classList.add('active');

    const tabContent = document.getElementById(`personnel-tab-${tabKey}`);
    if (tabContent) tabContent.classList.add('active');
  },

  renderVerificationQueue() {
    const tbody = document.getElementById('personnel-verification-table-body');
    if (!tbody) return;

    const personnel = window.coeAuth.getProfile();
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const myRequestIds = myRequests.map(r => r.request_id);

    // Get all pending transactions for my requests (or all if chair)
    let pending = window.coepayDb.getTransactions({ status: 'pending' });
    if (myRequestIds.length > 0) {
      pending = pending.filter(t => myRequestIds.includes(t.request_id));
    }

    if (pending.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted"><i class="fa-solid fa-circle-check text-success"></i> No pending student payment verifications at this time.</td></tr>`;
      return;
    }

    tbody.innerHTML = pending.map(t => `
      <tr>
        <td><strong>#TX-${t.transaction_id}</strong></td>
        <td>
          <strong>${t.student.full_name}</strong>
          <div class="small text-muted">${t.student.student_number} • ${t.student.section}</div>
        </td>
        <td>
          <strong>${t.request.title}</strong>
          <div class="small text-muted">${t.request.category_name}</div>
        </td>
        <td>
          <code class="gcash-ref-code">${t.gcash_reference_number}</code>
        </td>
        <td>
          <div>${t.gcash_sender_name}</div>
          <div class="small text-muted">${t.gcash_sender_number}</div>
        </td>
        <td class="font-bold text-primary">₱${parseFloat(t.amount_paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td class="small">${t.payment_timestamp}</td>
        <td>
          <button class="btn btn-xs btn-outline" onclick="CoePersonnelView.inspectReceipt(${t.transaction_id})">
            <i class="fa-solid fa-image"></i> View Receipt
          </button>
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn btn-xs btn-success" onclick="CoePersonnelView.confirmVerifyModal(${t.transaction_id})">
              <i class="fa-solid fa-check"></i> Verify
            </button>
            <button class="btn btn-xs btn-danger" onclick="CoePersonnelView.confirmRejectModal(${t.transaction_id})">
              <i class="fa-solid fa-xmark"></i> Reject
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  inspectReceipt(transactionId) {
    const trans = window.coepayDb.getTransactions().find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const receiptSvg = CoeReceiptHelper.generateGcashReceiptSvg({
      gcash_reference_number: trans.gcash_reference_number,
      amount_paid: trans.amount_paid,
      gcash_sender_name: trans.gcash_sender_name,
      gcash_sender_number: trans.gcash_sender_number,
      gcash_account_name: trans.request.gcash_account_name,
      gcash_account_number: trans.request.gcash_account_number,
      payment_timestamp: trans.payment_timestamp,
      title: trans.request.title
    });

    const modalBody = `
      <div class="receipt-inspection-modal">
        <div class="grid-2-col">
          <div class="receipt-preview-container">
            ${receiptSvg}
          </div>
          <div class="inspection-details-panel">
            <h4>Verification Particulars</h4>
            <div class="detail-item mt-2">
              <span class="label">Student Name:</span>
              <span class="value font-bold">${trans.student.full_name} (${trans.student.student_number})</span>
            </div>
            <div class="detail-item">
              <span class="label">Section / Cohort:</span>
              <span class="value">${trans.student.program} - Year ${trans.student.year_level} (${trans.student.section})</span>
            </div>
            <div class="detail-item">
              <span class="label">Payable Obligation:</span>
              <span class="value">${trans.request.title}</span>
            </div>
            <div class="detail-item">
              <span class="label">Expected Amount:</span>
              <span class="value font-bold">₱${parseFloat(trans.request.amount).toFixed(2)}</span>
            </div>
            <div class="detail-item">
              <span class="label">Declared Amount Paid:</span>
              <span class="value font-bold text-success">₱${parseFloat(trans.amount_paid).toFixed(2)}</span>
            </div>
            <div class="detail-item">
              <span class="label">GCash Reference No.:</span>
              <span class="value"><code class="gcash-ref-code">${trans.gcash_reference_number}</code></span>
            </div>
            <div class="detail-item">
              <span class="label">Sender Name & Mobile:</span>
              <span class="value">${trans.gcash_sender_name} (${trans.gcash_sender_number})</span>
            </div>
            <div class="detail-item">
              <span class="label">Transaction Date:</span>
              <span class="value">${trans.payment_timestamp}</span>
            </div>
            ${trans.student_notes ? `
              <div class="detail-item">
                <span class="label">Student Notes:</span>
                <span class="value italic">"${trans.student_notes}"</span>
              </div>
            ` : ''}

            <div class="verification-action-box mt-3">
              <label class="form-label">Personnel Verification Note (Optional):</label>
              <input type="text" id="inspect-remarks-input" class="form-control" placeholder="e.g. Verified via GCash Merchant statement...">
              <div class="action-buttons mt-3">
                <button class="btn btn-success w-100" onclick="CoePersonnelView.executeVerify(${trans.transaction_id})">
                  <i class="fa-solid fa-check-circle"></i> Approve & Issue Official Clearance
                </button>
                <button class="btn btn-danger w-100 mt-1" onclick="CoePersonnelView.executeReject(${trans.transaction_id})">
                  <i class="fa-solid fa-circle-xmark"></i> Reject Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    window.coeApp.showModal(`GCash Receipt Audit & Inspection • Ref #${trans.gcash_reference_number}`, modalBody, null, 'modal-lg');
  },

  confirmVerifyModal(transactionId) {
    this.inspectReceipt(transactionId);
  },

  confirmRejectModal(transactionId) {
    const trans = window.coepayDb.getTransactions().find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const modalBody = `
      <div>
        <p>Please enter the reason for rejecting student payment for <strong>${trans.student.full_name}</strong> (Ref: <code>${trans.gcash_reference_number}</code>).</p>
        <div class="form-group mt-3">
          <label class="form-label">Rejection Reason *</label>
          <textarea id="reject-reason-input" class="form-control" rows="3" placeholder="e.g. Unreadable receipt screenshot / GCash reference not found in statement / Amount paid is short..." required></textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="CoePersonnelView.executeReject(${transactionId})">
        <i class="fa-solid fa-xmark"></i> Confirm Reject
      </button>
    `;

    window.coeApp.showModal('Reject Payment Submission', modalBody, footer);
  },

  executeVerify(transactionId) {
    const remarks = document.getElementById('inspect-remarks-input')?.value || 'Verified against merchant ledger.';
    const user = window.coeAuth.getUser();

    try {
      window.coepayDb.verifyPayment(transactionId, user, remarks);
      window.coeApp.closeModal();
      window.coeApp.showToast('Payment verified successfully! Student clearance granted.', 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeReject(transactionId) {
    const remarks = document.getElementById('reject-reason-input')?.value || 
                    document.getElementById('inspect-remarks-input')?.value || 
                    'Payment rejected due to invalid reference or unreadable receipt.';
    const user = window.coeAuth.getUser();

    try {
      window.coepayDb.rejectPayment(transactionId, user, remarks);
      window.coeApp.closeModal();
      window.coeApp.showToast('Payment submission rejected.', 'warning');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  renderMyRequests() {
    const tbody = document.getElementById('personnel-requests-table-body');
    if (!tbody) return;

    const personnel = window.coeAuth.getProfile();
    const requests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No requests initiated yet. Click "New Payment Request" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map(r => {
      const targetCohort = r.target_year_level 
        ? `Year ${r.target_year_level} ${r.target_section ? '(' + r.target_section + ')' : '(All Sections)'}`
        : 'All COE Students';

      return `
        <tr>
          <td><span class="badge badge-light">REQ-${r.request_id}</span></td>
          <td>
            <strong>${r.title}</strong>
            <div class="small text-muted">${r.description.substring(0, 45)}...</div>
          </td>
          <td><span class="badge badge-outline">${r.category_name}</span></td>
          <td class="font-bold text-primary">₱${parseFloat(r.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
          <td><span class="cohort-tag">${targetCohort}</span></td>
          <td class="small">${new Date(r.deadline).toLocaleDateString()}</td>
          <td>${CoeAdminView.getStatusBadge(r.status)}</td>
          <td>
            <div class="progress-bar-container small">
              <div class="progress-bar-fill" style="width: ${r.stats.collectionRate}%;"></div>
            </div>
            <div class="small text-muted mt-1">${r.stats.paidStudents}/${r.stats.totalStudents} (${r.stats.collectionRate}%)</div>
          </td>
          <td class="text-right">
            <button class="btn btn-xs btn-outline" onclick="CoeAdminView.viewRequestDetails(${r.request_id})">
              <i class="fa-solid fa-eye"></i> Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderSectionMonitor() {
    const select = document.getElementById('personnel-monitor-request-select');
    const statusFilter = document.getElementById('personnel-monitor-status-filter')?.value || 'all';
    const tbody = document.getElementById('personnel-monitor-table-body');
    if (!select || !tbody) return;

    const reqId = Number(select.value);
    if (!reqId) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Select a payment request above to monitor section compliance.</td></tr>`;
      return;
    }

    let assignments = window.coepayDb.getAssignments({ request_id: reqId });

    if (statusFilter !== 'all') {
      assignments = assignments.filter(a => a.status === statusFilter);
    }

    if (assignments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No student records found matching this status filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = assignments.map(a => {
      const trans = a.transaction || {};
      const isPaid = a.status === 'paid';
      const isPending = a.status === 'pending_verification';

      return `
        <tr>
          <td><strong>${a.student.student_number}</strong></td>
          <td>${a.student.full_name}</td>
          <td><span class="cohort-tag">${a.student.section}</span></td>
          <td>${CoeAdminView.getAssignmentStatusBadge(a.status)}</td>
          <td>${trans.gcash_reference_number ? `<code class="gcash-ref-code">${trans.gcash_reference_number}</code>` : '<span class="text-muted">-</span>'}</td>
          <td class="font-bold ${isPaid ? 'text-success' : 'text-main'}">₱${parseFloat(a.request.amount).toFixed(2)}</td>
          <td class="small">${trans.verified_at || trans.submitted_at || '-'}</td>
          <td class="text-right">
            ${isPaid && trans.transaction_id ? `
              <button class="btn btn-xs btn-outline-success" onclick="CoePersonnelView.inspectReceipt(${trans.transaction_id})">
                <i class="fa-solid fa-receipt"></i> View e-Receipt
              </button>
            ` : isPending && trans.transaction_id ? `
              <button class="btn btn-xs btn-amber" onclick="CoePersonnelView.inspectReceipt(${trans.transaction_id})">
                <i class="fa-solid fa-stamp"></i> Verify Receipt
              </button>
            ` : '<span class="text-muted small">Awaiting Payment</span>'}
          </td>
        </tr>
      `;
    }).join('');
  },

  openCreateRequestModal() {
    const categories = window.coepayDb.getCategories();
    const currentTerm = window.coepayDb.getCurrentTerm();
    const personnel = window.coeAuth.getProfile();

    const modalBody = `
      <form id="create-request-form" onsubmit="event.preventDefault(); CoePersonnelView.saveNewRequest();">
        <div class="form-group">
          <label class="form-label">Payment Purpose / Title *</label>
          <input type="text" id="req-title" class="form-control" placeholder="e.g. 1st Sem 2026-2027 BSCpE Laboratory Maintenance Fee" required>
        </div>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="req-category" class="form-select" required>
              ${categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Academic Term</label>
            <input type="text" class="form-control" value="${currentTerm.academic_year} (${currentTerm.semester})" readonly>
            <input type="hidden" id="req-term-id" value="${currentTerm.term_id}">
          </div>
        </div>

        <div class="form-group mt-2">
          <label class="form-label">Detailed Description / Instructions *</label>
          <textarea id="req-description" class="form-control" rows="3" placeholder="Detail the breakdown of fees, what it covers, and instructions for payment..." required></textarea>
        </div>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">Payable Amount per Student (PHP) *</label>
            <input type="number" step="0.01" min="1" id="req-amount" class="form-control" placeholder="350.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline Date & Time *</label>
            <input type="datetime-local" id="req-deadline" class="form-control" required>
          </div>
        </div>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">Target Year Level</label>
            <select id="req-target-year" class="form-select">
              <option value="">All Year Levels (College-wide)</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Section (Optional)</label>
            <input type="text" id="req-target-section" class="form-control" placeholder="e.g. BSCpE-4A (or leave blank for all sections)">
          </div>
        </div>

        <div class="section-divider mt-3"></div>
        <h4 class="mt-2"><i class="fa-solid fa-wallet text-primary"></i> Designated GCash Collection Account</h4>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">GCash Account Full Name *</label>
            <input type="text" id="req-gcash-name" class="form-control" value="${personnel.full_name.toUpperCase()} (COE TREASURER)" required>
          </div>
          <div class="form-group">
            <label class="form-label">GCash Mobile Number *</label>
            <input type="text" id="req-gcash-number" class="form-control" value="${personnel.contact_number || '09171234567'}" required>
          </div>
        </div>

        <div class="form-group mt-3">
          <label class="checkbox-label">
            <input type="checkbox" id="req-submit-direct" checked>
            <span><strong>Submit immediately for Dean Authorization</strong> (Uncheck to save as draft)</span>
          </label>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('create-request-form').requestSubmit();">
        <i class="fa-solid fa-paper-plane"></i> Submit Request
      </button>
    `;

    window.coeApp.showModal('Create Payment Request', modalBody, footer);

    // Set default deadline to 14 days from now
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const pad = (n) => String(n).padStart(2, '0');
    const defaultDeadline = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T23:59`;
    document.getElementById('req-deadline').value = defaultDeadline;
  },

  saveNewRequest() {
    const user = window.coeAuth.getUser();
    const data = {
      title: document.getElementById('req-title').value,
      category_id: document.getElementById('req-category').value,
      term_id: document.getElementById('req-term-id').value,
      description: document.getElementById('req-description').value,
      amount: document.getElementById('req-amount').value,
      deadline: document.getElementById('req-deadline').value.replace('T', ' ') + ':00',
      target_year_level: document.getElementById('req-target-year').value || null,
      target_section: document.getElementById('req-target-section').value || null,
      gcash_account_name: document.getElementById('req-gcash-name').value,
      gcash_account_number: document.getElementById('req-gcash-number').value,
      submit_for_authorization: document.getElementById('req-submit-direct').checked
    };

    try {
      window.coepayDb.createPaymentRequest(data, user);
      window.coeApp.closeModal();
      window.coeApp.showToast(
        data.submit_for_authorization 
          ? 'Payment request submitted for Dean authorization!' 
          : 'Payment request saved as draft.',
        'success'
      );
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  exportSectionCsv() {
    const select = document.getElementById('personnel-monitor-request-select');
    if (!select) return;
    const reqId = Number(select.value);
    const req = window.coepayDb.getRequestById(reqId);
    const assignments = window.coepayDb.getAssignments({ request_id: reqId });

    let csv = "Student_Number,Full_Name,Section,Status,GCash_Ref,Amount,Verified_At\n";
    assignments.forEach(a => {
      const trans = a.transaction || {};
      csv += `"${a.student.student_number}","${a.student.full_name}","${a.student.section}","${a.status}","${trans.gcash_reference_number || ''}","${req.amount}","${trans.verified_at || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_collection_${reqId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.coeApp.showToast('Section collection sheet exported!', 'success');
  }
};

// Export to global window object
window.CoePersonnelView = CoePersonnelView;
