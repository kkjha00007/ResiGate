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
- **Configure granular CRUD permissions** per feature (matrix per role group)
- **Society-specific** feature control
- **Platform-Specific Control**: Enable/disable features for Web and Mobile platforms independently, including per-role toggles for each platform
- **Pricing Tier Control**: Map features to Free, Premium, Enterprise tiers
- **A/B Testing**: Enable, configure, and manage A/B test groups and rollout percentages
- **Audit/History**: View all changes to features, permissions, pricing, and A/B tests in a tabbed audit log
- **Real-time permission and feature updates**

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

## 3. Feature Flag System (Modern FFS)

ResiGate now includes a robust, modern **Feature Flag System (FFS)** that provides:

### 3.1 Feature Flag Capabilities

- **Environment-Based Control**: Different feature availability for dev, prod, and demo environments
- **Role-Based Access Control**: Features can be enabled/disabled based on user roles and permissions matrix (CRUD per role group)
- **Pricing Tier Control**: Features mapped to subscription tiers (free, premium, enterprise)
- **A/B Testing**: Percentage-based and group-based feature rollouts, with group names and enable/disable per group
- **Dynamic Configuration**: Real-time feature toggling without code deployments
- **Audit Trail**: Complete history of feature flag changes, including permissions, pricing, and A/B test changes, viewable in a tabbed UI

### 3.2 Feature Tiers

#### Free Tier
- **Visitor Management**: Basic visitor registration, check-in/out
- **Gate Pass Management**: Simple gate pass creation and tracking
- **Dashboard Access**: Basic resident and guard dashboards
- **Notice Management**: Community notices and announcements
- **Emergency Features**: SOS management and emergency contacts

#### Premium Tier
- **Billing Management**: Advanced billing, payment tracking
- **Facility Management**: Facility booking and management
- **Parking Management**: Parking spot assignment and tracking
- **HelpDesk**: Complaint management and resolution
- **Meeting Management**: Committee meetings and scheduling
- **Committee Management**: Committee member management

#### Enterprise Tier
- **User Management**: Advanced user and role management
- **Settings Management**: System configuration and customization
- **Impersonation**: User impersonation for support
- **Staff Management**: Staff access and management
- **Advanced Analytics**: Detailed reporting and analytics

### 3.3 Feature Flag Administration


#### Web-Only Admin Interface
- **Feature Toggle**: Real-time enable/disable of features
- **Platform-Specific Toggle**: Enable/disable features for Web and Mobile platforms independently, including per-role toggles for each platform
- **Environment Control**: Per-environment feature activation
- **Role-Based Permissions Matrix**: Configure CRUD permissions per role group for each feature
- **Tier Management**: Feature-to-tier mapping configuration (Free, Premium, Enterprise)
- **A/B Test Setup**: Create and manage A/B testing campaigns, groups, and rollout percentages
- **Audit/History Tab**: View all changes to features, permissions, pricing, and A/B tests in a tabbed audit log (All, Permissions, Pricing, A/B Tests)

#### API Management
- **GET /api/feature-flags**: Retrieve all feature flags
- **POST /api/feature-flags**: Create a new feature flag
- **PUT /api/feature-flags/{key}**: Update a specific feature flag
- **DELETE /api/feature-flags/{key}**: Remove a feature flag
- **GET /api/feature-flags/{key}/permissions**: Get permissions matrix for a feature flag
- **PUT /api/feature-flags/{key}/permissions**: Update permissions matrix for a feature flag
- **GET /api/rbac/roles**: Get all role groups and names for permissions matrix
- **GET /api/audit-logs?targetType=FeatureFlag&targetId={key}**: Get audit/history logs for a feature flag
- **GET /api/feature-flags/health**: System health check

#### Database Schema
```sql
-- Feature Flag Container (Cosmos DB)
{
  "id": "feature_key",
  "societyId": "society_id",
  "flag": {
    "key": "feature_key",
    "name": "Display Name",
    "description": "Feature description",
    "enabled": true,
    "environments": {
      "dev": true,
      "prod": true,
      "demo": false
    },
    "roles": {
      "owner_app": true,
      "society_admin": true,
      "owner_resident": false
    },
    "tiers": {
      "free": false,
      "premium": true,
      "enterprise": true
    },
    "abTestConfig": {
      "enabled": true,
      "groups": {
        "control": { "percentage": 50, "enabled": false },
        "test": { "percentage": 50, "enabled": true }
      }
    },
    "createdAt": "2025-07-08T...",
    "updatedAt": "2025-07-08T...",
    "createdBy": "admin",
    "modifiedBy": "admin"
  }
}
```

### 3.4 Feature Flag Usage

#### Server-Side Usage
```typescript
import { isFeatureEnabled, createFeatureContext } from '@/lib/feature-flags';

// Create context
const context = createFeatureContext(user, 'prod', societyId);

// Check feature
const canAccess = await isFeatureEnabled('billing_management', context);
```

#### Client-Side Usage
```tsx
import { useFeatureFlag } from '@/lib/feature-flags-react';

function MyComponent() {
  const { enabled, loading } = useFeatureFlag('visitor_management', context);
  
  if (loading) return <div>Loading...</div>;
  if (!enabled) return <div>Feature not available</div>;
  
  return <div>Feature content</div>;
}
```

#### Component Wrapper
```tsx
import { FeatureFlag } from '@/lib/feature-flags-react';

<FeatureFlag 
  feature="billing_management" 
  context={context}
  fallback={<div>Feature not available</div>}
>
  <BillingComponent />
</FeatureFlag>
```

### 3.5 A/B Testing

#### Configuration
- **Percentage-based**: Split users by percentage
- **Group-based**: Assign specific users to groups
- **Automatic Assignment**: Hash-based consistent assignment
- **Custom Groups**: Named groups with specific configurations
- **Enable/Disable per Group**: Each group can be enabled or disabled

#### Tracking
- **User Groups**: Track which users are in which test groups
- **Performance Metrics**: Monitor feature usage and performance
- **Rollout Control**: Gradual rollout with monitoring

### 3.6 Integration with Existing Systems

#### RBAC Integration
- **Role Permissions**: Feature flags respect existing role permissions
- **Permissions Matrix**: Feature flags can be restricted by CRUD permissions per role group
- **Hierarchy**: Features can be restricted by both role and subscription tier
- **Overrides**: Admin can override feature access per user/role

#### Billing Integration
- **Tier-based Features**: Features automatically enabled/disabled based on subscription
- **Upgrade Prompts**: Automatic prompts for premium features
- **Usage Tracking**: Monitor feature usage for billing purposes

---

## 4. User Roles & Permissions (RBAC System)

ResiGate implements a comprehensive **Role-Based Access Control (RBAC)** system supporting multi-role, multi-society associations with granular permissions.

### 4.1 Role Hierarchy

| Role Group        | Roles                                    | Scope                 | Login Access |
|-------------------|------------------------------------------|-----------------------|--------------|
| **Platform Admin** | Owner (App), Ops                        | Cross-platform        | ✅ Yes       |
| **Society Admin**  | Society Admin, Guard                    | Society-specific      | ✅ Yes       |
| **Resident**       | Owner Resident, Renter Resident, Member Resident | Society/Flat-specific | ✅ Yes       |
| **Support**        | Staff, API System                       | Support/Integration   | ✅ Yes       |

### 4.2 Detailed Role Descriptions

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

### 4.3 Multi-Role Support

- **Users can have multiple roles** across different societies
- **Role associations** define user permissions per society/flat
- **Custom permissions** can override default role permissions
- **Impersonation support** for Staff and Platform Admin roles

### 4.4 Granular Permissions

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

## 4.5. Feature Access Control

Platform Admins (Owner App/Ops) can control feature access per role group per society through the Feature Access Control UI:

- **Enable/Disable** entire feature modules for role groups
- **Configure granular CRUD permissions** per feature
- **Society-specific** feature control
- **Real-time permission updates**

---

## 4.6. Feature Overview

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
