# ResiGate – Society Management System for Residential Communities

> **Version**: 2.0  
> **Last Updated**: June 15, 2025

ResiGate is a **comprehensive society management system** built with **Next.js**, designed for modern residential communities. It covers everything from visitor management to robust maintenance billing/accounting, resident/admin self-service, notifications, reminders, dispute management, ERP export, and advanced analytics. With role-based access, real-time notifications, and a responsive UI, ResiGate empowers administrators, residents, and security guards to manage all aspects of society life efficiently.

---

## 🚀 Key Features

- **Visitor Management**: Registration, check-in/out, notifications, security dashboard
- **Resident & Society Management**: Resident profiles, admin controls, committee, vendors, parking, meetings, notices
- **Maintenance Billing & Accounting**: Automated, configurable billing, payments, expenses, audit trails, ERP export, and advanced reporting
- **Notifications & Reminders**: In-app, email, and real-time notifications for bills, payments, reminders, disputes, and more
- **Resident Self-Service**: Residents can view/download bills/receipts, raise disputes, set reminders, and track payments
- **Admin Management**: Full admin UI for billing, payments, expenses, disputes, reporting, and configuration
- **Interest on Overdue**: Configurable per society/category, auto-calculated and shown on bills
- **ERP/Accounting Export**: CSV/PDF export for all major data
- **Advanced Analytics**: Live dashboards for income, expenses, dues, and more

---

## 👥 User Roles & Access

| Role          | Key Capabilities |
|---------------|------------------|
| **SuperAdmin** | Manage all societies, users, billing, audit logs, and settings |
| **SocietyAdmin** | Manage residents, billing, payments, expenses, disputes, reminders, config, and reporting |
| **Resident (Owner/Renter)** | View/download bills/receipts, raise disputes, set reminders, view payment/expense reports |
| **Guard** | Register, check in/out visitors, validate gate passes, view dashboard |
| **Guest** | Public landing, public visitor entry (optional) |

---

## 🔄 Workflows

### ✅ Maintenance Billing & Accounting
- Admin configures billing template (categories, rates, interest, penalty, discounts, waivers, etc.)
- Admin generates bills (single or multi-period) for all or selected flats
- System applies correct config, calculates category-wise charges, discounts, waivers, penalties, interest (on overdue), and ad-hoc charges
- Residents receive notifications and can view/download bills, see breakdowns, and pay
- Advance/Credit: Advance payments are tracked and auto-applied to future bills
- Interest: Overdue bills accrue interest as per config (fixed/percent, compounding, grace, max, per-category)
- Audit Trail: All bill/config changes are logged and viewable by admins
- ERP Export: Admins can export all billing/accounting data for external accounting/ERP

### ✅ Resident Self-Service
- View/download all bills and receipts (CSV/PDF)
- See current advance/credit balance
- Raise disputes/queries on bills (integrated with HelpDesk)
- Set or trigger reminders for unpaid/overdue bills (manual or scheduled)
- Get notified of new bills, payments, reminders, and dispute updates

### ✅ Admin Dispute Management
- View all bill disputes/queries
- Add comments, resolve, or escalate
- All actions are logged in the audit trail

### ✅ Notification & Reminder System
- In-app, email, and real-time (WebSocket) notifications for all billing/accounting events
- Residents can set their own reminder schedule (day/hour/minute) for unpaid/overdue bills
- Admins can trigger reminders for all or selected users
- All reminders are logged and can be viewed in the UI

### ✅ Advanced Reporting & Analytics
- Visual dashboards for income, expenses, outstanding dues, payment status
- Live data with filters (period, user, category)
- Exportable as CSV/PDF

---

## 🖥️ Tech Stack & Integrations

- **Frontend**: Next.js
- **Backend**: Node.js APIs
- **Database**: CosmosDB
- **Notifications**: NodeMailer (email), WebSocket (real-time)
- **Authentication**: JWT, bcrypt
- **Reporting/Export**: Chart.js, jsPDF, CSV
- **Scheduling**: node-cron (in-process reminders)

---

## For full details, see the documentation in `/docs`.

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙌 Contribution Guidelines

We welcome contributions!

- Fork the repository
- Create a new branch
- Commit your changes
- Open a pull request

---

## 📧 Feedback & Contact

Have suggestions or feature requests? Open an issue or reach out to [kkjha00007](https://github.com/kkjha00007).
