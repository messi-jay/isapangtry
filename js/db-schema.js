/**
 * COE-Pay: Comprehensive Database Schema & Seed Data (Version 4 - Official Masterlist)
 * Institution: ICCT Colleges Foundation, Inc. - College of Engineering and Digital Technology
 * Official Masterlist Cohort: Exactly 8 registered students (Year 4 Section 4A)
 * Verified GCash transactions, clear inspection trails, and role-based clearance statuses.
 */

const COE_INITIAL_DATABASE = {
  academic_terms: [
    {
      term_id: 1,
      academic_year: "2025-2026",
      semester: "2nd Semester",
      is_current: 0,
      created_at: "2026-01-10 08:00:00",
      updated_at: "2026-06-01 17:00:00"
    },
    {
      term_id: 2,
      academic_year: "2026-2027",
      semester: "1st Semester",
      is_current: 1,
      created_at: "2026-08-15 08:00:00",
      updated_at: "2026-08-15 08:00:00"
    },
    {
      term_id: 3,
      academic_year: "2026-2027",
      semester: "2nd Semester",
      is_current: 0,
      created_at: "2026-10-01 08:00:00",
      updated_at: "2026-10-01 08:00:00"
    }
  ],

  payment_categories: [
    {
      category_id: 1,
      category_name: "Departmental / Org Fee",
      description: "Official ICCT COE Student Council membership, laboratory insurance, and engineering events kit.",
      is_active: 1,
      created_at: "2026-08-15 09:00:00"
    },
    {
      category_id: 2,
      category_name: "Capstone & Research Project",
      description: "BSCpE Colloquium, panel evaluation honoraria, and technical research repository binder.",
      is_active: 1,
      created_at: "2026-08-15 09:05:00"
    },
    {
      category_id: 3,
      category_name: "Laboratory Maintenance Fee",
      description: "Robotics, Embedded Systems, and IoT Lab equipment maintenance, probes, and consumables.",
      is_active: 1,
      created_at: "2026-08-15 09:10:00"
    },
    {
      category_id: 4,
      category_name: "Departmental Uniform / Shirt",
      description: "Official College of Engineering and Digital Technology technical polo shirt and patch.",
      is_active: 1,
      created_at: "2026-08-15 09:15:00"
    },
    {
      category_id: 5,
      category_name: "Engineering Summit & Seminars",
      description: "Annual Engineering Convention, tech workshops, industry tours, and digital certificates.",
      is_active: 1,
      created_at: "2026-08-15 09:20:00"
    },
    {
      category_id: 6,
      category_name: "Graduation / Exit Assessment",
      description: "Graduation clearance, engineering ring & pin kit, and competency assessment fee.",
      is_active: 1,
      created_at: "2026-08-15 09:25:00"
    },
    {
      category_id: 7,
      category_name: "Embedded Systems & IoT Workshop",
      description: "Microcontroller hardware kit (ESP32, sensors, jumpers) for laboratory projects.",
      is_active: 1,
      created_at: "2026-09-01 10:00:00"
    }
  ],

  users: [
    // 1. SYSTEM DEVELOPER: Dave Guiyab
    { user_id: 100, username: "developer", email: "dave.guiyab@developer.coepay.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "developer", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-01-05 08:00:00", updated_at: "2026-10-23 14:00:00" },

    // 2. HEAD ENGINEER / COORDINATOR: Engr. Ivanlee Mendoza
    { user_id: 1, username: "engr.mendoza", email: "ivanlee.mendoza@icct.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "coordinator", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-01-05 08:00:00", updated_at: "2026-10-23 14:00:00" },

    // 3. OFFICER: Pearl Catequista
    { user_id: 2, username: "officer", email: "pearl.catequista@icct.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "officer", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-01-05 08:30:00", updated_at: "2026-10-23 14:00:00" },

    // Faculty Personnel
    { user_id: 3, username: "engr.delacruz", email: "ramon.delacruz@icct.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "officer", is_active: 1, last_login: "2026-10-15 16:40:00", created_at: "2026-01-05 09:00:00", updated_at: "2026-10-15 16:40:00" },
    { user_id: 4, username: "engr.fernandez", email: "anthony.fernandez@icct.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "officer", is_active: 1, last_login: "2026-10-14 14:20:00", created_at: "2026-01-05 09:30:00", updated_at: "2026-10-14 14:20:00" },

    // 8 Official Masterlist Students
    { user_id: 30, username: "2023-10001", email: "christian.guiyab@students.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:00:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 31, username: "2023-10009", email: "sstephencurryy30@gmail.com", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:05:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 32, username: "2023-10003", email: "jeffesonsadoguio@gmail.com", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:10:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 33, username: "2023-10004", email: "jerome.opana@students.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:15:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 34, username: "2023-10005", email: "aaron.canonizado@students.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:20:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 35, username: "2023-10006", email: "johnrobin.fernandez@students.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:25:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 36, username: "2023-10007", email: "sdimasuay13@gmail.com", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:30:00", updated_at: "2026-10-23 14:00:00" },
    { user_id: 37, username: "2023-10008", email: "gonzagat634@gmail.com", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: "2026-10-23 14:00:00", created_at: "2026-08-20 09:35:00", updated_at: "2026-10-23 14:00:00" }
  ],

  personnel: [
    {
      personnel_id: 1,
      user_id: 2,
      employee_number: "OFF-2024-001",
      first_name: "Pearl",
      middle_name: "Alexa",
      last_name: "Catequista",
      department: "College of Engineering Student Council & Organizations",
      designation: "College Student Officer & Financial Treasurer",
      contact_number: "09123456789",
      created_at: "2026-01-05 08:35:00",
      updated_at: "2026-01-05 08:35:00"
    },
    {
      personnel_id: 2,
      user_id: 3,
      employee_number: "EMP-2019-105",
      first_name: "Ramon",
      middle_name: "Bautista",
      last_name: "Dela Cruz",
      department: "College of Engineering and Digital Technology",
      designation: "Faculty Adviser / Laboratory Head",
      contact_number: "09189876543",
      created_at: "2026-01-05 09:05:00",
      updated_at: "2026-01-05 09:05:00"
    },
    {
      personnel_id: 3,
      user_id: 4,
      employee_number: "EMP-2020-218",
      first_name: "Anthony",
      middle_name: "Gerard",
      last_name: "Fernandez",
      department: "College of Engineering and Digital Technology",
      designation: "Senior Capstone & Research Coordinator",
      contact_number: "09195556677",
      created_at: "2026-01-05 09:35:00",
      updated_at: "2026-01-05 09:35:00"
    }
  ],

  students: [
    { student_id: 101, user_id: 30, student_number: "2023-10001", first_name: "Christian Dave", middle_name: "D.", last_name: "Guiyab", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09123456789", created_at: "2026-08-20 09:00:00", updated_at: "2026-08-20 09:00:00" },
    { student_id: 102, user_id: 31, student_number: "2023-10009", first_name: "Jay-are", middle_name: null, last_name: "Mesias", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09391439718", created_at: "2026-08-20 09:05:00", updated_at: "2026-08-20 09:05:00" },
    { student_id: 103, user_id: 32, student_number: "2023-10003", first_name: "Jefferson", middle_name: "C.", last_name: "Sadoguio", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09165938156", created_at: "2026-08-20 09:10:00", updated_at: "2026-08-20 09:10:00" },
    { student_id: 104, user_id: 33, student_number: "2023-10004", first_name: "Jerome", middle_name: "R.", last_name: "Opana", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09123456789", created_at: "2026-08-20 09:15:00", updated_at: "2026-08-20 09:15:00" },
    { student_id: 105, user_id: 34, student_number: "2023-10005", first_name: "Aaron Mikhael", middle_name: null, last_name: "Canonizado", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09123456789", created_at: "2026-08-20 09:20:00", updated_at: "2026-08-20 09:20:00" },
    { student_id: 106, user_id: 35, student_number: "2023-10006", first_name: "John Robin", middle_name: "P.", last_name: "Fernandez", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09123456789", created_at: "2026-08-20 09:25:00", updated_at: "2026-08-20 09:25:00" },
    { student_id: 107, user_id: 36, student_number: "2023-10007", first_name: "Ma. Sophia", middle_name: "B.", last_name: "Dimasu-ay", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "09636729211", created_at: "2026-08-20 09:30:00", updated_at: "2026-08-20 09:30:00" },
    { student_id: 108, user_id: 37, student_number: "2023-10008", first_name: "Tricia Mae", middle_name: "S.", last_name: "Gonzaga", program: "BS Computer Engineering", year_level: 4, section: "4A", contact_number: "009501807279", created_at: "2026-08-20 09:35:00", updated_at: "2026-08-20 09:35:00" }
  ],

  payment_requests: [
    {
      request_id: 1,
      title: "1st Sem 2026-2027 COE Departmental Org Fee",
      description: "Official ICCT COE Student Council membership, laboratory accident insurance, ID validation badge, and national convention entry.",
      category_id: 1,
      term_id: 2,
      amount: "350.00",
      deadline: "2026-11-20 23:59:59",
      target_year_level: null,
      target_section: null,
      gcash_account_name: "MARIA C SANTOS (COE TREASURER)",
      gcash_account_number: "09171234567",
      gcash_qr_code_path: "assets/img/qr-coe-org.svg",
      status: "authorized",
      created_by_personnel_id: 1,
      authorized_by_user_id: 1,
      authorized_at: "2026-10-01 09:30:00",
      authorization_remarks: "Approved for institutional collection across all COE students.",
      created_at: "2026-09-28 10:00:00",
      updated_at: "2026-10-01 09:30:00"
    },
    {
      request_id: 2,
      title: "BSCpE-4A Capstone 2 Final Defense and Colloquium Fee",
      description: "Includes panel honoraria, technical proceedings print binder, plaque of recognition, and symposium refreshments.",
      category_id: 2,
      term_id: 2,
      amount: "1200.00",
      deadline: "2026-10-31 23:59:59",
      target_year_level: 4,
      target_section: "4A",
      gcash_account_name: "MARIA C SANTOS (COE TREASURER)",
      gcash_account_number: "09171234567",
      gcash_qr_code_path: "assets/img/qr-coe-org.svg",
      status: "authorized",
      created_by_personnel_id: 1,
      authorized_by_user_id: 1,
      authorized_at: "2026-10-05 14:15:00",
      authorization_remarks: "Approved for BSCpE 4th Year Section 4A only.",
      created_at: "2026-10-04 11:20:00",
      updated_at: "2026-10-05 14:15:00"
    },
    {
      request_id: 3,
      title: "2026 Engineering Technical Polo Shirt (Batch 2027)",
      description: "Embroidered institutional COE navy blue polo shirt with reflective engineering crest and student badge.",
      category_id: 4,
      term_id: 2,
      amount: "550.00",
      deadline: "2026-11-25 23:59:59",
      target_year_level: 4,
      target_section: null,
      gcash_account_name: "RAMON B DELA CRUZ",
      gcash_account_number: "09189876543",
      gcash_qr_code_path: "assets/img/qr-coe-org.svg",
      status: "authorized",
      created_by_personnel_id: 2,
      authorized_by_user_id: 1,
      authorized_at: "2026-10-08 11:00:00",
      authorization_remarks: "Authorized for all graduating 4th year sections.",
      created_at: "2026-10-07 15:45:00",
      updated_at: "2026-10-08 11:00:00"
    },
    {
      request_id: 4,
      title: "Embedded Systems & IoT Hardware Lab Kit",
      description: "ESP32-WROOM-32D Development Board, Relay modules, I2C OLED display, and jumper wires replenishment.",
      category_id: 7,
      term_id: 2,
      amount: "850.00",
      deadline: "2026-12-05 23:59:59",
      target_year_level: 3,
      target_section: "3A",
      gcash_account_name: "ANTHONY G FERNANDEZ",
      gcash_account_number: "09195556677",
      gcash_qr_code_path: "assets/img/qr-coe-org.svg",
      status: "pending_authorization",
      created_by_personnel_id: 3,
      authorized_by_user_id: null,
      authorized_at: null,
      authorization_remarks: null,
      created_at: "2026-10-12 16:30:00",
      updated_at: "2026-10-12 16:30:00"
    },
    {
      request_id: 5,
      title: "Annual National Engineering Summit & Expo 2026",
      description: "Registration and chartered transport fee for SMX Convention Center tech summit.",
      category_id: 5,
      term_id: 2,
      amount: "1500.00",
      deadline: "2026-12-15 23:59:59",
      target_year_level: null,
      target_section: null,
      gcash_account_name: "MARIA C SANTOS (COE TREASURER)",
      gcash_account_number: "09171234567",
      gcash_qr_code_path: "assets/img/qr-coe-org.svg",
      status: "draft",
      created_by_personnel_id: 1,
      authorized_by_user_id: null,
      authorized_at: null,
      authorization_remarks: null,
      created_at: "2026-10-14 10:00:00",
      updated_at: "2026-10-14 10:00:00"
    },
    {
      request_id: 6,
      title: "Robotics Arena Sensor Replenishment Fee",
      description: "Ultrasonic rangefinders, motor shield drivers, and LiPo batteries for tournament testing.",
      category_id: 3,
      term_id: 2,
      amount: "450.00",
      deadline: "2026-10-10 23:59:59",
      target_year_level: 4,
      target_section: "4B",
      gcash_account_name: "RAMON B DELA CRUZ",
      gcash_account_number: "09189876543",
      gcash_qr_code_path: "assets/img/qr-coe-org.svg",
      status: "authorized",
      created_by_personnel_id: 2,
      authorized_by_user_id: 1,
      authorized_at: "2026-09-25 09:00:00",
      authorization_remarks: "Approved for BSCpE 4B Robotics class.",
      created_at: "2026-09-24 14:00:00",
      updated_at: "2026-09-25 09:00:00"
    }
  ],

  student_payment_assignments: [
    // Student 101: Christian Dave Guiyab
    { assignment_id: 101, request_id: 1, student_id: 101, status: "paid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-02 14:20:00" },
    { assignment_id: 102, request_id: 2, student_id: 101, status: "unpaid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-05 15:00:00" },
    { assignment_id: 103, request_id: 3, student_id: 101, status: "unpaid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-08 14:00:00" },

    // Student 102: Jay-are Mesias (100% Cleared)
    { assignment_id: 104, request_id: 1, student_id: 102, status: "paid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-02 16:45:00" },
    { assignment_id: 105, request_id: 2, student_id: 102, status: "paid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-06 10:30:00" },
    { assignment_id: 106, request_id: 3, student_id: 102, status: "paid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-09 14:10:00" },

    // Student 103: Jefferson Sadoguio (100% Cleared)
    { assignment_id: 107, request_id: 1, student_id: 103, status: "paid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-03 11:20:00" },
    { assignment_id: 108, request_id: 2, student_id: 103, status: "paid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-07 14:00:00" },
    { assignment_id: 109, request_id: 3, student_id: 103, status: "paid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-10 11:30:00" },

    // Student 104: Jerome Opana
    { assignment_id: 110, request_id: 1, student_id: 104, status: "paid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-04 14:30:00" },
    { assignment_id: 111, request_id: 2, student_id: 104, status: "pending_verification", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-16 11:00:00" },
    { assignment_id: 112, request_id: 3, student_id: 104, status: "unpaid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-08 14:00:00" },

    // Student 105: Aaron Mikhael Canonizado
    { assignment_id: 113, request_id: 1, student_id: 105, status: "pending_verification", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-16 09:10:00" },
    { assignment_id: 114, request_id: 2, student_id: 105, status: "unpaid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-05 15:00:00" },
    { assignment_id: 115, request_id: 3, student_id: 105, status: "unpaid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-08 14:00:00" },

    // Student 106: John Robin Fernandez
    { assignment_id: 116, request_id: 1, student_id: 106, status: "paid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-05 16:00:00" },
    { assignment_id: 117, request_id: 2, student_id: 106, status: "unpaid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-05 15:00:00" },
    { assignment_id: 118, request_id: 3, student_id: 106, status: "unpaid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-08 14:00:00" },

    // Student 107: Ma. Sophia Dimasu-ay (100% Cleared)
    { assignment_id: 119, request_id: 1, student_id: 107, status: "paid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-04 10:20:00" },
    { assignment_id: 120, request_id: 2, student_id: 107, status: "paid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-07 16:30:00" },
    { assignment_id: 121, request_id: 3, student_id: 107, status: "paid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-10 14:00:00" },

    // Student 108: Tricia Mae Gonzaga
    { assignment_id: 122, request_id: 1, student_id: 108, status: "unpaid", assigned_at: "2026-10-01 10:00:00", updated_at: "2026-10-01 10:00:00" },
    { assignment_id: 123, request_id: 2, student_id: 108, status: "unpaid", assigned_at: "2026-10-05 15:00:00", updated_at: "2026-10-05 15:00:00" },
    { assignment_id: 124, request_id: 3, student_id: 108, status: "unpaid", assigned_at: "2026-10-08 14:00:00", updated_at: "2026-10-08 14:00:00" }
  ],

  payment_transactions: [
    // Student 101: Christian Dave Guiyab
    { transaction_id: 1, assignment_id: 101, request_id: 1, student_id: 101, gcash_reference_number: "9021884920193", gcash_sender_name: "CHRISTIAN DAVE GUIYAB", gcash_sender_number: "09123456789", amount_paid: "350.00", payment_timestamp: "2026-10-02 14:15:00", receipt_image_path: "sample_receipt_1", student_notes: "COE Departmental Org Fee Paid", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-02 14:20:00", verification_remarks: "Verified against GCash Statement.", submitted_at: "2026-10-02 14:16:00", updated_at: "2026-10-02 14:20:00" },

    // Student 102: Jay-are Mesias
    { transaction_id: 2, assignment_id: 104, request_id: 1, student_id: 102, gcash_reference_number: "9022510294821", gcash_sender_name: "JAY-ARE MESIAS", gcash_sender_number: "09391439718", amount_paid: "350.00", payment_timestamp: "2026-10-02 16:30:00", receipt_image_path: "sample_receipt_2", student_notes: "1st Sem Org Fee payment", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-02 16:45:00", verification_remarks: "Merchant ledger checked. Approved.", submitted_at: "2026-10-02 16:35:00", updated_at: "2026-10-02 16:45:00" },
    { transaction_id: 3, assignment_id: 105, request_id: 2, student_id: 102, gcash_reference_number: "9022981048291", gcash_sender_name: "JAY-ARE MESIAS", gcash_sender_number: "09391439718", amount_paid: "1200.00", payment_timestamp: "2026-10-06 10:15:00", receipt_image_path: "sample_receipt_3", student_notes: "Capstone defense payment full", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-06 10:30:00", verification_remarks: "Official voucher generated.", submitted_at: "2026-10-06 10:20:00", updated_at: "2026-10-06 10:30:00" },
    { transaction_id: 4, assignment_id: 106, request_id: 3, student_id: 102, gcash_reference_number: "9023419028341", gcash_sender_name: "JAY-ARE MESIAS", gcash_sender_number: "09391439718", amount_paid: "550.00", payment_timestamp: "2026-10-09 13:50:00", receipt_image_path: "sample_receipt_4", student_notes: "Polo Shirt Size L", status: "verified", verified_by_personnel_id: 2, verified_at: "2026-10-09 14:10:00", verification_remarks: "Payment confirmed.", submitted_at: "2026-10-09 13:55:00", updated_at: "2026-10-09 14:10:00" },

    // Student 103: Jefferson Sadoguio
    { transaction_id: 5, assignment_id: 107, request_id: 1, student_id: 103, gcash_reference_number: "9024018294812", gcash_sender_name: "JEFFERSON SADOGUIO", gcash_sender_number: "09165938156", amount_paid: "350.00", payment_timestamp: "2026-10-03 11:00:00", receipt_image_path: "sample_receipt_5", student_notes: "Org Fee 4A", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-03 11:20:00", verification_remarks: "Reference approved.", submitted_at: "2026-10-03 11:05:00", updated_at: "2026-10-03 11:20:00" },
    { transaction_id: 6, assignment_id: 108, request_id: 2, student_id: 103, gcash_reference_number: "9025110294819", gcash_sender_name: "JEFFERSON SADOGUIO", gcash_sender_number: "09165938156", amount_paid: "1200.00", payment_timestamp: "2026-10-07 13:40:00", receipt_image_path: "sample_receipt_6", student_notes: "Capstone 2 colloquium fee", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-07 14:00:00", verification_remarks: "Paid in full.", submitted_at: "2026-10-07 13:45:00", updated_at: "2026-10-07 14:00:00" },
    { transaction_id: 7, assignment_id: 109, request_id: 3, student_id: 103, gcash_reference_number: "9026201948201", gcash_sender_name: "JEFFERSON SADOGUIO", gcash_sender_number: "09165938156", amount_paid: "550.00", payment_timestamp: "2026-10-10 11:10:00", receipt_image_path: "sample_receipt_7", student_notes: "Polo Shirt Size M", status: "verified", verified_by_personnel_id: 2, verified_at: "2026-10-10 11:30:00", verification_remarks: "Verified and settled.", submitted_at: "2026-10-10 11:15:00", updated_at: "2026-10-10 11:30:00" },

    // Student 104: Jerome Opana
    { transaction_id: 8, assignment_id: 110, request_id: 1, student_id: 104, gcash_reference_number: "9027381948201", gcash_sender_name: "JEROME OPANA", gcash_sender_number: "09123456789", amount_paid: "350.00", payment_timestamp: "2026-10-04 14:15:00", receipt_image_path: "sample_receipt_8", student_notes: "Departmental contribution", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-04 14:30:00", verification_remarks: "Confirmed.", submitted_at: "2026-10-04 14:20:00", updated_at: "2026-10-04 14:30:00" },
    { transaction_id: 9, assignment_id: 111, request_id: 2, student_id: 104, gcash_reference_number: "9028491029481", gcash_sender_name: "JEROME OPANA", gcash_sender_number: "09123456789", amount_paid: "1200.00", payment_timestamp: "2026-10-16 10:55:00", receipt_image_path: "sample_receipt_9", student_notes: "Capstone defense payment submitted", status: "pending", verified_by_personnel_id: null, verified_at: null, verification_remarks: null, submitted_at: "2026-10-16 11:00:00", updated_at: "2026-10-16 11:00:00" },

    // Student 105: Aaron Mikhael Canonizado
    { transaction_id: 10, assignment_id: 113, request_id: 1, student_id: 105, gcash_reference_number: "9029501948201", gcash_sender_name: "AARON MIKHAEL CANONIZADO", gcash_sender_number: "09123456789", amount_paid: "350.00", payment_timestamp: "2026-10-16 09:05:00", receipt_image_path: "sample_receipt_10", student_notes: "Org Fee express payment", status: "pending", verified_by_personnel_id: null, verified_at: null, verification_remarks: null, submitted_at: "2026-10-16 09:10:00", updated_at: "2026-10-16 09:10:00" },

    // Student 106: John Robin Fernandez
    { transaction_id: 11, assignment_id: 116, request_id: 1, student_id: 106, gcash_reference_number: "9030018492011", gcash_sender_name: "JOHN ROBIN FERNANDEZ", gcash_sender_number: "09123456789", amount_paid: "350.00", payment_timestamp: "2026-10-05 15:45:00", receipt_image_path: "sample_receipt_11", student_notes: "Membership dues", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-05 16:00:00", verification_remarks: "Receipt approved.", submitted_at: "2026-10-05 15:50:00", updated_at: "2026-10-05 16:00:00" },

    // Student 107: Ma. Sophia Dimasu-ay
    { transaction_id: 12, assignment_id: 119, request_id: 1, student_id: 107, gcash_reference_number: "9030129482012", gcash_sender_name: "MA SOPHIA DIMASU-AY", gcash_sender_number: "09636729211", amount_paid: "350.00", payment_timestamp: "2026-10-04 10:05:00", receipt_image_path: "sample_receipt_12", student_notes: "COE Council Fee", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-04 10:20:00", verification_remarks: "Cleared.", submitted_at: "2026-10-04 10:10:00", updated_at: "2026-10-04 10:20:00" },
    { transaction_id: 13, assignment_id: 120, request_id: 2, student_id: 107, gcash_reference_number: "9030230593023", gcash_sender_name: "MA SOPHIA DIMASU-AY", gcash_sender_number: "09636729211", amount_paid: "1200.00", payment_timestamp: "2026-10-07 16:15:00", receipt_image_path: "sample_receipt_13", student_notes: "Capstone Colloquium panel fee", status: "verified", verified_by_personnel_id: 1, verified_at: "2026-10-07 16:30:00", verification_remarks: "Approved and valid.", submitted_at: "2026-10-07 16:20:00", updated_at: "2026-10-07 16:30:00" },
    { transaction_id: 14, assignment_id: 121, request_id: 3, student_id: 107, gcash_reference_number: "9030341604134", gcash_sender_name: "MA SOPHIA DIMASU-AY", gcash_sender_number: "09636729211", amount_paid: "550.00", payment_timestamp: "2026-10-10 13:40:00", receipt_image_path: "sample_receipt_14", student_notes: "Technical Polo Shirt S", status: "verified", verified_by_personnel_id: 2, verified_at: "2026-10-10 14:00:00", verification_remarks: "Payment confirmed.", submitted_at: "2026-10-10 13:45:00", updated_at: "2026-10-10 14:00:00" }
  ],

  audit_logs: [
    { log_id: 1, user_id: 1, action_type: "SYSTEM_INIT", entity_name: "database", entity_id: 1, details: "Initialized COE-Pay official masterlist cohort for Academic Year 2026-2027 1st Semester", ip_address: "127.0.0.1", user_agent: "Database Bootstrap Script", created_at: "2026-08-15 08:00:00" },
    { log_id: 2, user_id: 2, action_type: "CREATE_REQUEST", entity_name: "payment_requests", entity_id: 1, details: "Created payment request: 1st Sem 2026-2027 COE Departmental Org Fee (PHP 350.00)", ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", created_at: "2026-09-28 10:00:00" },
    { log_id: 3, user_id: 1, action_type: "AUTHORIZE_REQUEST", entity_name: "payment_requests", entity_id: 1, details: "Authorized payment request #1 and generated student assignments for 8 official students", ip_address: "192.168.1.5", user_agent: "Mozilla/5.0", created_at: "2026-10-01 09:30:00" },
    { log_id: 4, user_id: 30, action_type: "SUBMIT_PAYMENT", entity_name: "payment_transactions", entity_id: 1, details: "Submitted GCash payment ref: 9021884920193 for Request #1 (PHP 350.00)", ip_address: "192.168.1.101", user_agent: "Mozilla/5.0", created_at: "2026-10-02 14:16:00" },
    { log_id: 5, user_id: 2, action_type: "VERIFY_PAYMENT", entity_name: "payment_transactions", entity_id: 1, details: "Verified transaction #1 (Christian Dave Guiyab). Marked as paid.", ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", created_at: "2026-10-02 14:20:00" },
    { log_id: 6, user_id: 31, action_type: "SUBMIT_PAYMENT", entity_name: "payment_transactions", entity_id: 2, details: "Submitted GCash payment ref: 9022510294821 for Request #1 (PHP 350.00)", ip_address: "192.168.1.102", user_agent: "Mozilla/5.0", created_at: "2026-10-02 16:35:00" },
    { log_id: 7, user_id: 2, action_type: "VERIFY_PAYMENT", entity_name: "payment_transactions", entity_id: 2, details: "Verified transaction #2 (Jay-are Mesias). Marked as paid.", ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", created_at: "2026-10-02 16:45:00" },
    { log_id: 8, user_id: 32, action_type: "SUBMIT_PAYMENT", entity_name: "payment_transactions", entity_id: 5, details: "Submitted GCash payment ref: 9024018294812 for Request #1 (PHP 350.00)", ip_address: "192.168.1.103", user_agent: "Mozilla/5.0", created_at: "2026-10-03 11:05:00" },
    { log_id: 9, user_id: 2, action_type: "VERIFY_PAYMENT", entity_name: "payment_transactions", entity_id: 5, details: "Verified transaction #5 (Jefferson Sadoguio). Marked as paid.", ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", created_at: "2026-10-03 11:20:00" },
    { log_id: 10, user_id: 1, action_type: "EMAIL_DISPATCH_DEFAULT_PASSWORD", entity_name: "users", entity_id: 30, details: "Dispatched initial welcome credentials and default password to 8 official masterlist students", ip_address: "192.168.1.5", user_agent: "Mozilla/5.0", created_at: "2026-08-20 09:40:00" }
  ],

  dispatched_emails: [
    {
      email_id: 1,
      recipient_email: "christian.guiyab@students.edu.ph",
      recipient_name: "Christian Dave D. Guiyab",
      student_number: "2023-10001",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Christian Dave D. Guiyab,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10001\nRegistered Email: christian.guiyab@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:30:00"
    },
    {
      email_id: 2,
      recipient_email: "sstephencurryy30@gmail.com",
      recipient_name: "Jay-are Mesias",
      student_number: "2023-10009",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Jay-are Mesias,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10009\nRegistered Email: sstephencurryy30@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:31:00"
    },
    {
      email_id: 3,
      recipient_email: "jeffesonsadoguio@gmail.com",
      recipient_name: "Jefferson C. Sadoguio",
      student_number: "2023-10003",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Jefferson C. Sadoguio,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10003\nRegistered Email: jeffesonsadoguio@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:32:00"
    },
    {
      email_id: 4,
      recipient_email: "jerome.opana@students.edu.ph",
      recipient_name: "Jerome R. Opana",
      student_number: "2023-10004",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Jerome R. Opana,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10004\nRegistered Email: jerome.opana@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:33:00"
    },
    {
      email_id: 5,
      recipient_email: "aaron.canonizado@students.edu.ph",
      recipient_name: "Aaron Mikhael Canonizado",
      student_number: "2023-10005",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Aaron Mikhael Canonizado,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10005\nRegistered Email: aaron.canonizado@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:34:00"
    },
    {
      email_id: 6,
      recipient_email: "johnrobin.fernandez@students.edu.ph",
      recipient_name: "John Robin P. Fernandez",
      student_number: "2023-10006",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear John Robin P. Fernandez,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10006\nRegistered Email: johnrobin.fernandez@students.edu.ph\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:35:00"
    },
    {
      email_id: 7,
      recipient_email: "sdimasuay13@gmail.com",
      recipient_name: "Ma. Sophia B. Dimasu-ay",
      student_number: "2023-10007",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Ma. Sophia B. Dimasu-ay,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10007\nRegistered Email: sdimasuay13@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:36:00"
    },
    {
      email_id: 8,
      recipient_email: "gonzagat634@gmail.com",
      recipient_name: "Tricia Mae S. Gonzaga",
      student_number: "2023-10008",
      email_type: "DEFAULT_PASSWORD",
      subject: "Welcome to COE-Pay: Your Default Login Credentials",
      body_text: "Dear Tricia Mae S. Gonzaga,\n\nYou have been enrolled in the official BSCpE-4A Masterlist for Academic Year 2026-2027.\n\nLogin URL: http://localhost:8080/\nUsername / Student ID: 2023-10008\nRegistered Email: gonzagat634@gmail.com\nDefault Password: password123\n\nYou may log in using either your Student ID Number or your Registered Email. A 2-Factor OTP will be sent to this email address on each login.",
      status: "DELIVERED",
      dispatched_at: "2026-08-20 09:37:00"
    }
  ]
};
