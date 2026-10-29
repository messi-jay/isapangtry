/**
 * COE-Pay: Receipt Generator & Inspection Helper
 * Renders realistic SVG/Canvas GCash transaction receipts,
 * QR codes, and digital clearance certificates.
 */

const CoeReceiptHelper = {
  /**
   * Generates a high-fidelity SVG string representing an official GCash e-Receipt
   */
  generateGcashReceiptSvg(data) {
    const refNo = data.gcash_reference_number || '9021000000000';
    const amount = parseFloat(data.amount_paid || 350).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const senderName = (data.gcash_sender_name || 'STUDENT SENDER').toUpperCase();
    const senderNumber = data.gcash_sender_number || '0920XXXXXXX';
    const recipientName = (data.gcash_account_name || 'MARIA C SANTOS (COE TREASURER)').toUpperCase();
    const recipientNumber = data.gcash_account_number || '09171234567';
    const timestamp = data.payment_timestamp || '2026-10-16 14:00:00';
    const requestTitle = data.title || 'COE Departmental Contribution';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 680" width="100%" height="auto" style="border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); font-family: 'Inter', -apple-system, sans-serif;">
        <!-- Top App Bar -->
        <rect width="400" height="680" fill="#F4F6F9" rx="16"/>
        
        <!-- Header Card -->
        <path d="M0 16 C0 7.16 7.16 0 16 0 L384 0 C392.84 0 400 7.16 400 16 L400 170 L0 170 Z" fill="#007DFE"/>
        
        <!-- Header Text -->
        <text x="200" y="42" fill="#FFFFFF" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="0.5">GCash Express Send</text>
        <circle cx="200" cy="85" r="26" fill="#FFFFFF"/>
        <path d="M190 85 L197 92 L211 77" fill="none" stroke="#007DFE" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <text x="200" y="132" fill="#FFFFFF" font-size="16" font-weight="700" text-anchor="middle">Payment Sent Successfully</text>
        <text x="200" y="152" fill="#E0E7FF" font-size="12" text-anchor="middle">${timestamp}</text>
        
        <!-- Main White Receipt Body -->
        <rect x="20" y="185" width="360" height="420" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
        
        <!-- Amount Block -->
        <text x="200" y="235" fill="#64748B" font-size="13" font-weight="500" text-anchor="middle">Total Amount Paid</text>
        <text x="200" y="275" fill="#0F172A" font-size="32" font-weight="800" text-anchor="middle">PHP ${amount}</text>
        
        <!-- Divider -->
        <line x1="40" y1="298" x2="360" y2="298" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="6,4"/>
        
        <!-- Details List -->
        <!-- Paid To -->
        <text x="45" y="330" fill="#64748B" font-size="12">Sent To</text>
        <text x="355" y="330" fill="#0F172A" font-size="12" font-weight="700" text-anchor="end">${recipientName}</text>
        <text x="355" y="347" fill="#64748B" font-size="11" text-anchor="end">${recipientNumber}</text>
        
        <!-- Sender -->
        <text x="45" y="380" fill="#64748B" font-size="12">Sent From</text>
        <text x="355" y="380" fill="#0F172A" font-size="12" font-weight="700" text-anchor="end">${senderName}</text>
        <text x="355" y="397" fill="#64748B" font-size="11" text-anchor="end">${senderNumber}</text>
        
        <!-- Purpose / Request -->
        <text x="45" y="430" fill="#64748B" font-size="12">Payment For</text>
        <text x="355" y="430" fill="#0A2540" font-size="12" font-weight="600" text-anchor="end">${requestTitle.substring(0, 30)}</text>
        
        <!-- Reference Number Highlight Box -->
        <rect x="35" y="465" width="330" height="60" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
        <text x="200" y="488" fill="#64748B" font-size="11" font-weight="600" text-anchor="middle" letter-spacing="0.5">GCASH REFERENCE NUMBER</text>
        <text x="200" y="512" fill="#007DFE" font-size="18" font-weight="800" text-anchor="middle" letter-spacing="2">${refNo}</text>
        
        <!-- Institutional Verification Stamp -->
        <rect x="35" y="540" width="330" height="50" rx="6" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
        <circle cx="55" cy="565" r="12" fill="#10B981"/>
        <path d="M50 565 L54 569 L61 561" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="75" y="559" fill="#065F46" font-size="11" font-weight="700">ICCT COE-PAY AUDIT TRAIL</text>
        <text x="75" y="574" fill="#047857" font-size="10">Captured & Protected by ICCT COE Financial Engine</text>

        <!-- Footer -->
        <text x="200" y="640" fill="#94A3B8" font-size="11" text-anchor="middle">Official e-Receipt Copy • ICCT Colleges Foundation Inc.</text>
        <text x="200" y="658" fill="#94A3B8" font-size="10" text-anchor="middle">College of Engineering and Digital Technology</text>
      </svg>
    `;
  },

  /**
   * Generates a printable Official COE Clearance Certificate & Receipt Voucher
   */
  generateCertificateHtml(assignment, transaction) {
    const student = assignment.student || {};
    const req = assignment.request || {};
    const trans = transaction || assignment.transaction || {};
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
      <div class="clearance-certificate-print">
        <div class="cert-header">
          <div class="cert-logo">
            <img src="assets/img/icct-coe-logo.svg" alt="ICCT COE Seal" width="80" height="80">
          </div>
          <div class="cert-institution">
            <h2>ICCT COLLEGES FOUNDATION, INC.</h2>
            <h3>COLLEGE OF ENGINEERING AND DIGITAL TECHNOLOGY</h3>
            <p>V.V. Soliven Building, Sumulong Highway, Cainta, Rizal</p>
            <h4>OFFICIAL PAYMENT CLEARANCE CERTIFICATE & VOUCHER</h4>
          </div>
        </div>

        <div class="cert-divider"></div>

        <div class="cert-meta-grid">
          <div class="cert-meta-item">
            <span class="label">Certificate / Voucher No:</span>
            <span class="value highlight">COE-${req.term_id || 2}-${trans.transaction_id || '000'}-${student.student_id || '0'}</span>
          </div>
          <div class="cert-meta-item">
            <span class="label">Date of Issuance:</span>
            <span class="value">${now}</span>
          </div>
          <div class="cert-meta-item">
            <span class="label">Academic Term:</span>
            <span class="value">${req.academic_year || '2026-2027'}, ${req.semester || '1st Semester'}</span>
          </div>
          <div class="cert-meta-item">
            <span class="label">Clearance Status:</span>
            <span class="value status-cleared"><i class="fa-solid fa-circle-check"></i> CLEARED & VERIFIED</span>
          </div>
        </div>

        <div class="cert-section-title">STUDENT INFORMATION</div>
        <table class="cert-table">
          <tr>
            <th width="25%">Student Name:</th>
            <td width="75%"><strong>${student.full_name || 'STUDENT NAME'}</strong></td>
          </tr>
          <tr>
            <th>Student Number:</th>
            <td>${student.student_number || 'N/A'}</td>
          </tr>
          <tr>
            <th>Program & Year / Section:</th>
            <td>${student.program || 'BSCpE'} - Year ${student.year_level || '4'} (${student.section || 'BSCpE-4A'})</td>
          </tr>
        </table>

        <div class="cert-section-title">PAYMENT & GCASH TRANSACTION PARTICULARS</div>
        <table class="cert-table">
          <tr>
            <th width="30%">Obligation / Purpose:</th>
            <td width="70%"><strong>${req.title || 'N/A'}</strong></td>
          </tr>
          <tr>
            <th>Payment Category:</th>
            <td>${req.category_name || 'Departmental Fee'}</td>
          </tr>
          <tr>
            <th>Amount Paid:</th>
            <td><strong>PHP ${parseFloat(trans.amount_paid || req.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> (Full Settlement)</td>
          </tr>
          <tr>
            <th>GCash Reference Number:</th>
            <td><code class="gcash-ref-code">${trans.gcash_reference_number || 'N/A'}</code></td>
          </tr>
          <tr>
            <th>Sender Name / Number:</th>
            <td>${trans.gcash_sender_name || 'N/A'} (${trans.gcash_sender_number || 'N/A'})</td>
          </tr>
          <tr>
            <th>Transaction Date & Time:</th>
            <td>${trans.payment_timestamp || trans.submitted_at || 'N/A'}</td>
          </tr>
          <tr>
            <th>Verified By Personnel:</th>
            <td>${trans.verifier_name || 'Engr. Maria Clara Santos (Department Chair & Org Treasurer)'}</td>
          </tr>
          <tr>
            <th>Verification Remarks:</th>
            <td>${trans.verification_remarks || 'Payment verified against official merchant ledger.'}</td>
          </tr>
        </table>

        <div class="cert-signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <p><strong>Engr. Maria Clara Santos</strong></p>
            <span>COE Department Chair / Org Treasurer</span>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <p><strong>Dr. Ronald Reyes, PECE</strong></p>
            <span>Dean, College of Engineering & Digital Technology</span>
          </div>
        </div>

        <div class="cert-footer">
          <p>This digital certificate serves as official proof of payment and examination clearance for the College of Engineering and Digital Technology. Generated electronically via COE-Pay Centralized Financial Gateway.</p>
        </div>
      </div>
    `;
  }
};

// Export to global window object
window.CoeReceiptHelper = CoeReceiptHelper;
