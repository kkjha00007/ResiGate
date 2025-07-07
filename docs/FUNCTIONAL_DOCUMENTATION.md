# ResiGate Society Management System Documentation

> **Version**: 2.0  
> **Last Updated**: June 15, 2025  
> **Target Audience**: Clients, society administrators, security personnel, and technical team members who need to understand overall system behavior and workflows.

---

## 1. Project Overview

ResiGate is a **comprehensive society management system** for residential communities. It covers:

- **Visitor Management**: Registration, check-in/out, notifications, security dashboard.
- **Resident & Society Management**: Resident profiles, admin controls, committee, vendors, parking, meetings, notices.
- **Maintenance Billing & Accounting**: Automated, configurable billing, payments, expenses, audit trails, ERP export, and advanced reporting.
- **Notifications & Reminders**: In-app, email, and real-time notifications for bills, payments, reminders, disputes, and more.
- **Resident Self-Service**: Residents can view/download bills/receipts, raise disputes, set reminders, and track payments.
- **Admin Management**: Full admin UI for billing, payments, expenses, disputes, reporting, and configuration.

### 1.1. Why ResiGate?

- **Security & Transparency**: All actions are logged and auditable.
- **Modern UI**: Responsive Next.js frontend for all roles.
- **Role-Based Access**: SuperAdmin, SocietyAdmin, Resident, Guard, Guest.
- **Automated Billing**: Multi-period, advance billing, per-society templates, interest/penalty/discounts, and more.
- **ERP/Accounting Export**: CSV/PDF export for all major data.
- **Advanced Analytics**: Live dashboards for income, expenses, dues, and more.

---

## 2. User Roles & Permissions (RBAC System)

ResiGate implements a comprehensive **Role-Based Access Control (RBAC)** system supporting multi-role, multi-society associations with granular permissions.

### 2.1 Role Hierarchy

| Role Group        | Roles                                    | Scope                 | Login Access |
|-------------------|------------------------------------------|-----------------------|--------------|
| **Platform Admin** | Owner (App), Ops                        | Cross-platform        | ✅ Yes       |
| **Society Admin**  | Society Admin, Guard                    | Society-specific      | ✅ Yes       |
| **Resident**       | Owner Resident, Renter Resident, Member Resident | Society/Flat-specific | ✅ Yes       |
| **Support**        | Staff, API System                       | Support/Integration   | ✅ Yes       |

### 2.2 Detailed Role Descriptions

| Role              | Description                          | Key Permissions                                                                                   |
|-------------------|--------------------------------------|---------------------------------------------------------------------------------------------------|
| **Owner (App)**   | Platform owner/administrator         | - Full platform access<br>- Manage all societies<br>- Feature access control<br>- User impersonation |
| **Ops**           | Operations team member               | - Most platform features<br>- Feature access control<br>- Limited admin functions               |
| **Society Admin** | Society administrator                | - Manage residents, billing, facilities<br>- Society-specific full control<br>- Approve requests |
| **Guard**         | Security personnel                   | - Visitor management<br>- Gate pass validation<br>- Security dashboard<br>- SOS response        |
| **Owner Resident**| Property owner                       | - Personal visitor management<br>- Facility booking<br>- Bill management<br>- Committee participation |
| **Renter Resident**| Tenant                              | - Limited visitor management<br>- Facility booking<br>- Bill viewing<br>- Basic resident features |
| **Member Resident**| Non-owner family member             | - Basic visitor management<br>- Limited facility access<br>- View-only bill access              |
| **Staff**         | Support staff                        | - Impersonation for support<br>- Limited admin functions<br>- Help desk management              |
| **API System**    | Integration/automation               | - System-level access<br>- No UI access<br>- API-only operations                                |

### 2.3 Multi-Role Support

- **Users can have multiple roles** across different societies
- **Role associations** define user permissions per society/flat
- **Custom permissions** can override default role permissions
- **Impersonation support** for Staff and Platform Admin roles

### 2.4 Granular Permissions

The system includes **68 granular permissions** across **12 modules**:

| Module                | CRUD Permissions                                    | Special Permissions           |
|-----------------------|----------------------------------------------------|-------------------------------|
| Visitor Management    | create, read, update, delete, approve              | validate_passes               |
| Gate Pass Management  | create, read, update, delete                       | validate_qr                   |
| Facility Management   | create, read, update, delete, book, approve        | manage_bookings               |
| Parking Management    | create, read, update, delete, allocate             | manage_vehicles               |
| Notice Management     | create, read, update, delete                       | pin_notices                   |
| Meeting Management    | create, read, update, delete, attend               | manage_agenda                 |
| Committee Management  | create, read, update, delete                       | vote, manage_elections        |
| Billing Management    | create, read, update, delete, approve              | manage_disputes, send_reminders|
| Complaint Management  | create, read, update, delete, resolve              | escalate                      |
| User Management       | create, read, update, delete, approve              | impersonate                   |
| Setting Management    | create, read, update, delete                       | manage_society_config         |
| SOS Management        | create, read, update, delete, respond              | emergency_broadcast           |

---

## 2.5. Feature Access Control

Platform Admins (Owner App/Ops) can control feature access per role group per society through the Feature Access Control UI:

- **Enable/Disable** entire feature modules for role groups
- **Configure granular CRUD permissions** per feature
- **Society-specific** feature control
- **Real-time permission updates**

---

## 2.6. Feature Overview

### Core Features (2025)

| Feature                          | Description                                                                                 |
|----------------------------------|---------------------------------------------------------------------------------------------|
| Maintenance Billing & Accounting | Automated, multi-period billing, per-society config, interest/penalty/discounts, audit trail |
| Resident Self-Service            | View/download bills/receipts, raise disputes, set reminders, see credit/advance balance      |
| Admin Management                 | Manage bills, payments, expenses, disputes, config, reporting, ERP export                    |
| Notification System              | In-app, email, and real-time notifications for all billing/accounting events                 |
| Reminders                        | Residents can set/trigger reminders for unpaid/overdue bills (manual/scheduled)              |
| Dispute Management               | Residents raise disputes; admins can view, comment, and resolve                              |
| ERP/Accounting Export            | Export all bills, payments, expenses as CSV/PDF                                              |
| Advanced Reporting               | Live dashboards for income, expenses, dues, payment status, with filters                     |
| Interest on Overdue              | Configurable per society/category, auto-calculated and shown on bills                        |
| Audit Trail                      | All changes to bills/configs are logged and viewable                                         |
| Multi-Period/Advance Billing     | Generate bills for multiple periods, auto-apply advance/credit                               |
| Versioned Billing Config         | Per-society, versioned templates with effective dates                                        |
| Real-Time Notification           | WebSocket-based instant notifications for key events                                         |

---

## 3. Key Workflows

### 3.1. Maintenance Billing & Accounting

- **Admin** configures billing template (categories, rates, interest, penalty, discounts, waivers, etc.)
- **Admin** generates bills (single or multi-period) for all or selected flats
- **System** applies correct config, calculates category-wise charges, discounts, waivers, penalties, interest (on overdue), and ad-hoc charges
- **Residents** receive notifications and can view/download bills, see breakdowns, and pay
- **Advance/Credit**: Advance payments are tracked and auto-applied to future bills
- **Interest**: Overdue bills accrue interest as per config (fixed/percent, compounding, grace, max, per-category)
- **Audit Trail**: All bill/config changes are logged and viewable by admins
- **ERP Export**: Admins can export all billing/accounting data for external accounting/ERP

### 3.2. Resident Self-Service

- View/download all bills and receipts (CSV/PDF)
- See current advance/credit balance
- Raise disputes/queries on bills (integrated with HelpDesk)
- Set or trigger reminders for unpaid/overdue bills (manual or scheduled)
- Get notified of new bills, payments, reminders, and dispute updates

### 3.3. Admin Dispute Management

- View all bill disputes/queries
- Add comments, resolve, or escalate
- All actions are logged in the audit trail

### 3.4. Notification & Reminder System

- In-app, email, and real-time (WebSocket) notifications for all billing/accounting events
- Residents can set their own reminder schedule (day/hour/minute) for unpaid/overdue bills
- Admins can trigger reminders for all or selected users
- All reminders are logged and can be viewed in the UI

### 3.5. Advanced Reporting & Analytics

- Visual dashboards for income, expenses, outstanding dues, payment status
- Live data with filters (period, user, category)
- Exportable as CSV/PDF

---

## 4. UI/UX Components (2025)

- **BillingConfigForm**: Admin UI for configuring billing template (categories, rates, interest, penalty, etc.)
- **BillManagementTable**: Admin UI for managing bills (view, filter, export, audit trail)
- **MyBillsTable**: Resident UI for viewing bills, breakdowns, reminders, disputes, downloads
- **DisputeManagementTable**: Admin UI for managing bill disputes
- **FinancialReports**: Admin UI for advanced reporting and analytics
- **Notification System**: In-app, email, and real-time notifications for all users

---

## 5. Data Flow & State Management

- **Billing/Accounting**: All billing, payments, expenses, reminders, and disputes are stored in CosmosDB, with audit trails for all changes
- **Notifications**: Sent via email, in-app, and WebSocket for real-time updates
- **Reminders**: Scheduled via in-process jobs (node-cron), no OS-level scheduler required

---

## 6. Security, Audit, and Compliance

- All actions (billing, config, disputes, reminders) are logged in an immutable audit trail
- Role-based access for all sensitive actions
- Data export for compliance and accounting

---

## 7. Non-Functional Requirements

- **Performance**: API < 200ms, paginated queries
- **Scalability**: Multi-instance Node.js, CosmosDB
- **Security**: JWT, bcrypt, HTTPS, audit logging
- **Backup & Recovery**: Daily DB backups, restorable
- **Localization**: JSON-based string files for i18n

---

## 8. Sequence Diagrams & Flowcharts

> See original section for visitor/HelpDesk flows. Billing/accounting flows follow similar patterns, with audit trail and notification steps for all key actions.

---


## Notification & Meetings Enhancements
- Users can mark all notifications as read with a single action (PATCH endpoint)
- Dashboard only shows future meetings for all users

---

## 9. Additional/Planned Features & Implementation Status

The following features and UI components are present in the codebase but may be partially implemented, experimental, or planned for future releases. Their status is as follows:

- **Bill Email Logs**
  - Admin UI for viewing bill email logs (filter by billId, userId, status, etc.)
  - _Status: To be implemented_

- **Bill Emailing**
  - UI/UX for emailing a bill to a resident
  - _Status: To be implemented_

- **Bill/Report Download**
  - UI/UX for downloading bills and admin financial reports (PDF/CSV)
  - _Status: To be implemented_

---

**Note:**
- Some features may be stubs or under development. For the most current and complete list, refer to the codebase or contact the technical team.
- See also: API Documentation for endpoint details.
