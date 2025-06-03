# ResiGate Functional Documentation

> **Version**: 1.0  
> **Last Updated**: June 3, 2025  
> **Target Audience**: Clients, society administrators, security personnel, and technical team members who need to understand overall system behavior and workflows.

---

## 1. Project Overview

ResiGate is a **full-stack visitor management system** designed for residential societies. Its goal is to streamline:

- **Visitor Registration**: Logging visitor details when they arrive.
- **Check-In / Check-Out**: Tracking visitor movement in real-time.
- **Resident Notifications**: Informing residents when their visitors arrive.
- **Resident Management**: Managing resident profiles (apartments, contact info).
- **Security Dashboard**: Allowing security personnel to monitor all visitors at a glance.

### 1.1. Why ResiGate?

- **Security & Transparency**: All visitor data is recorded with timestamps.
- **Ease of Use**: A Next.js frontend provides a responsive UI for security, residents, and admins.
- **Notifications**: Residents get instant alerts via email (and/or push notifications) whenever a visitor is registered or checks in.
- **Role-Based Access**: Admin, Resident, and Security roles ensure separation of duties.

---

## 2. User Roles & Permissions

| Role         | Description                        | Permissions                                                                 |
|--------------|------------------------------------|------------------------------------------------------------------------------|
| **Admin**    | Society administrator              | • Manage residents<br>• View/delete all visitors<br>• Configure system settings |
| **Resident** | Homeowner or tenant                | • View own visitor history<br>• Approve/deny visitor requests (if implemented) |
| **Security** | Gate/security personnel            | • Register new visitors<br>• Check in/out visitors<br>• View current day’s visitors |
| **Guest**    | Unauthenticated user               | • Access public landing page (if any)                                       |

---

## 3. Key Features & Workflows

### 3.1. Visitor Registration Workflow

1. **Visitor Arrives at Gate**  
   - Provides name, phone, purpose, and host’s apartment number to security.

2. **Security Logs Visitor**  
   - Fills out a “New Visitor” form on the ResiGate frontend.  
   - System creates a new `visitor` record via:  
     `POST /api/v1/visitors`

3. **Resident Notification**  
   - Once created, ResiGate sends an instant email:  
     ```
     Subject: New Visitor at Gate
     Body: Your visitor John Doe is waiting at the gate for Apartment A-101.
     ```
   - Optional: Push notification on mobile app.

4. **Check-In**  
   - Security clicks “Check In” →  
     `PATCH /visitors/:id/status` with `"checked-in"`  
   - Logs `checkInTime` and updates visitor status.

5. **Check-Out**  
   - Security clicks “Check Out” →  
     `PATCH /visitors/:id/status` with `"checked-out"`  
   - Logs `checkOutTime` and marks visit complete.

---

### 3.2. Resident Management Workflow

1. **Admin Adds a Resident**  
   - Navigates to “Residents” → “Add New Resident”  
   - Fills form →  
     `POST /api/v1/residents`

2. **Resident Views Own Profile**  
   - Logs in → “My Profile”  
   - Sees personal details + visitor history  
     `GET /api/v1/residents/:id`

3. **Admin/Resident Updates Profile**  
   - Calls:  
     `PATCH /api/v1/residents/:id`

---

### 3.3. Security Dashboard

- **Daily Visitor List**  
  - Shows today’s visitors:  
    `GET /api/v1/visitors?date=<today>`

- **Search & Filter**  
  - Filter by status or search by phone/name.

- **Quick Actions**  
  - Inline Check-In/Check-Out buttons for real-time updates.

---

## 4. UI/UX Components

### 4.1. Pages & Major Components (Next.js)

1. **`/login`**  
   - Email + Password login  
   - Stores JWT and redirects based on role.

2. **`/admin/dashboard`**  
   - Overview cards: Total Residents, Visitors Today  
   - Links to Manage Residents and View Visitors.

3. **`/admin/residents`**  
   - Table with Name, Apartment, Email, Phone  
   - Add, Edit, Delete Resident actions.

4. **`/admin/visitors`** or **`/security/visitors`**  
   - Visitor table with filters and check-in/out buttons.

5. **`/resident/dashboard`**  
   - Shows upcoming visitors + visit history  
   - Optional: “Request Visitor Approval” form.

6. **`/visitor/register`** (if implemented)  
   - Public form for visitor registration  
   - Sends email/push to host resident.

---

### 4.2. Reusable Components

- **`<Header />`**: Logo, role-based nav, logout  
- **`<SideNav />`**: Dashboard links for admin/security  
- **`<VisitorTable />`**: Visitor data table with pagination  
- **`<ResidentFormModal />`**: Modal to add/edit residents  
- **`<NotificationToast />`**: Inline success/error messages

---

## 5. Data Flow & State Management

### 5.1. Frontend State

- **Global (Context/Redux)**:
  - `auth`: `{ user, token }`  
  - `notifications`: Toast list

- **Page-level**:
  - `visitorsList`: from `GET /visitors`  
  - `residentsList`: from `GET /residents`  
  - `visitorForm`: Local input fields

---

### 5.2. API Call Sequence

1. Login → `POST /auth/login` → store token  
2. Protected routes → add `Authorization: Bearer <token>`  
3. Backend verifies → returns JSON  
4. State updates trigger Next.js re-renders

---

## 6. External Integrations

- **Email**  
  - SendGrid / NodeMailer for notifications

- **Push Notifications** (optional)  
  - Firebase Cloud Messaging (FCM)

- **Database**  
  - MongoDB Atlas or local  
  - Collections:  
    - `Users`  
    - `Residents`  
    - `Visitors`

- **Authentication**  
  - JWT (access & refresh tokens)

- **Storage** (optional)  
  - For visitor photos: AWS S3 / Firebase Storage / Local

---

## 7. Non-Functional Requirements

- **Performance**  
  - API < 200ms  
  - Use pagination

- **Scalability**  
  - Multi-instance Node.js  
  - MongoDB replica sets

- **Security**  
  - JWT protection  
  - Bcrypt-hashed passwords (≥ 10 salt rounds)  
  - Enforce HTTPS

- **Logging & Monitoring**  
  - Backend logs to console/service  
  - Frontend to Sentry (optional)

- **Backup & Recovery**  
  - Daily DB backups  
  - Restorable process documented

- **Localization** (optional)  
  - JSON-based string files: `/locales/en.json`, `/locales/hi.json`

---

## 8. Sequence Diagrams & Flowcharts

> **Tip**: Use draw.io or Mermaid for diagrams. Embed PNG/SVG or keep `.md` with Mermaid code.

### 8.1. Visitor Registration Sequence

```mermaid
sequenceDiagram
    participant Visitor
    participant SecurityFrontEnd as Security-UI
    participant API as ResiGate-API
    participant DB as MongoDB
    participant EmailService

    Visitor->>SecurityFrontEnd: Arrives & provides details
    SecurityFrontEnd->>API: POST /api/v1/visitors {name, phone, hostResidentId, ...}
    API->>DB: Insert visitor record
    DB-->>API: Returns new visitorId
    API->>EmailService: Send notification to hostResidentId
    EmailService-->>Resident: “Your visitor John Doe is waiting”
    API-->>SecurityFrontEnd: { visitorId, message: "Registered" }
    SecurityFrontEnd-->>Visitor: “You are registered. Please wait.”
