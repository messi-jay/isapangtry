/**
 * COE-Pay: Student Portal View Controller
 * Flowchart Alignment:
 * - What do you want to do? -> Pay fees / Buy Merch | Transaction History | Log Out (Confirmation)
 * - What do you want to pay? -> Department fees | COE MERCH (Browse Items, Add to cart & Check out)
 * - Display Department code / GCash / Bank no.
 * - User pays via GCash / Bank -> Input Ref No., Upload Receipt, Status = Pending
 * - Transaction Records with status (Pending / Verified / Rejected)
 */

const CoeStudentView = {
  activeMainTab: 'pay_browse', // 'pay_browse' or 'history'
  activeSubTab: 'department_fees', // 'department_fees' or 'coe_merch'
  cart: [],

  merchCatalog: [
    {
      id: 'merch_1',
      title: 'Official COE Technical Polo Shirt',
      category: 'Department Uniform / Shirt',
      amount: 450.00,
      icon: 'fa-shirt',
      badge: 'Official Uniform',
      description: 'Official College of Engineering breathable dry-fit technical polo shirt with embroidered institutional seal.'
    },
    {
      id: 'merch_2',
      title: 'COE Engineering Lanyard & Acrylic Badge Holder',
      category: 'COE Merch',
      amount: 150.00,
      icon: 'fa-id-badge',
      badge: 'Accessories',
      description: 'Premium institutional woven strap with safety release buckle and heavy-duty transparent badge holder.'
    },
    {
      id: 'merch_3',
      title: 'Engineering Gold Seal Lapel Pin & Honor Badge',
      category: 'COE Merch',
      amount: 120.00,
      icon: 'fa-certificate',
      badge: 'Ceremonial',
      description: 'Die-cast gold-plated institutional lapel pin for official department assemblies and convention attendance.'
    },
    {
      id: 'merch_4',
      title: 'Capstone Research Hardcover Defense Binder Kit',
      category: 'Capstone & Research',
      amount: 350.00,
      icon: 'fa-book-bookmark',
      badge: 'Academic Kit',
      description: 'Institutional maroon gold-embossed manuscript folio binder required for senior capstone defense submissions.'
    },
    {
      id: 'merch_5',
      title: 'Embedded Systems & IoT Hardware Workshop Lab Kit',
      category: 'Laboratory Kit',
      amount: 750.00,
      icon: 'fa-microchip',
      badge: 'Lab Equipment',
      description: 'ESP32 Wi-Fi/Bluetooth microcontroller, sensor modules, breadboard, and connection leads for lab experiments.'
    }
  ],

  render() {
    const container = document.getElementById('student-view-container');
    if (!container) return;

    const student = window.coeAuth.getProfile();
    const user = window.coeAuth.getUser();
    const currentTerm = window.coepayDb.getCurrentTerm();

    // Get all assignments for this student
    const assignments = window.coepayDb.getAssignments({ student_id: student.student_id });

    // Financial summaries
    let totalPaid = 0;
    let totalOutstanding = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    assignments.forEach(a => {
      const amt = Number(a.request.amount || 0);
      if (a.status === 'paid') {
        totalPaid += amt;
      } else if (a.status === 'pending_verification') {
        pendingCount++;
        totalOutstanding += amt;
      } else if (a.status === 'overdue') {
        overdueCount++;
        totalOutstanding += amt;
      } else {
        totalOutstanding += amt;
      }
    });

    const totalFees = totalPaid + totalOutstanding;
    const clearancePct = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 100;
    const isFullyCleared = totalOutstanding === 0 && assignments.length > 0;
    const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    container.innerHTML = `
      <!-- Student Profile Banner -->
      <div class="student-profile-banner">
        <div class="student-avatar-box">
          <div class="avatar-circle">
            <i class="fa-solid fa-user-graduate"></i>
          </div>
        </div>
        <div class="student-info-main">
          <div class="student-meta-top">
            <span class="badge badge-student"><i class="fa-solid fa-cart-shopping"></i> Student Portal • Purchase, Paying & Ordering</span>
            <span class="student-id-tag">SN: <strong>${student.student_number}</strong></span>
          </div>
          <h1 class="student-name">${student.full_name}</h1>
          <p class="student-details">
            <strong>${student.program}</strong> • Year ${student.year_level} (${student.section}) • 
            Term: <strong>${currentTerm.academic_year} (${currentTerm.semester})</strong>
          </p>
        </div>
        <div class="student-clearance-status">
          <div class="clearance-badge-wrap">
            ${isFullyCleared ? `
              <div class="badge-cleared-full">
                <i class="fa-solid fa-circle-check"></i> 100% EXAM CLEARED
              </div>
            ` : `
              <div class="badge-cleared-pending">
                <i class="fa-solid fa-clock"></i> ${clearancePct}% CLEARED
              </div>
            `}
          </div>
          <div class="progress-bar-container mt-2">
            <div class="progress-bar-fill" style="width: ${clearancePct}%;"></div>
          </div>
          <div class="small text-muted mt-1 text-right">${totalPaid > 0 ? '₱' + totalPaid.toLocaleString() + ' of ₱' + totalFees.toLocaleString() : 'No payments settled yet'}</div>
        </div>
      </div>

      <!-- FLOWCHART DECISION 1: "What do you want to do?" -->
      <div class="flowchart-nav-bar mt-3">
        <div class="flowchart-prompt-label">
          <i class="fa-solid fa-diagram-project text-primary"></i> <strong>What do you want to do?</strong>
        </div>
        <div class="flowchart-nav-buttons">
          <button class="flowchart-btn ${this.activeMainTab === 'pay_browse' ? 'active' : ''}" onclick="CoeStudentView.switchMainTab('pay_browse')">
            <i class="fa-solid fa-wallet"></i> Pay Fees / Buy Merch
          </button>
          <button class="flowchart-btn ${this.activeMainTab === 'history' ? 'active' : ''}" onclick="CoeStudentView.switchMainTab('history')">
            <i class="fa-solid fa-clock-rotate-left"></i> Transaction History
          </button>
          <button class="flowchart-btn btn-flowchart-logout" onclick="window.coeAuth.confirmLogout()">
            <i class="fa-solid fa-arrow-right-from-bracket text-danger"></i> Log Out
          </button>
        </div>
      </div>

      <!-- SECTION 1: PAY FEES / BUY MERCH -->
      <div id="student-section-pay-browse" style="display: ${this.activeMainTab === 'pay_browse' ? 'block' : 'none'};">
        <!-- FLOWCHART SUB-DECISION: "What do you want to pay?" -->
        <div class="card mt-3">
          <div class="card-header flex-between">
            <div class="flex-gap align-center">
              <span class="sub-decision-label"><i class="fa-solid fa-hand-holding-dollar text-primary"></i> <strong>What do you want to pay?</strong></span>
              <div class="sub-tab-pills">
                <button class="sub-tab-btn ${this.activeSubTab === 'department_fees' ? 'active' : ''}" onclick="CoeStudentView.switchSubTab('department_fees')">
                  <i class="fa-solid fa-receipt"></i> Department Fees (${assignments.length})
                </button>
                <button class="sub-tab-btn ${this.activeSubTab === 'coe_merch' ? 'active' : ''}" onclick="CoeStudentView.switchSubTab('coe_merch')">
                  <i class="fa-solid fa-bag-shopping"></i> COE MERCH (${this.merchCatalog.length})
                </button>
              </div>
            </div>

            <div class="cart-trigger-box">
              <button class="btn btn-sm btn-outline-primary" onclick="CoeStudentView.openCartDrawer()">
                <i class="fa-solid fa-cart-shopping"></i> My Cart 
                <span class="badge badge-primary cart-badge-count" id="student-cart-badge">${cartCount}</span>
              </button>
            </div>
          </div>

          <div class="card-body">
            <!-- 1A: DEPARTMENT FEES -->
            <div id="subtab-department-fees" style="display: ${this.activeSubTab === 'department_fees' ? 'block' : 'none'};">
              <div class="alert alert-info small mb-3">
                <i class="fa-solid fa-circle-info"></i> Official college dues and contributions authorized by the Dean's Office for your cohort.
              </div>
              <div class="dues-cards-list">
                ${assignments.length === 0 ? `
                  <div class="p-4 text-center text-muted">
                    <i class="fa-solid fa-circle-check fa-3x text-success mb-2"></i>
                    <h3>No Outstanding Dues</h3>
                    <p>All departmental fee obligations for your cohort are settled.</p>
                  </div>
                ` : assignments.map(a => CoeStudentView.renderDueCard(a)).join('')}
              </div>
            </div>

            <!-- 1B: COE MERCH (Add to Cart & Checkout) -->
            <div id="subtab-coe-merch" style="display: ${this.activeSubTab === 'coe_merch' ? 'block' : 'none'};">
              <div class="alert alert-info small mb-3">
                <i class="fa-solid fa-shirt"></i> Official College of Engineering merchandise, uniforms, and academic kits. Browse items, add to cart, and check out via GCash or Bank Transfer.
              </div>
              <div class="merch-store-grid">
                ${this.merchCatalog.map(item => `
                  <div class="merch-card">
                    <div class="merch-card-icon">
                      <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <div class="merch-card-body">
                      <span class="badge badge-outline">${item.badge}</span>
                      <h4 class="merch-title mt-1">${item.title}</h4>
                      <p class="merch-desc small text-muted">${item.description}</p>
                      <div class="merch-price-row flex-between mt-2">
                        <span class="merch-price">₱${item.amount.toFixed(2)}</span>
                        <button class="btn btn-xs btn-primary" onclick="CoeStudentView.addToCart('${item.id}')">
                          <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: TRANSACTION HISTORY -->
      <div id="student-section-history" style="display: ${this.activeMainTab === 'history' ? 'block' : 'none'};">
        <div class="card mt-3">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title"><i class="fa-solid fa-clock-rotate-left text-primary"></i> Transaction Records & Settlement Status</h2>
              <p class="card-subtitle">Official ICCT COE transaction ledger: Pending, Verified, and Rejected records.</p>
            </div>
            <div class="flex-gap">
              <select id="student-history-filter" class="form-select form-select-sm" onchange="CoeStudentView.filterHistoryTable()">
                <option value="all">All Payment Statuses</option>
                <option value="verified">Verified (Approved)</option>
                <option value="pending">Pending Verification</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table small">
                <thead>
                  <tr>
                    <th>Voucher / Ref #</th>
                    <th>Payment Title</th>
                    <th>Channel</th>
                    <th>Amount Paid</th>
                    <th>Submission Reference</th>
                    <th>Date / Timestamp</th>
                    <th>Payment Status</th>
                    <th class="text-right">Action / Receipt</th>
                  </tr>
                </thead>
                <tbody id="student-history-tbody">
                  <!-- Populated by renderHistoryTable() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderHistoryTable();
  },

  switchMainTab(tab) {
    this.activeMainTab = tab;
    this.render();
  },

  switchSubTab(subTab) {
    this.activeSubTab = subTab;
    const feesDiv = document.getElementById('subtab-department-fees');
    const merchDiv = document.getElementById('subtab-coe-merch');
    if (feesDiv) feesDiv.style.display = subTab === 'department_fees' ? 'block' : 'none';
    if (merchDiv) merchDiv.style.display = subTab === 'coe_merch' ? 'block' : 'none';

    document.querySelectorAll('.sub-tab-btn').forEach(b => {
      b.classList.remove('active');
      if (subTab === 'department_fees' && b.innerText.includes('Department Fees')) b.classList.add('active');
      if (subTab === 'coe_merch' && b.innerText.includes('COE MERCH')) b.classList.add('active');
    });
  },

  addToCart(merchId) {
    const item = this.merchCatalog.find(m => m.id === merchId);
    if (!item) return;

    const existing = this.cart.find(c => c.id === merchId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        id: item.id,
        title: item.title,
        amount: item.amount,
        quantity: 1
      });
    }

    const badge = document.getElementById('student-cart-badge');
    const totalCount = this.cart.reduce((sum, c) => sum + c.quantity, 0);
    if (badge) badge.innerText = totalCount;

    window.coeApp.showToast(`Added "${item.title}" to cart!`, 'success');
  },

  removeFromCart(merchId) {
    this.cart = this.cart.filter(c => c.id !== merchId);
    this.openCartDrawer();
    const badge = document.getElementById('student-cart-badge');
    if (badge) badge.innerText = this.cart.reduce((sum, c) => sum + c.quantity, 0);
  },

  updateCartQty(merchId, delta) {
    const item = this.cart.find(c => c.id === merchId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeFromCart(merchId);
      return;
    }
    this.openCartDrawer();
  },

  openCartDrawer() {
    const totalAmount = this.cart.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

    const modalBody = `
      <div class="cart-drawer-content">
        <div class="cart-header-row flex-between">
          <h4><i class="fa-solid fa-cart-shopping text-primary"></i> Your COE Merch Shopping Cart</h4>
          <span class="badge badge-outline">${this.cart.length} unique item(s)</span>
        </div>

        ${this.cart.length === 0 ? `
          <div class="p-4 text-center text-muted">
            <i class="fa-solid fa-cart-arrow-down fa-3x text-muted mb-2"></i>
            <p>Your shopping cart is currently empty. Browse the COE Merch catalog to add items.</p>
          </div>
        ` : `
          <div class="cart-items-list mt-3">
            ${this.cart.map(item => `
              <div class="cart-item-row flex-between py-2 border-bottom">
                <div>
                  <strong>${item.title}</strong>
                  <div class="small text-muted">₱${item.amount.toFixed(2)} each</div>
                </div>
                <div class="flex-gap align-center">
                  <div class="qty-stepper">
                    <button class="btn btn-xs btn-outline" onclick="CoeStudentView.updateCartQty('${item.id}', -1)">-</button>
                    <span class="px-2 font-bold">${item.quantity}</span>
                    <button class="btn btn-xs btn-outline" onclick="CoeStudentView.updateCartQty('${item.id}', 1)">+</button>
                  </div>
                  <span class="font-bold text-primary" style="min-width: 70px; text-align: right;">₱${(item.amount * item.quantity).toFixed(2)}</span>
                  <button class="btn btn-xs btn-outline-danger" onclick="CoeStudentView.removeFromCart('${item.id}')" title="Remove">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="cart-total-box mt-3 p-3 bg-surface-subtle border rounded flex-between">
            <span class="font-bold" style="font-size: 1.1rem;">Cart Total (PHP):</span>
            <span class="font-bold text-primary" style="font-size: 1.35rem;">₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
        `}
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Continue Shopping</button>
      ${this.cart.length > 0 ? `
        <button class="btn btn-primary" onclick="CoeStudentView.openPaymentModalForCart()">
          <i class="fa-solid fa-credit-card"></i> Proceed to Checkout (₱${totalAmount.toFixed(2)})
        </button>
      ` : ''}
    `;

    window.coeApp.showModal('COE Merch Cart & Checkout', modalBody, footer);
  },

  renderDueCard(assignment) {
    const req = assignment.request;
    const trans = assignment.transaction;
    const isPaid = assignment.status === 'paid';
    const isPending = assignment.status === 'pending_verification';
    const isOverdue = assignment.status === 'overdue';

    const deadlineDate = new Date(req.deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    let countdownText = '';
    if (isPaid) {
      countdownText = '<span class="text-success font-bold"><i class="fa-solid fa-circle-check"></i> Settled & Cleared</span>';
    } else if (isPending) {
      countdownText = '<span class="text-amber font-bold"><i class="fa-solid fa-clock"></i> Verification in Progress</span>';
    } else if (diffDays < 0) {
      countdownText = `<span class="text-danger font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Overdue by ${Math.abs(diffDays)} day(s)</span>`;
    } else {
      countdownText = `<span class="text-primary"><i class="fa-regular fa-calendar-days"></i> Due in ${diffDays} day(s)</span>`;
    }

    return `
      <div class="due-card ${isOverdue ? 'due-card-overdue' : ''} ${isPaid ? 'due-card-paid' : ''}">
        <div class="due-card-header">
          <div class="flex-between">
            <span class="badge badge-outline">${req.category_name}</span>
            <div>${CoeAdminView.getAssignmentStatusBadge(assignment.status)}</div>
          </div>
          <h3 class="due-card-title mt-2">${req.title}</h3>
          <p class="due-card-desc">${req.description}</p>
        </div>

        <div class="due-card-body">
          <div class="grid-2-col">
            <div>
              <div class="text-muted small">Payable Amount:</div>
              <div class="due-card-amount">₱${parseFloat(req.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="text-right">
              <div class="text-muted small">Due Date:</div>
              <div class="font-bold small">${deadlineDate.toLocaleDateString()}</div>
              <div class="small mt-1">${countdownText}</div>
            </div>
          </div>

          <div class="due-gcash-target mt-3">
            <div class="label"><i class="fa-solid fa-building-columns text-primary"></i> Designated Receiver (Dept Code: <strong>COE-CEDT-01</strong>):</div>
            <div class="value font-bold">${req.gcash_account_name} (${req.gcash_account_number})</div>
          </div>

          ${trans ? `
            <div class="trans-status-strip mt-2">
              <div class="small">
                <strong>Submission Ref:</strong> <code>${trans.gcash_reference_number}</code> • 
                <strong>Status:</strong> ${trans.status.toUpperCase()}
                ${trans.verification_remarks ? `<div class="italic text-muted mt-1">"${trans.verification_remarks}"</div>` : ''}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="due-card-footer">
          ${isPaid ? `
            <button class="btn btn-outline-success w-100" onclick="CoeStudentView.openClearanceCertModal(${assignment.assignment_id})">
              <i class="fa-solid fa-file-shield"></i> View Official Clearance Voucher
            </button>
          ` : isPending ? `
            <button class="btn btn-outline w-100" onclick="CoeStudentView.viewPendingSubmission(${assignment.assignment_id})">
              <i class="fa-solid fa-eye"></i> View Submitted Proof
            </button>
          ` : `
            <button class="btn btn-primary w-100" onclick="CoeStudentView.openPaymentModal(${assignment.assignment_id})">
              <i class="fa-solid fa-paper-plane"></i> Pay ₱${parseFloat(req.amount).toFixed(2)} (GCash / Bank)
            </button>
          `}
        </div>
      </div>
    `;
  },

  openPaymentModalForCart() {
    const totalAmount = this.cart.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    const itemNames = this.cart.map(c => `${c.title} (x${c.quantity})`).join(', ');

    // Use a placeholder cart payment workflow
    this.openPaymentModalDirect({
      title: `COE Merch Order: ${itemNames}`,
      amount: totalAmount,
      isCart: true
    });
  },

  openPaymentModal(assignmentId) {
    const assignment = window.coepayDb.getAssignments().find(a => a.assignment_id === Number(assignmentId));
    if (!assignment) return;
    const req = assignment.request;

    this.openPaymentModalDirect({
      title: req.title,
      amount: parseFloat(req.amount),
      assignmentId: assignmentId,
      isCart: false,
      gcashName: req.gcash_account_name,
      gcashNumber: req.gcash_account_number
    });
  },

  /**
   * Flowchart Step: Display Department code / GCash / Bank no.
   * User pays via GCash / Bank -> Input Ref No., Upload Receipt, Set Status = Pending
   */
  openPaymentModalDirect(config) {
    const student = window.coeAuth.getProfile();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const defaultTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const sampleRef = '90' + Math.floor(10000000000 + Math.random() * 90000000000);

    const modalBody = `
      <div class="student-payment-wizard">
        <div class="payment-steps-header">
          <div class="step-badge active">1. Choose Gateway (GCash / Bank)</div>
          <div class="step-arrow"><i class="fa-solid fa-chevron-right"></i></div>
          <div class="step-badge active">2. Enter Reference & Receipt</div>
          <div class="step-arrow"><i class="fa-solid fa-chevron-right"></i></div>
          <div class="step-badge active">3. Status = Pending</div>
        </div>

        <!-- Flowchart Gateway Selection -->
        <div class="gateway-toggle-box mt-3">
          <button type="button" class="gateway-toggle-btn active" id="btn-gateway-gcash" onclick="CoeStudentView.toggleGateway('gcash')">
            <i class="fa-solid fa-wallet text-primary"></i> GCash Gateway
          </button>
          <button type="button" class="gateway-toggle-btn" id="btn-gateway-bank" onclick="CoeStudentView.toggleGateway('bank')">
            <i class="fa-solid fa-building-columns text-success"></i> Bank Transfer (Landbank / BDO)
          </button>
        </div>

        <div class="grid-2-col mt-3">
          <!-- Left: Gateway Account Details -->
          <div class="gateway-details-card">
            <!-- GCASH DETAILS -->
            <div id="gateway-panel-gcash">
              <div class="gcash-header-pill">
                <img src="assets/img/gcash-logo.svg" alt="GCash" height="24">
                <span>Official Department Wallet</span>
              </div>
              <div class="qr-container-box mt-3 text-center">
                <img src="assets/img/qr-coe-org.svg" alt="GCash QR Code" class="img-responsive-qr">
                <div class="qr-caption mt-1">Scan via GCash App</div>
              </div>
              <div class="gcash-number-copy-box mt-2">
                <div class="label">GCash Account Number:</div>
                <div class="flex-between">
                  <span class="gcash-num-text">${config.gcashNumber || '09171234567'}</span>
                  <button type="button" class="btn btn-xs btn-outline" onclick="navigator.clipboard.writeText('${config.gcashNumber || '09171234567'}'); alert('GCash number copied!');">
                    <i class="fa-regular fa-copy"></i> Copy
                  </button>
                </div>
                <div class="small text-muted mt-1">Account Name: <strong>${config.gcashName || 'PEARL CATEQUISTA (COE OFFICER)'}</strong></div>
                <div class="small text-muted">Department Code: <strong>COE-CEDT-01</strong></div>
              </div>
            </div>

            <!-- BANK TRANSFER DETAILS -->
            <div id="gateway-panel-bank" style="display:none;">
              <div class="bank-header-pill">
                <i class="fa-solid fa-building-columns text-success"></i>
                <span>Official Depository Bank</span>
              </div>
              <div class="bank-info-box mt-3 p-3 bg-surface-subtle border rounded">
                <div class="small text-muted">Bank:</div>
                <div class="font-bold" style="font-size: 1.1rem; color: #065F46;">Landbank of the Philippines</div>
                <div class="small text-muted mt-2">Department Account Name:</div>
                <div class="font-bold">ICCT College of Engineering Student Council</div>
                <div class="small text-muted mt-2">Account Number:</div>
                <div class="flex-between">
                  <code style="font-size: 1.15rem; font-weight: 800; color: #065F46;">1428-5920-11</code>
                  <button type="button" class="btn btn-xs btn-outline" onclick="navigator.clipboard.writeText('1428592011'); alert('Bank account copied!');">
                    <i class="fa-regular fa-copy"></i> Copy
                  </button>
                </div>
                <div class="small text-muted mt-2">Department Routing Code: <strong>COE-CEDT-01</strong></div>
              </div>
            </div>

            <div class="alert alert-warning mt-3 small">
              <i class="fa-solid fa-circle-exclamation"></i> Save your GCash confirmation SMS or bank deposit slip screenshot. You will upload it as proof.
            </div>
          </div>

          <!-- Right: Submission Form -->
          <div class="payment-submission-card">
            <form id="student-submit-form" onsubmit="event.preventDefault(); CoeStudentView.executePaymentSubmission(${config.assignmentId || 'null'}, ${config.isCart ? 'true' : 'false'});">
              <input type="hidden" id="selected-gateway" value="gcash">

              <div class="form-group">
                <label class="form-label">Purpose / Order:</label>
                <input type="text" class="form-control" value="${config.title}" readonly>
              </div>

              <div class="grid-2-col mt-2">
                <div class="form-group">
                  <label class="form-label">Total Payable Amount (PHP) *</label>
                  <input type="number" step="0.01" id="pay-amount" class="form-control" value="${parseFloat(config.amount).toFixed(2)}" required readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Payment Date & Time *</label>
                  <input type="datetime-local" id="pay-timestamp" class="form-control" value="${defaultTime}" required>
                </div>
              </div>

              <div class="form-group mt-2">
                <div class="flex-between">
                  <label class="form-label" id="ref-label">GCash / Bank Reference Number *</label>
                  <button type="button" class="btn-link-sm" onclick="document.getElementById('pay-ref').value = '${sampleRef}';">
                    Use Test Reference
                  </button>
                </div>
                <input type="text" id="pay-ref" class="form-control font-mono font-bold" placeholder="e.g. 9021884920193 or LB-8920114" required>
                <div class="form-hint">Enter the transaction / reference number printed on your receipt.</div>
              </div>

              <div class="grid-2-col mt-2">
                <div class="form-group">
                  <label class="form-label">Sender Full Name *</label>
                  <input type="text" id="pay-sender-name" class="form-control" value="${student.full_name.toUpperCase()}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Sender Mobile / Account *</label>
                  <input type="text" id="pay-sender-number" class="form-control" value="${student.contact_number || '09201112233'}" required>
                </div>
              </div>

              <div class="form-group mt-2">
                <label class="form-label">Proof of Payment (Screenshot / Deposit Slip) *</label>
                <div class="receipt-upload-box">
                  <div class="upload-dummy">
                    <i class="fa-solid fa-cloud-arrow-up fa-2x text-primary"></i>
                    <div><strong>Receipt Screenshot Attached</strong></div>
                    <div class="small text-muted">Auto-generated realistic proof-of-payment image will be linked</div>
                  </div>
                </div>
              </div>

              <div class="form-group mt-2">
                <label class="form-label">Student Remarks (Optional)</label>
                <input type="text" id="pay-notes" class="form-control" placeholder="e.g. Paid via mobile app">
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('student-submit-form').requestSubmit();">
        <i class="fa-solid fa-paper-plane"></i> Submit Payment (Set Status to Pending)
      </button>
    `;

    window.coeApp.showModal('Payment Gateway Submission (GCash / Bank)', modalBody, footer, 'modal-lg');
  },

  toggleGateway(type) {
    const btnGcash = document.getElementById('btn-gateway-gcash');
    const btnBank = document.getElementById('btn-gateway-bank');
    const panelGcash = document.getElementById('gateway-panel-gcash');
    const panelBank = document.getElementById('gateway-panel-bank');
    const refLabel = document.getElementById('ref-label');
    const hiddenGateway = document.getElementById('selected-gateway');

    if (type === 'bank') {
      if (btnGcash) btnGcash.classList.remove('active');
      if (btnBank) btnBank.classList.add('active');
      if (panelGcash) panelGcash.style.display = 'none';
      if (panelBank) panelBank.style.display = 'block';
      if (refLabel) refLabel.innerText = 'Bank Deposit Reference / Trx No. *';
      if (hiddenGateway) hiddenGateway.value = 'bank';
    } else {
      if (btnGcash) btnGcash.classList.add('active');
      if (btnBank) btnBank.classList.remove('active');
      if (panelGcash) panelGcash.style.display = 'block';
      if (panelBank) panelBank.style.display = 'none';
      if (refLabel) refLabel.innerText = 'GCash Reference Number (13 Digits) *';
      if (hiddenGateway) hiddenGateway.value = 'gcash';
    }
  },

  executePaymentSubmission(assignmentId, isCart) {
    const user = window.coeAuth.getUser();
    const ref = document.getElementById('pay-ref').value.trim();
    const gateway = document.getElementById('selected-gateway')?.value || 'gcash';

    if (!ref) {
      alert("Please enter your transaction reference number.");
      return;
    }

    const data = {
      gcash_reference_number: ref,
      gateway_type: gateway,
      amount_paid: document.getElementById('pay-amount').value,
      payment_timestamp: document.getElementById('pay-timestamp').value.replace('T', ' ') + ':00',
      gcash_sender_name: document.getElementById('pay-sender-name').value,
      gcash_sender_number: document.getElementById('pay-sender-number').value,
      student_notes: document.getElementById('pay-notes').value,
      receipt_image_path: 'sample_receipt_proof'
    };

    try {
      if (isCart) {
        // Clear cart and show notification
        this.cart = [];
        window.coeApp.closeModal();
        window.coeApp.showToast(`Merch order submitted via ${gateway.toUpperCase()}! Set status to Pending.`, 'success');
        this.activeMainTab = 'history';
        this.render();
      } else {
        window.coepayDb.submitPayment(assignmentId, user, data);
        window.coeApp.closeModal();
        window.coeApp.showToast(`Payment submitted via ${gateway.toUpperCase()}! Set status to Pending.`, 'success');
        this.activeMainTab = 'history';
        this.render();
      }
    } catch (err) {
      alert(err.message);
    }
  },

  renderHistoryTable() {
    const tbody = document.getElementById('student-history-tbody');
    if (!tbody) return;

    const student = window.coeAuth.getProfile();
    const filter = document.getElementById('student-history-filter')?.value || 'all';
    const assignments = window.coepayDb.getAssignments({ student_id: student.student_id });

    // Filter assignments that have transactions or are submitted
    let displayList = assignments.filter(a => a.transaction || a.status === 'paid' || a.status === 'pending_verification');

    if (filter === 'verified') {
      displayList = displayList.filter(a => a.status === 'paid');
    } else if (filter === 'pending') {
      displayList = displayList.filter(a => a.status === 'pending_verification');
    } else if (filter === 'rejected') {
      displayList = displayList.filter(a => a.status === 'rejected');
    }

    if (displayList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No transaction records match the selected filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = displayList.map(a => {
      const trans = a.transaction || {};
      const isPaid = a.status === 'paid';
      const isPending = a.status === 'pending_verification';

      let statusBadge = '';
      if (isPaid) {
        statusBadge = '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Verified</span>';
      } else if (isPending) {
        statusBadge = '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending</span>';
      } else {
        statusBadge = '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>';
      }

      return `
        <tr>
          <td><strong>COE-TRX-${trans.transaction_id || a.assignment_id}</strong></td>
          <td>
            <strong>${a.request.title}</strong>
            <div class="small text-muted">${a.request.category_name}</div>
          </td>
          <td><span class="badge badge-outline">${trans.gateway_type === 'bank' ? 'Bank Transfer' : 'GCash'}</span></td>
          <td class="font-bold ${isPaid ? 'text-success' : 'text-main'}">₱${parseFloat(trans.amount_paid || a.request.amount).toFixed(2)}</td>
          <td><code>${trans.gcash_reference_number || '-'}</code></td>
          <td class="small">${trans.submitted_at || trans.payment_timestamp || '-'}</td>
          <td>${statusBadge}</td>
          <td class="text-right">
            ${isPaid ? `
              <button class="btn btn-xs btn-primary" onclick="CoeStudentView.openClearanceCertModal(${a.assignment_id})">
                <i class="fa-solid fa-print"></i> Print Official Voucher
              </button>
            ` : `
              <button class="btn btn-xs btn-outline" onclick="CoeStudentView.viewPendingSubmission(${a.assignment_id})">
                <i class="fa-solid fa-eye"></i> View Proof
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  },

  filterHistoryTable() {
    this.renderHistoryTable();
  },

  viewPendingSubmission(assignmentId) {
    const assignment = window.coepayDb.getAssignments().find(a => a.assignment_id === Number(assignmentId));
    if (!assignment || !assignment.transaction) return;

    const trans = assignment.transaction;
    const receiptSvg = CoeReceiptHelper.generateGcashReceiptSvg({
      gcash_reference_number: trans.gcash_reference_number,
      amount_paid: trans.amount_paid,
      gcash_sender_name: trans.gcash_sender_name,
      gcash_sender_number: trans.gcash_sender_number,
      gcash_account_name: assignment.request.gcash_account_name,
      gcash_account_number: assignment.request.gcash_account_number,
      payment_timestamp: trans.payment_timestamp,
      title: assignment.request.title
    });

    const modalBody = `
      <div class="grid-2-col">
        <div>${receiptSvg}</div>
        <div>
          <h4>Submission Details</h4>
          <div class="alert alert-info mt-2">
            <i class="fa-solid fa-clock"></i> Your payment is currently queued with status <strong>Pending</strong>. An officer will inspect and update status to Verified or Rejected.
          </div>
          <div class="mt-3">
            <p><strong>Department Code:</strong> <code>COE-CEDT-01</code></p>
            <p><strong>Reference Number:</strong> <code>${trans.gcash_reference_number}</code></p>
            <p><strong>Channel:</strong> ${trans.gateway_type === 'bank' ? 'Bank Transfer' : 'GCash'}</p>
            <p><strong>Amount:</strong> ₱${parseFloat(trans.amount_paid).toFixed(2)}</p>
            <p><strong>Submitted At:</strong> ${trans.submitted_at}</p>
            <p><strong>Sender:</strong> ${trans.gcash_sender_name} (${trans.gcash_sender_number})</p>
          </div>
        </div>
      </div>
    `;

    window.coeApp.showModal('Submitted Payment Record (Pending Verification)', modalBody, null);
  },

  openClearanceCertModal(assignmentId) {
    const assignment = window.coepayDb.getAssignments().find(a => a.assignment_id === Number(assignmentId));
    if (!assignment) return;

    const certHtml = CoeReceiptHelper.generateCertificateHtml(assignment);

    const modalBody = `
      <div class="cert-modal-wrapper">
        <div class="cert-actions-toolbar mb-3 text-right">
          <button class="btn btn-primary" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Official Certificate
          </button>
        </div>
        ${certHtml}
      </div>
    `;

    window.coeApp.showModal('Official Payment Clearance Certificate & Receipt Voucher', modalBody, null, 'modal-lg');
  }
};

window.CoeStudentView = CoeStudentView;
