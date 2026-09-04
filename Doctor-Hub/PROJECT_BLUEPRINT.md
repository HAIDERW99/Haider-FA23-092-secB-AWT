# 🏥 Doctor Hub — Full Project Description

> **Course:** Advanced Web Technologies (AWT) — Semester Fall 2023  
> **Roll No:** FA23-092 | **Section:** B  
> **Project:** Doctor Hub — Unified Healthcare Management Platform  
> **GitHub:** [Haider-FA23-092-secB-AWT](https://github.com/HAIDERW99/Haider-FA23-092-secB-AWT)

---

## 📋 Executive Summary

**Doctor Hub** ek full-stack web application hai jo healthcare management ko completely digital banata hai. Is platform mein patients apne doctor dhundh sakte hain, appointment book kar sakte hain aur payment kar sakte hain — jabke doctors apni clinics, schedules, aur patients ko ek hi jagah manage kar sakte hain. Admins pure system ko control karte hain.

Yeh ek **Single Page Application (SPA)** hai jisme **5 alag portals** hain — har role ke liye alag dashboard, alag routes, aur alag permissions — lekin sab ek hi React app mein.

---

## 🎯 Problem Statement

Healthcare mein appointment booking aur management abhi bhi mostly manual ya disconnected systems se hoti hai. Patients ko:
- Doctor availability pata nahi hoti
- Payment process complicated hoti hai
- Medical history scattered rehti hai
- Doctor se directly communicate nahi kar sakte

**Doctor Hub** in sab problems ko ek platform pe solve karta hai.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (CLIENT SIDE)                     │
│                                                              │
│    React 18 + Vite + Tailwind CSS (Single Page App)         │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ Public   │ │ Patient  │ │  Doctor   │ │    Admin     │  │
│  │ Portal   │ │ Portal   │ │  Portal   │ │  + Assistant │  │
│  │/  /about │ │/patient/ │ │ /doctor/  │ │   /admin/    │  │
│  │/contact  │ │  *       │ │    *      │ │  /assistant/ │  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │  HTTP REST API (Axios)
                          │  Authorization: Bearer <JWT>
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER                         │
│                                                              │
│           Node.js + Express 5  (PORT: 4000)                 │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Helmet    │  │   CORS       │  │   Rate Limiters   │  │
│  │  (Security) │  │ (Allowlist)  │  │ auth/api/upload/  │  │
│  └─────────────┘  └──────────────┘  │    ai/notify      │  │
│                                     └───────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         22 Route Files  ×  20 Controllers           │    │
│  │   authenticate() ──► authorizeRoles() ──► handler   │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────┬────────────────────────────┬────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────┐        ┌───────────────────────┐
│    Supabase      │        │   External Services    │
│  (PostgreSQL)    │        │                        │
│                  │        │  Cloudinary (images)   │
│  9 Core Tables   │        │  OpenAI  (AI predict)  │
│  + Schedules     │        │  WhatsApp (notify)     │
│  + Messages      │        │  PDFKit (e-prescribe)  │
│  + Notifications │        │  Video  (consult)      │
└──────────────────┘        └───────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend Dependencies (exact versions)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | Core UI framework |
| `react-dom` | ^18.3.1 | DOM rendering |
| `react-router-dom` | ^6.28.0 | Client-side routing |
| `vite` | ^6.0.3 | Build tool & dev server |
| `tailwindcss` | ^3.4.17 | Utility-first CSS styling |
| `axios` | ^1.7.9 | HTTP client for API calls |
| `lucide-react` | ^1.17.0 | Icon library |
| `recharts` | ^3.8.1 | Charts for dashboards |
| `react-toastify` | ^11.1.0 | Toast notifications |
| `clsx` | ^2.1.1 | Conditional class names |
| `tailwind-merge` | ^3.6.0 | Tailwind class merging |

### Backend Dependencies (exact versions)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.1.0 | Web framework |
| `@supabase/supabase-js` | ^2.101.1 | Database client |
| `bcrypt` | ^6.0.0 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT auth tokens |
| `helmet` | ^8.2.0 | HTTP security headers |
| `cors` | ^2.8.5 | Cross-origin requests |
| `express-rate-limit` | ^8.5.2 | Rate limiting |
| `express-validator` | ^7.3.2 | Input validation |
| `multer` | ^2.0.0 | File upload handling |
| `cloudinary` | ^2.6.1 | Cloud image storage |
| `pdfkit` | ^0.18.0 | PDF generation |
| `stripe` | ^11.18.0 | Payment gateway |
| `nodemon` | ^3.1.10 | Dev auto-restart |
| `dotenv` | ^16.5.0 | Environment variables |
| `validator` | ^13.15.15 | String validation |

---

## 👥 User Roles & Portals

### 1. 🧑‍⚕️ Patient Portal (`/patient/*`)

Patients publicly register karte hain aur yeh features use karte hain:

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/patient/dashboard` | Overview of appointments, quick links |
| Find Doctor | `/patient/doctors` | Search & filter doctors by disease/treatment |
| Doctor Detail | `/patient/doctors/:id` | Doctor profile, book appointment |
| My Appointments | `/patient/appointments` | All bookings with status & payment upload |
| Messages | `/patient/messages` | Chat with doctor |
| Medical History | `/patient/history` | View own medical records |
| Prescriptions | `/patient/prescriptions` | View & download prescriptions (PDF) |
| Profile | `/patient/profile` | Edit personal information |

**Key Features:**
- Disease aur treatment type ke hisaab se doctor filter
- Appointment book karna aur time slot select karna
- Payment screenshot upload karna (Cloudinary)
- Doctor se real-time messaging
- PDF prescription download

---

### 2. 👨‍⚕️ Doctor Portal (`/doctor/*`)

Doctors admin register karte hain. Inke paas yeh capabilities hain:

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/doctor/dashboard` | Today's appointments, stats |
| Profile | `/doctor/profile` | Specialization, diseases, fee, bio |
| Clinics | `/doctor/clinics` | Manage clinic locations |
| Schedule | `/doctor/schedule` | Set weekly availability & time slots |
| Appointments | `/doctor/appointments` | All patient appointments |
| Appointment Detail | `/doctor/appointments/:id` | Single appointment info |
| Patients | `/doctor/patients` | All patients list |
| Patient History | `/doctor/patients/:id/history` | Patient's medical history |
| Add Medical Record | `/doctor/appointments/:id/medical-record` | Write visit notes |
| Add Prescription | `/doctor/appointments/:id/prescription` | Write prescription |
| Prescriptions | `/doctor/prescriptions` | All prescriptions written |
| Messages | `/doctor/messages` | Chat with patients |

**Key Features:**
- Multiple clinic management
- Weekly schedule aur slot duration set karna
- Immutable medical records (no delete/edit)
- E-prescription PDF generation (PDFKit)
- Patient chat system

---

### 3. 🗂️ Assistant Portal (`/assistant/*`)

Assistant doctor ke liye payment verify karta hai:

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/assistant/dashboard` | Pending tasks overview |
| Pending Payments | `/assistant/pending-payments` | Payment screenshots verify/reject |
| Appointments | `/assistant/appointments` | All clinic appointments |
| Bookings | `/assistant/bookings` | Manage booking slots |

**Key Features:**
- Payment screenshots approve/reject karna
- Appointment status update karna
- WhatsApp notifications send karna

---

### 4. 👔 Admin Portal (`/admin/*`)

Admin doctors aur assistants manage karta hai:

| Page | Route | Access |
|------|-------|--------|
| Dashboard | `/admin/dashboard` | Admin + Super Admin |
| Doctors | `/admin/doctors` | Add/edit/remove doctors |
| Assistants | `/admin/assistants` | Assign assistants to doctors |
| Patients | `/admin/patients` | View all patients |
| Appointments | `/admin/appointments` | Platform-wide appointments |
| Payments | `/admin/payments` | All payment records |
| Approvals | `/admin/approvals` | **Super Admin only** |
| Admins | `/admin/admins` | **Super Admin only** |
| Users | `/admin/users` | **Super Admin only** |

---

### 5. 🌐 Public Pages (No Login Required)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with features |
| About | `/about` | Platform information |
| Contact | `/contact` | Contact form |
| Login | `/login` | Patient / Doctor login |
| Register | `/register` | Patient registration |
| Admin Login | `/admin/login` | Staff login |
| Forgot Password | `/forgot-password` | Password reset |

---

## 🗄️ Database Schema

### Core Tables (Supabase PostgreSQL)

```sql
-- 1. USERS (central auth table)
users (
  user_id        UUID PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT CHECK (role IN ('patient','doctor','assistant','admin','super_admin')),
  full_name      TEXT,
  phone          TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
)

-- 2. PATIENTS (extends users)
patients (
  patient_id    UUID PRIMARY KEY,
  user_id       UUID REFERENCES users(user_id),
  date_of_birth DATE,
  blood_type    TEXT,
  address       TEXT
)

-- 3. DOCTORS (extends users)
doctors (
  doctor_id         UUID PRIMARY KEY,
  user_id           UUID REFERENCES users(user_id),
  specialization    TEXT,
  diseases          TEXT[],      -- Array of diseases treated
  treatment_types   TEXT[],      -- Array of treatment methods
  consultation_fee  NUMERIC,
  bio               TEXT,
  profile_image     TEXT         -- Cloudinary URL
)

-- 4. CLINICS
clinics (
  clinic_id   UUID PRIMARY KEY,
  doctor_id   UUID REFERENCES doctors(doctor_id),
  name        TEXT,
  address     TEXT,
  phone       TEXT,
  city        TEXT
)

-- 5. ASSISTANTS (extends users)
assistants (
  assistant_id  UUID PRIMARY KEY,
  user_id       UUID REFERENCES users(user_id),
  doctor_id     UUID REFERENCES doctors(doctor_id),
  clinic_id     UUID REFERENCES clinics(clinic_id)
)

-- 6. APPOINTMENTS
appointments (
  appointment_id  UUID PRIMARY KEY,
  patient_id      UUID REFERENCES patients(patient_id),
  doctor_id       UUID REFERENCES doctors(doctor_id),
  clinic_id       UUID REFERENCES clinics(clinic_id),
  date            DATE,
  time_slot       TEXT,
  status          TEXT,  -- See workflow below
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
)

-- 7. PAYMENTS
payments (
  payment_id      UUID PRIMARY KEY,
  appointment_id  UUID REFERENCES appointments(appointment_id),
  screenshot_url  TEXT,           -- Cloudinary URL
  status          TEXT,           -- pending/verified/rejected
  verified_by     UUID,           -- assistant user_id
  verified_at     TIMESTAMP
)

-- 8. MEDICAL HISTORY (IMMUTABLE)
medical_history (
  history_id   UUID PRIMARY KEY,
  patient_id   UUID REFERENCES patients(patient_id),
  doctor_id    UUID REFERENCES doctors(doctor_id),
  diagnosis    TEXT,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
  -- NO DELETE, NO UPDATE allowed
)

-- 9. PRESCRIPTIONS (IMMUTABLE)
prescriptions (
  prescription_id  UUID PRIMARY KEY,
  patient_id       UUID REFERENCES patients(patient_id),
  doctor_id        UUID REFERENCES doctors(doctor_id),
  appointment_id   UUID REFERENCES appointments(appointment_id),
  medicines        JSONB,    -- [{name, dosage, frequency, duration}]
  instructions     TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
  -- NO DELETE, NO UPDATE allowed
)

-- ADDITIONAL TABLES (added in later phases)
schedules     -- Doctor weekly availability
messages      -- Patient-Doctor chat
notifications -- Platform inbox
```

---

## 🔄 Appointment Workflow (State Machine)

```
Patient searches doctors
        |
        | Filter by: disease, treatment_type, city, fee
        v
Patient views Doctor Profile
        |
        | Selects date + time slot
        v
POST /api/appointments
        |
        v
  [payment_pending]
  "Slot reserved, awaiting payment"
        |
        | Patient uploads payment screenshot
        | POST /api/payments  (Cloudinary upload)
        v
  [payment_submitted]
  "Screenshot received"
        |
        |── Assistant clicks APPROVE ──► [verified] ──► [confirmed]
        |                                                     |
        |                                                     | After visit
        |                                                     v
        |                                               [completed]
        |                                            Doctor adds history
        |                                            & prescription
        |
        |── Assistant clicks REJECT ──► [rejected]
                                              |
                                              | Patient re-uploads
                                              v
                                      [payment_submitted]
```

| Status | Who Changes It | Next Step |
|--------|---------------|-----------|
| `payment_pending` | System (auto) | Patient uploads screenshot |
| `payment_submitted` | Patient | Assistant reviews |
| `verified` | Assistant | Auto → confirmed |
| `confirmed` | System | Patient attends |
| `completed` | Doctor | Adds medical record |
| `rejected` | Assistant | Patient re-uploads |
| `cancelled` | Patient/Admin | Terminal state |

---

## 🌐 Complete API Reference

**Base URL:** `http://localhost:4000/api`  
**Auth Header:** `Authorization: Bearer <jwt_token>`  
**Response Format:** `{ "success": true, "data": {} }` or `{ "success": false, "message": "..." }`

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Rate Limit |
|--------|----------|--------|-----------|
| POST | `/auth/register` | Public | Auth limiter |
| POST | `/auth/login` | Public | Auth limiter |
| POST | `/auth/admin/login` | Public | Auth limiter |
| POST | `/auth/forgot-password` | Public | Auth limiter |
| POST | `/auth/reset-password` | Public (token) | Auth limiter |
| GET | `/auth/me` | Authenticated | API limiter |

### Doctor Search (Public)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/doctors` | Public | List/search with filters |
| GET | `/doctors/:id` | Public | Doctor detail |
| GET | `/doctors/:id/schedules` | Public | Available slots |

### Patient Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/patient/profile` | patient | Own profile |
| PUT | `/patient/profile` | patient | Update profile |
| GET | `/patient/appointments` | patient | My appointments |
| GET | `/patient/history` | patient | My medical history |
| GET | `/patient/prescriptions` | patient | My prescriptions |
| GET | `/patients/me` | patient | Patient record |
| PATCH | `/patients/me` | patient | Update patient record |

### Appointments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/appointments` | patient | Book appointment |
| GET | `/appointments` | all roles | List (scoped by role) |
| GET | `/appointments/:id` | involved parties | Detail |
| PATCH | `/appointments/:id/status` | assistant/doctor | Update status |
| PATCH | `/appointments/:id/cancel` | patient | Cancel |

### Payments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/payments` | patient | Upload screenshot | Upload limiter |
| GET | `/payments` | assistant/admin | All payments |
| GET | `/payments/pending` | assistant/admin | Pending only |
| POST | `/payments/:id/verify` | assistant | Approve |
| POST | `/payments/:id/reject` | assistant | Reject |

### Doctor Portal

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/doctor/profile` | doctor | Own profile |
| PUT | `/doctor/profile` | doctor | Update profile |
| GET | `/doctor/appointments` | doctor | All appointments |
| GET | `/doctor/patients` | doctor | All patients |
| GET | `/doctor/clinics` | doctor | My clinics |
| POST | `/doctor/clinics` | doctor | Add clinic |
| PATCH | `/doctor/clinics/:id` | doctor | Update clinic |
| GET | `/doctor/schedule` | doctor | My schedule |
| POST | `/doctor/schedule` | doctor | Set schedule |
| GET | `/doctor/patients/:id/history` | doctor | Patient history |

### Medical Records

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/history` | patient/doctor | History (scoped) | Upload limiter |
| POST | `/history` | patient/doctor | Add record | Upload limiter |
| GET | `/prescriptions` | patient/doctor | Prescriptions |
| POST | `/prescriptions` | doctor | Write prescription |
| GET | `/prescriptions/:id/pdf` | patient/doctor/admin | Download PDF |

### Messaging

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/messages` | patient/doctor | Thread list |
| POST | `/messages` | patient/doctor | Send message |

### Admin Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/doctors` | admin+ | All doctors |
| POST | `/admin/doctors` | admin+ | Add doctor |
| PATCH | `/admin/doctors/:id` | admin+ | Update doctor |
| DELETE | `/admin/doctors/:id` | admin+ | Remove doctor |
| GET | `/admin/assistants` | admin+ | All assistants |
| POST | `/admin/assistants` | admin+ | Add assistant |
| PATCH | `/admin/assistants/:id` | admin+ | Update assistant |
| GET | `/admin/patients` | admin+ | All patients |
| GET | `/admin/appointments` | admin+ | All appointments |
| GET | `/admin/payments` | admin+ | All payments |
| GET | `/admin/users` | super_admin | All system users |
| GET | `/admin/admins` | super_admin | All admins |
| GET | `/admin/approvals` | super_admin | Pending approvals |
| POST | `/admin/approvals/:id` | super_admin | Approve/reject admin |

### AI Feature

| Method | Endpoint | Access | Rate Limit | Description |
|--------|----------|--------|-----------|-------------|
| POST | `/ai/predict` | Public | AI limiter | Symptom → disease prediction |

**Request body:**
```json
{
  "symptoms": "fever, cough, headache",
  "age": 25,
  "duration_days": 3
}
```

### Video Consultations

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/consultations/:appointmentId/video-room` | patient/doctor | Get video room |
| POST | `/consultations/:appointmentId/video-room` | patient/doctor | Create video room |

*Appointment must be `confirmed` status.*

### WhatsApp Notifications

| Method | Endpoint | Access | Rate Limit | Description |
|--------|----------|--------|-----------|-------------|
| GET | `/notifications/whatsapp` | assistant/admin | Notify limiter | Delivery log |
| POST | `/notifications/whatsapp` | assistant/admin | Notify limiter | Send notification |

**Auto-sent on:** appointment booked, payment submitted, payment confirmed, payment rejected.

### Platform Inbox

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/inbox` | Authenticated | In-app notifications |

### Dashboard

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | All roles | Role-scoped stats |

### Health Check

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/health` | Public | Server status |

---

## 🔒 Security Implementation

### Rate Limiters (configured in `config/security.js`)

| Limiter | Applied To | Purpose |
|---------|-----------|---------|
| `authRateLimiter` | `/api/auth/*` | Prevent brute force login |
| `uploadRateLimiter` | `/api/payments`, `/api/history` | Prevent upload abuse |
| `aiRateLimiter` | `/api/ai/*` | Control OpenAI API costs |
| `notificationRateLimiter` | `/api/notifications/*` | Prevent WhatsApp spam |
| `apiRateLimiter` | All other `/api/*` | General protection |

### Auth Middleware Chain

```javascript
// Every protected route:
router.get('/profile', authenticate, authorizeRoles('doctor'), handler)

// authenticate.js: jwt.verify(token, JWT_SECRET)
// authorizeRoles.js: checks req.user.role against allowed roles
```

### Security Stack

| Layer | Implementation |
|-------|---------------|
| Password Storage | bcrypt (salt rounds: 10) |
| Auth Token | JWT — 7 day expiry |
| HTTP Headers | Helmet middleware |
| CORS | Allowlist — frontend URL only |
| Input Validation | express-validator on all write endpoints |
| Medical Records | DB-level + API-level: no DELETE on history/prescriptions |
| File Uploads | Multer + Cloudinary (no local storage) |
| Error Handling | Global `errorHandler` middleware (no stack traces in prod) |
| Env Validation | `validateEnv()` on startup — exits in production if missing keys |

---

## ⚙️ Background Service

Server mein ek **live appointment service** bhi hai:

```javascript
// server.js (line 178-184)
import('./services/appointmentLiveService.js')
  .then(({ processDueAppointmentNotifications }) => {
    processDueAppointmentNotifications()
    setInterval(() => {
      processDueAppointmentNotifications()
    }, 60 * 1000)  // Runs every 60 seconds
  })
```

Yeh service har 60 seconds mein check karti hai ke koi appointment due ho gayi ho, aur automatically notifications bhejti hai.

---

## 🚀 Development Phases (All Complete)

| Phase | Feature | Key Deliverables |
|-------|---------|-----------------|
| 0 | Bootstrap & Architecture | Express setup, Supabase config, project structure |
| 0b | UI Foundation | React + Vite + Tailwind, routing, context |
| 1 | Database | 9 core tables, SQL schema files |
| 2 | Auth & RBAC | JWT login, bcrypt, role middleware |
| 3 | Doctors & Clinics | Search/filter, clinic management |
| 4 | Appointments | Booking workflow, slot selection |
| 5 | Payments | Screenshot upload, Cloudinary, assistant verification |
| 6 | Medical Records | Immutable history & prescriptions |
| 7 | Dashboards | Role-specific stats pages |
| 8 | Assistant Management | Assign assistants to doctors/clinics |
| 9 | Messaging | Patient-Doctor chat system |
| 11 | Security Hardening | Helmet, rate limiting, env validation |
| 12 | AI Prediction | OpenAI integration — symptom checker |
| 13 | Video Consultation | Video room creation & joining |
| 14 | WhatsApp Notifications | Auto + manual notification sending |
| 15 | E-Prescription PDF | PDFKit — downloadable prescription |

---

## 📁 Project File Statistics

| Category | Count |
|----------|-------|
| Frontend Pages | 34 (across 5 portals) |
| Backend Route Files | 22 |
| Backend Controllers | 20 |
| SQL Schema Files | 8 |
| Supabase Tables | 9+ |
| API Endpoints | 50+ |
| Frontend Dependencies | 11 |
| Backend Dependencies | 15 |

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js v18+
- Supabase account
- Cloudinary account (for payments)
- OpenAI API key (for AI feature)

### Step 1: Database Setup (Supabase)

Run these SQL files in Supabase SQL Editor **in this exact order**:

```
1. backend/supabase_schema.sql          ← 9 core tables
2. backend/supabase_schedules.sql       ← Doctor schedules
3. backend/supabase_messages.sql        ← Chat system
4. backend/supabase_video.sql           ← Video consultations
5. backend/supabase_whatsapp.sql        ← WhatsApp logs
6. backend/supabase_seed.sql            ← (Optional) Demo data
7. backend/supabase_superadmin.sql      ← (Optional) Super admin
8. backend/supabase_admin_approvals.sql ← Admin approvals
```

### Step 2: Environment Variables

**`backend/.env`**
```env
PORT=4000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key

JWT_SECRET=your_random_string_minimum_32_characters

CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret_key

OPENAI_API_KEY=sk-...
WHATSAPP_API_URL=https://...
WHATSAPP_API_TOKEN=your_token
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:4000
```

### Step 3: Install & Run

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run server
# Server starts at: http://localhost:4000
# Health check:     http://localhost:4000/health

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# App starts at: http://localhost:5173
```

---

## 🌍 Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | Vercel | Auto-deploy via GitHub |
| Backend | Vercel | `backend/vercel.json` |
| Database | Supabase | Managed PostgreSQL |
| Media | Cloudinary | CDN delivery |

**Production URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-api.vercel.app`
- Health: `https://your-api.vercel.app/health`

---

## 📊 Project Summary

```
Doctor Hub
├── Purpose       : Unified healthcare management platform
├── Type          : Full-stack SPA (Single Page Application)
├── Roles         : 5 (Patient, Doctor, Assistant, Admin, Super Admin)
├── Frontend      : React 18 + Vite + Tailwind CSS
├── Backend       : Node.js + Express 5
├── Database      : Supabase (PostgreSQL)
├── Auth          : JWT + bcrypt + RBAC
├── File Storage  : Cloudinary
├── AI Feature    : OpenAI API
├── Notifications : WhatsApp API + Platform Inbox
├── PDF Export    : PDFKit (E-prescriptions)
├── Video         : Video Consultation API
├── Deployment    : Vercel (Frontend + Backend)
└── Status        : All 15 phases COMPLETE ✅
```

---

*Last updated: September 5, 2026*  
*Student: Haider | Roll: FA23-092 | Section: B | Course: AWT*
