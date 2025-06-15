# **App Name**: ResiGate

## Core Features (2025):

- Visitor Entry & Dashboard: Register/check-in/out visitors, real-time security dashboard
- Resident & Society Management: Profiles, admin controls, committee, vendors, parking, meetings, notices
- Maintenance Billing & Accounting: Automated, multi-period billing, per-society config, interest/penalty/discounts, audit trail
- Resident Self-Service: View/download bills/receipts, raise disputes, set reminders, see credit/advance balance
- Admin Management: Manage bills, payments, expenses, disputes, config, reporting, ERP export
- Notification System: In-app, email, and real-time notifications for all billing/accounting events
- Reminders: Residents can set/trigger reminders for unpaid/overdue bills (manual/scheduled)
- Dispute Management: Residents raise disputes; admins can view, comment, and resolve
- ERP/Accounting Export: Export all bills, payments, expenses as CSV/PDF
- Advanced Reporting: Live dashboards for income, expenses, dues, payment status, with filters
- Interest on Overdue: Configurable per society/category, auto-calculated and shown on bills
- Audit Trail: All changes to bills/configs are logged and viewable
- Multi-Period/Advance Billing: Generate bills for multiple periods, auto-apply advance/credit
- Versioned Billing Config: Per-society, versioned templates with effective dates
- Real-Time Notification: WebSocket-based instant notifications for key events

## Style Guidelines:

- Primary color: Deep sky blue (#42A5F5) for trustworthiness and technology.
- Background color: Very light blue (#E3F2FD) to provide a calm, neutral backdrop that ensures readability and reduces eye strain.
- Accent color: A shade of blue-green, specifically turquoise (#42C8A4), to signal interactive elements.
- Clean and modern sans-serif font.
- Use flat design icons related to home security and society management.
- Clean and organized layout with clear visual hierarchy.

### Notifications
- PATCH /api/notifications/mark-all-read endpoint to mark all notifications as read for a user.
- Frontend uses this endpoint for the 'Mark all as read' feature, ensuring notifications do not reappear after refresh.
- Real-time notifications for billing, payments, reminders, disputes, and more.

### Dashboard
- Upcoming Meetings section strictly filters out expired meetings for all users.
- Financial dashboards show live income, expenses, dues, and payment status with filters.

### Billing/Accounting
- Admins configure per-society billing templates (categories, rates, interest, penalty, discounts, waivers, etc.)
- Bills auto-calculate interest on overdue, penalties, discounts, waivers, and ad-hoc charges
- Residents and admins have full self-service and management UIs for all billing/accounting features
- All changes are logged in an audit trail and exportable for ERP/accounting