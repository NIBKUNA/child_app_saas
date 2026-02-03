# 🏗️ App Structure & Health Audit Report

**Date**: 2026-02-03
**Project**: Zarada ERP (Child App SaaS)
**Version**: 1.3.0 (Detected in App.tsx)

---

## 1. 📂 Project Structure & Tech Stack

### **Technology Stack**
| Component | Technology | Description |
|-----------|------------|-------------|
| **Core** | React 18 + Vite | Modern, fast frontend build tool. |
| **Language** | TypeScript | *Note: Type checking is disabled in many files.* |
| **Styling** | Tailwind CSS | Utility-first CSS with `config/` customization. |
| **Routing** | React Router v7 | Latest router handling `/app`, `/parent`, `/master` routes. |
| **Backend** | Supabase | Auth, Database (PostgreSQL), and Realtime. |
| **State** | React Context | `AuthContext` (User) & `CenterContext` (Multi-tenant). |
| **Key Libs** | FullCalendar, Recharts, jsPDF | Scheduling, Analytics, and Reporting. |

### **Directory Organization**
The project follows a standard feature-based React structure but has a cluttered root directory.

- **`src/`**
  - **`pages/`**: Divided by role/function.
    - `public/`: Landing pages (`/centers/:slug`).
    - `app/`: Staff ERP system (`/app`).
    - `auth/`: Login/Register flows.
    - `admin/`: Super admin screens (`/master`).
  - **`components/`**: Reusable UI blocks.
  - **`contexts/`**: Global state (`Auth`, `Center`, `Theme`).
  - **`layouts/`**:
    - `PublicLayout`: Website header/footer.
    - `AppLayout`: Sidebar + Topbar for staff.
    - `ParentLayout`: Mobile-optimized view for parents.
  - **`lib/`**: Infrastructure code (`supabase.ts`, `utils.ts`).

- **`root` (Risk Area)**
  - Contains **30+ ad-hoc script files** (`.js`, `.sql`) like `fix_db_schema.js`, `check_admins.js`. These are "one-off" fixes that have accumulated, making maintenance confusing.

---

## 2. 🏗️ System Architecture

### **Authentication & Tenancy**
- **Auth**: Checked via `AuthContext`. Uses a custom `storageAdapter` in `src/lib/supabase.ts` to support specific "Remember Me" logic (switching between `localStorage` and `sessionStorage`).
- **Tenancy**: The app uses a hybrid model:
  - **Public Pages**: Path-based (`/centers/:slug`).
  - **App/Dashboard**: Context-based (`CenterContext`). The user logs in, and their `center_id` is stored/retrieved to scope data.

### **Routing Strategy**
- **Public**: `http://site/centers/center-name` -> Landing Page.
- **Staff**: `http://site/app/dashboard` -> Requires Login + Staff Role.
- **Parent**: `http://site/parent/home` -> Requires Login + Parent Role.
- **Super Admin**: `http://site/master` -> System-wide control.

---

## 3. 🚨 Health Audit & Action Items

### **🔴 Critical Issues (Immediate Action Required)**

#### **1. Database Schema Mismatch**
- **Severity**: **Critical**
- **Location**: Database vs Code
- **Details**: The `WORK_HANDOVER_REPORT.md` explicitly states the codebase expects columns (`assessment_details`) and tables (`home_care_tips`) that do not exist in the DB yet.
- **Risk**: "Development Assessment" saves will fail. Parent dashboard will crash.
- **Fix**: **You MUST run the SQL script found in `WORK_HANDOVER_REPORT.md`.**

#### **2. TypeScript Disabled Globaly**
- **Severity**: **High**
- **Location**: `src/App.tsx` and 50+ other files.
- **Details**: A large portion of the codebase starts with `// @ts-nocheck`.
- **Risk**: This turns off all safety checks. A simple typo (e.g., `user.nmae` instead of `user.name`) will not be caught until the app crashes in production.
- **Fix**: Remove `// @ts-nocheck` gradually and fix the type errors.

### ** ⚠️ Warnings (Maintenance Risks)**

#### **1. Hardcoded Version Logic**
- **Location**: `src/App.tsx` (Line 86)
- **Details**: `const SAAS_ENGINE_VER = "1.3.0";` is manually set inside the component to force cache clearing.
- **Recommendation**: Move this to a constant file or `package.json` to avoid human error during updates.

#### **2. Cluttered Root Directory**
- **Details**: The project root is littered with `clean_logs.cjs`, `verify_column.js`, etc.
- **Recommendation**: Move all these into a `scripts/maintenance` folder to verify what is actual source code vs. temporary tools.

---

## 4. 📝 Conclusion
The app is a robust, full-featured ERP built on solid modern tech (React+Supabase). However, it is currently in a "brittle" state due to the disabled type safety and pending database updates.

**Recommended Next Step**:
1. Execute the **SQL Repair Script** immediately.
2. Verify the `assessment_details` column exists.
3. (Long term) Start removing `@ts-nocheck` from key files like `App.tsx`.
