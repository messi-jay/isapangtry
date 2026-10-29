/**
 * COE-Pay: Dean / Administrator Student Masterlist Bulk Upload Controller
 * Handles drag-and-drop file upload (.csv & .xlsx), dynamic client preview,
 * pre-flight validation, sample template download, and batch upsert operations.
 */

const CoeMasterlistUpload = {
  parsedRows: [],
  validationResults: {
    total: 0,
    valid: [],
    errors: [],
    inserts: 0,
    updates: 0
  },
  currentFile: null,

  /**
   * Sample dummy dataset provided by the College of Engineering
   */
  sampleTemplateData: [
    { student_number: "2023-10001", first_name: "Christian Dave", middle_name: "D.", last_name: "Guiyab", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "christian.guiyab@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10002", first_name: "Pearl Alexa", middle_name: "J.", last_name: "Catequista", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "pearl.catequista@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10003", first_name: "Jefferson", middle_name: "C.", last_name: "Sadoguio", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "jefferson.sadoguio@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10004", first_name: "Jerome", middle_name: "R.", last_name: "Opana", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "jerome.opana@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10005", first_name: "Aaron Mikhael", middle_name: "", last_name: "Canonizado", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "aaron.canonizado@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10006", first_name: "John Robin", middle_name: "P.", last_name: "Fernandez", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "johnrobin.fernandez@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10007", first_name: "Ma. Sophia", middle_name: "B.", last_name: "Dimasu-ay", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "masophia.dimasuay@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10008", first_name: "Tricia Mae", middle_name: "S.", last_name: "Gonzaga", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "triciamae.gonzaga@students.edu.ph", contact_number: "09123456789" },
    { student_number: "2023-10009", first_name: "Jay-are", middle_name: "", last_name: "Mesias", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "sstephencurryy30@gmail.com", contact_number: "09123456789" }
  ],

  /**
   * Open the Bulk Upload Modal Dialog
   */
  openModal() {
    this.parsedRows = [];
    this.validationResults = { total: 0, valid: [], errors: [], inserts: 0, updates: 0 };
    this.currentFile = null;

    const modalBody = `
      <div class="bulk-upload-wrapper">
        <!-- Top Instruction & Template Actions -->
        <div class="bulk-upload-header-banner">
          <div>
            <h4><i class="fa-solid fa-file-import text-primary"></i> Bulk Student Masterlist Ingestion</h4>
            <p class="text-muted small">
              Upload an official student masterlist in <strong>.CSV</strong> or <strong>.XLSX</strong> format to batch enroll or update engineering students.
            </p>
          </div>
          <div class="template-download-buttons">
            <button class="btn btn-xs btn-outline" onclick="CoeMasterlistUpload.downloadTemplate('csv')">
              <i class="fa-solid fa-file-csv text-success"></i> Download CSV Template
            </button>
            <button class="btn btn-xs btn-outline" onclick="CoeMasterlistUpload.downloadTemplate('xlsx')">
              <i class="fa-solid fa-file-excel text-emerald"></i> Download Excel Template (.xlsx)
            </button>
          </div>
        </div>

        <!-- Drag and Drop Dropzone -->
        <div class="upload-dropzone" id="masterlist-dropzone" 
             ondragover="CoeMasterlistUpload.handleDragOver(event)" 
             ondragleave="CoeMasterlistUpload.handleDragLeave(event)" 
             ondrop="CoeMasterlistUpload.handleDrop(event)"
             onclick="document.getElementById('masterlist-file-input').click()">
          <input type="file" id="masterlist-file-input" accept=".csv, .xlsx, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style="display:none;" onchange="CoeMasterlistUpload.handleFileSelect(event)">
          <div class="dropzone-icon">
            <i class="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <div class="dropzone-text">
            <strong>Choose an official file</strong> or drag & drop here
          </div>
          <div class="dropzone-subtext">
            Supports <code>.csv</code> and <code>.xlsx</code> (Expected columns: student_number, first_name, last_name, email, year_level, section...)
          </div>
          <div id="dropzone-file-pill" class="file-pill" style="display:none;"></div>
        </div>

        <!-- Loading indicator -->
        <div id="masterlist-loading-state" class="upload-loading-state" style="display:none;">
          <div class="spinner-inline"></div>
          <span>Parsing spreadsheet and running validation checks...</span>
        </div>

        <!-- Dynamic Preview & Summary Section -->
        <div id="masterlist-preview-container" style="display:none;" class="mt-3">
          <!-- Summary Metrics Cards -->
          <div class="preview-metrics-grid">
            <div class="preview-stat-card bg-surface-subtle">
              <span class="preview-stat-label">Total Parsed</span>
              <span class="preview-stat-val" id="metric-total-parsed">0</span>
            </div>
            <div class="preview-stat-card stat-success">
              <span class="preview-stat-label"><i class="fa-solid fa-user-plus"></i> New Inserts</span>
              <span class="preview-stat-val text-success" id="metric-total-inserts">0</span>
            </div>
            <div class="preview-stat-card stat-info">
              <span class="preview-stat-label"><i class="fa-solid fa-user-pen"></i> Existing Updates</span>
              <span class="preview-stat-val text-primary" id="metric-total-updates">0</span>
            </div>
            <div class="preview-stat-card stat-danger">
              <span class="preview-stat-label"><i class="fa-solid fa-triangle-exclamation"></i> Skipped / Errors</span>
              <span class="preview-stat-val text-danger" id="metric-total-errors">0</span>
            </div>
          </div>

          <!-- Alert callout if errors found -->
          <div id="preview-error-alert" class="alert alert-warning mt-2" style="display:none;"></div>

          <!-- Preview Table Header Controls -->
          <div class="flex-between mt-3 mb-2">
            <div class="small text-muted font-bold">
              <i class="fa-solid fa-table-list"></i> Parsed Masterlist Records Preview
            </div>
            <div class="flex-gap">
              <select id="preview-filter-select" class="form-select form-select-sm" onchange="CoeMasterlistUpload.renderPreviewTable()">
                <option value="all">All Records (<span id="count-all">0</span>)</option>
                <option value="valid">Valid Records Only (<span id="count-valid">0</span>)</option>
                <option value="errors">Errors Only (<span id="count-errors">0</span>)</option>
              </select>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="table-responsive preview-table-wrap">
            <table class="data-table small" id="masterlist-preview-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Program</th>
                  <th>Year & Section</th>
                  <th>Institutional Email</th>
                  <th>Contact</th>
                  <th>Validation Remarks</th>
                </tr>
              </thead>
              <tbody id="masterlist-preview-tbody">
                <!-- Dynamically rendered -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Post-Upload Success Report -->
        <div id="masterlist-result-container" style="display:none;" class="mt-3"></div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Close</button>
      <button id="btn-submit-masterlist" class="btn btn-primary" onclick="CoeMasterlistUpload.submitBatchUpsert()" disabled>
        <i class="fa-solid fa-cloud-arrow-up"></i> Process & Upsert Masterlist
      </button>
    `;

    window.coeApp.showModal('Official Student Masterlist Bulk Upload', modalBody, footer, 'modal-lg');
  },

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('masterlist-dropzone');
    if (dropzone) dropzone.classList.add('drag-over');
  },

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('masterlist-dropzone');
    if (dropzone) dropzone.classList.remove('drag-over');
  },

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('masterlist-dropzone');
    if (dropzone) dropzone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  },

  handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  },

  /**
   * Process and parse the uploaded file (.csv or .xlsx)
   */
  processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'txt'].includes(ext)) {
      alert("Unsupported file format. Please upload an official .csv or .xlsx file.");
      return;
    }

    this.currentFile = file;

    // Show file pill in dropzone
    const pill = document.getElementById('dropzone-file-pill');
    if (pill) {
      pill.innerHTML = `<i class="fa-solid fa-file-excel text-success"></i> <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB) <button class="pill-remove-btn" onclick="event.stopPropagation(); CoeMasterlistUpload.openModal();"><i class="fa-solid fa-xmark"></i></button>`;
      pill.style.display = 'inline-flex';
    }

    const loader = document.getElementById('masterlist-loading-state');
    if (loader) loader.style.display = 'flex';

    if (ext === 'xlsx') {
      this.parseXlsxFile(file);
    } else {
      this.parseCsvFile(file);
    }
  },

  /**
   * Parse CSV file client-side
   */
  parseCsvFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = this.parseCsvText(text);
        this.handleParsedData(rows);
      } catch (err) {
        alert("Failed to parse CSV file: " + err.message);
      } finally {
        const loader = document.getElementById('masterlist-loading-state');
        if (loader) loader.style.display = 'none';
      }
    };
    reader.readAsText(file);
  },

  /**
   * Parse Excel (.xlsx) file using SheetJS (XLSX library)
   */
  parseXlsxFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof XLSX === 'undefined') {
          throw new Error("Excel reader library not loaded. Please try uploading the CSV version.");
        }
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        // Normalize keys
        const rows = rawJson.map(row => {
          const normalized = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
            normalized[cleanKey] = String(row[k]).trim();
          });
          return normalized;
        });

        this.handleParsedData(rows);
      } catch (err) {
        alert("Error reading Excel spreadsheet: " + err.message);
      } finally {
        const loader = document.getElementById('masterlist-loading-state');
        if (loader) loader.style.display = 'none';
      }
    };
    reader.readAsArrayBuffer(file);
  },

  /**
   * Native CSV text parser (handles quoted commas, newlines, UTF-8 BOM)
   */
  parseCsvText(csvText) {
    // Strip BOM
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.slice(1);
    }

    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const c = csvText[i];
      const next = csvText[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        if (row.length > 1 || row[0] !== '') {
          lines.push(row);
        }
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    if (lines.length === 0) return [];

    const headers = lines[0].map(h => 
      h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '')
    );

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 1 && !line[0].trim()) continue;
      const rowObj = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = line[colIdx] !== undefined ? line[colIdx].trim() : '';
      });
      rows.push(rowObj);
    }

    return rows;
  },

  /**
   * Run validation on parsed rows and prepare preview
   */
  handleParsedData(rawRows) {
    if (!rawRows || rawRows.length === 0) {
      alert("No student records found in file. Please ensure the file has a valid header and data rows.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const existingStudents = window.coepayDb ? window.coepayDb.getStudents() : [];
    const existingNumberMap = new Map();
    existingStudents.forEach(s => existingNumberMap.set(s.student_number.toLowerCase(), s));

    const validList = [];
    const errorList = [];
    let insertCount = 0;
    let updateCount = 0;
    const seenInFile = new Set();

    const normalizedRows = rawRows.map((r, index) => {
      const rowNum = index + 2;
      const studentNumber = (r.student_number || r.student_id || r.id_number || r.id || '').trim();
      const firstName     = (r.first_name || r.firstname || '').trim();
      const middleName    = (r.middle_name || r.middlename || '').trim();
      const lastName      = (r.last_name || r.lastname || '').trim();
      const email         = (r.email || r.student_email || '').trim().toLowerCase();
      let program         = (r.program || r.course || 'BSCOE').trim();
      if (!program) program = 'BSCOE';
      
      const yearRaw       = String(r.year_level || r.year || '').trim();
      const yearMatch     = yearRaw.match(/\d+/);
      const yearLevel     = yearMatch ? parseInt(yearMatch[0], 10) : NaN;
      const section       = (r.section || r.class_section || '').trim();
      const contactNumber = (r.contact_number || r.contact || '').trim();

      const errors = [];

      if (!studentNumber) {
        errors.push("Missing Student ID");
      } else if (!/^[A-Za-z0-9-]+$/.test(studentNumber)) {
        errors.push("Invalid Student ID format");
      }

      if (!firstName) errors.push("First name required");
      if (!lastName) errors.push("Last name required");

      if (!email) {
        errors.push("Email required");
      } else if (!emailRegex.test(email)) {
        errors.push("Invalid email format");
      }

      if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 5) {
        errors.push("Year level must be 1 to 5");
      }

      if (!section) errors.push("Section required");

      if (studentNumber && seenInFile.has(studentNumber.toLowerCase())) {
        errors.push("Duplicate Student ID in file");
      } else if (studentNumber) {
        seenInFile.add(studentNumber.toLowerCase());
      }

      const isExisting = existingNumberMap.has(studentNumber.toLowerCase());
      let status = 'valid';
      let actionType = isExisting ? 'update' : 'insert';

      if (errors.length > 0) {
        status = 'error';
        errorList.push({ rowNum, studentNumber, firstName, lastName, errors });
      } else {
        if (isExisting) updateCount++;
        else insertCount++;
        validList.push({
          student_number: studentNumber,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          email: email,
          program: program,
          year_level: yearLevel,
          section: section,
          contact_number: contactNumber
        });
      }

      return {
        rowNum,
        studentNumber,
        fullName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
        firstName,
        middleName,
        lastName,
        program,
        yearLevel,
        section,
        email,
        contactNumber,
        status,
        actionType,
        errors
      };
    });

    this.parsedRows = normalizedRows;
    this.validationResults = {
      total: normalizedRows.length,
      valid: validList,
      errors: errorList,
      inserts: insertCount,
      updates: updateCount
    };

    // Update UI Elements
    document.getElementById('metric-total-parsed').innerText = normalizedRows.length;
    document.getElementById('metric-total-inserts').innerText = insertCount;
    document.getElementById('metric-total-updates').innerText = updateCount;
    document.getElementById('metric-total-errors').innerText = errorList.length;

    document.getElementById('count-all').innerText = normalizedRows.length;
    document.getElementById('count-valid').innerText = validList.length;
    document.getElementById('count-errors').innerText = errorList.length;

    const errorAlert = document.getElementById('preview-error-alert');
    if (errorList.length > 0) {
      errorAlert.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i> <strong>Validation Warning:</strong> ${errorList.length} row(s) contain validation errors and will be skipped during upsert.
      `;
      errorAlert.style.display = 'block';
    } else {
      errorAlert.style.display = 'none';
    }

    const submitBtn = document.getElementById('btn-submit-masterlist');
    if (submitBtn) {
      if (validList.length > 0) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Process & Upsert Masterlist (${validList.length} Ready)`;
      } else {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-ban"></i> No Valid Records to Upsert`;
      }
    }

    document.getElementById('masterlist-preview-container').style.display = 'block';
    this.renderPreviewTable();
  },

  /**
   * Render preview table according to selected filter
   */
  renderPreviewTable() {
    const tbody = document.getElementById('masterlist-preview-tbody');
    if (!tbody) return;

    const filter = document.getElementById('preview-filter-select')?.value || 'all';

    let displayRows = this.parsedRows;
    if (filter === 'valid') {
      displayRows = this.parsedRows.filter(r => r.status === 'valid');
    } else if (filter === 'errors') {
      displayRows = this.parsedRows.filter(r => r.status === 'error');
    }

    if (displayRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-muted">No rows match this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = displayRows.map(r => {
      let badge = '';
      if (r.status === 'error') {
        badge = '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Invalid</span>';
      } else if (r.actionType === 'update') {
        badge = '<span class="badge badge-admin"><i class="fa-solid fa-user-pen"></i> Update</span>';
      } else {
        badge = '<span class="badge badge-success"><i class="fa-solid fa-user-plus"></i> New</span>';
      }

      return `
        <tr class="${r.status === 'error' ? 'row-error' : ''}">
          <td>${badge}</td>
          <td><strong>${r.studentNumber || '-'}</strong></td>
          <td>${r.fullName || '-'}</td>
          <td><span class="badge badge-outline">${r.program}</span></td>
          <td>Year ${r.yearLevel || '-'} (${r.section || '-'})</td>
          <td><code>${r.email || '-'}</code></td>
          <td>${r.contactNumber || '-'}</td>
          <td class="${r.errors.length > 0 ? 'text-danger font-medium' : 'text-success'}">
            ${r.errors.length > 0 ? r.errors.join('; ') : (r.actionType === 'update' ? 'Will update existing student' : 'Ready to insert')}
          </td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Commit the batch upsert operation
   */
  async submitBatchUpsert() {
    const validRecords = this.validationResults.valid;
    if (!validRecords || validRecords.length === 0) {
      alert("No valid records found to upsert.");
      return;
    }

    const submitBtn = document.getElementById('btn-submit-masterlist');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-inline"></span> Committing Upsert...`;
    }

    const adminUser = window.coeAuth.getUser();

    // Check if we can dispatch via API endpoint or local simulation engine
    try {
      let result;

      // Try sending to the backend API endpoint first
      let apiSuccess = false;
      try {
        const response = await fetch('api/masterlist_upload.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminUser.username}`,
            'X-User-Role': 'admin'
          },
          body: JSON.stringify({
            admin_user_id: adminUser.user_id,
            records: validRecords
          })
        });

        if (response.ok) {
          const apiJson = await response.json();
          if (apiJson && apiJson.success) {
            result = apiJson;
            apiSuccess = true;
          }
        }
      } catch (netErr) {
        // Backend API not reachable (e.g. running on local static PowerShell server or file://)
        // Fall back seamlessly to client relational DB engine
        apiSuccess = false;
      }

      // If API was not used or failed due to environment, use client database engine
      if (!apiSuccess) {
        result = window.coepayDb.bulkUpsertStudents(validRecords, adminUser);
      }

      // Render Success Summary View
      this.renderSummaryReport(result);

      // Refresh Admin View in background
      if (window.CoeAdminView && typeof window.CoeAdminView.render === 'function') {
        window.CoeAdminView.render();
      }

      window.coeApp.showToast(`Masterlist upload finished: ${result.summary.inserted} inserted, ${result.summary.updated} updated!`, 'success');

    } catch (err) {
      alert("Upsert Failed: " + err.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Retry Masterlist Upsert`;
      }
    }
  },

  /**
   * Render final completion report inside modal
   */
  renderSummaryReport(result) {
    const summary = result.summary || {};
    const totalProcessed = (summary.inserted || 0) + (summary.updated || 0);

    const container = document.getElementById('masterlist-result-container');
    const previewContainer = document.getElementById('masterlist-preview-container');
    const dropzone = document.getElementById('masterlist-dropzone');
    const submitBtn = document.getElementById('btn-submit-masterlist');

    if (previewContainer) previewContainer.style.display = 'none';
    if (dropzone) dropzone.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';

    if (container) {
      container.innerHTML = `
        <div class="upload-success-card">
          <div class="success-icon-badge">
            <i class="fa-solid fa-circle-check text-success"></i>
          </div>
          <h3>Student Masterlist Upsert Completed!</h3>
          <p class="text-muted">The official engineering roster has been successfully synchronized into the students and users database tables.</p>
          
          <div class="stats-grid mt-3" style="grid-template-columns: repeat(4, 1fr);">
            <div class="stat-card p-2 text-center">
              <div class="stat-label">Total Processed</div>
              <div class="stat-value text-primary">${totalProcessed}</div>
            </div>
            <div class="stat-card p-2 text-center">
              <div class="stat-label">New Accounts Created</div>
              <div class="stat-value text-success">${summary.inserted || 0}</div>
            </div>
            <div class="stat-card p-2 text-center">
              <div class="stat-label">Existing Records Updated</div>
              <div class="stat-value text-info">${summary.updated || 0}</div>
            </div>
            <div class="stat-card p-2 text-center">
              <div class="stat-label">Skipped (Errors)</div>
              <div class="stat-value text-danger">${summary.skipped || 0}</div>
            </div>
          </div>

          <div class="alert alert-info mt-3 text-left">
            <i class="fa-solid fa-shield-check"></i> <strong>Automatic Obligation Assignment:</strong> Active authorized fees for Computer Engineering cohorts have been automatically mapped to newly enrolled student accounts.
          </div>

          <div class="flex-center mt-3 flex-gap">
            <button class="btn btn-outline" onclick="CoeMasterlistUpload.openModal()">
              <i class="fa-solid fa-file-arrow-up"></i> Upload Another File
            </button>
            <button class="btn btn-primary" onclick="window.coeApp.closeModal(); CoeAdminView.switchTab('roster');">
              <i class="fa-solid fa-users"></i> View Updated Student Roster
            </button>
          </div>
        </div>
      `;
      container.style.display = 'block';
    }
  },

  /**
   * Download template (.csv or .xlsx)
   */
  downloadTemplate(format) {
    if (format === 'xlsx' && typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.json_to_sheet(this.sampleTemplateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Student_Masterlist");
      XLSX.writeFile(wb, "COE_Student_Masterlist_Template.xlsx");
      window.coeApp.showToast("Downloaded Excel template (.xlsx)", "info");
      return;
    }

    // Default CSV generation
    let csv = "student_number,first_name,middle_name,last_name,program,year_level,section,email,contact_number\n";
    this.sampleTemplateData.forEach(s => {
      csv += `"${s.student_number}","${s.first_name}","${s.middle_name}","${s.last_name}","${s.program}",${s.year_level},"${s.section}","${s.email}","${s.contact_number}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "COE_Student_Masterlist_Template.csv";
    link.click();
    URL.revokeObjectURL(url);
    window.coeApp.showToast("Downloaded CSV template", "info");
  }
};

window.CoeMasterlistUpload = CoeMasterlistUpload;
