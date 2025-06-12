# ResiGate – Visitor Management System for Residential Societies

> **Version**: 1.0  
> **Last Updated**: June 3, 2025

ResiGate is a **full-stack visitor management system** built with **Next.js**, designed to simplify and secure visitor entries for residential societies. With role-based access, real-time notifications, and a responsive UI, ResiGate empowers administrators, residents, and security guards to manage visitor data efficiently.

---

## 🚀 Key Features

- **Visitor Registration & Check-In/Out**
- **Instant Notifications to Residents**
- **Resident Profile & Visitor History**
- **Security Dashboard with Real-Time View**
- **Facility Booking & Complaint Management**
- **Committee, Vendor & Parking Management**
- **Role-Based Access Control**
- **Gate Pass Generation & Validation**
- **Admin Configurable Society Settings**

---

## 👥 User Roles & Access

| Role          | Key Capabilities |
|---------------|------------------|
| **SuperAdmin** | Manage all societies, users, and audit logs |
| **SocietyAdmin** | Manage residents, facilities, vendors, and settings in their society |
| **Resident (Owner/Renter)** | View visitors, create gate passes, book facilities, raise complaints |
| **Guard** | Register, check in/out visitors, validate gate passes |
| **Guest** | Public visitor entry (optional) |

---

## 🔄 Workflows

### ✅ Visitor Registration
1. Security enters visitor details.
2. Host gets notified via email/push.
3. Visitor is checked in/out by the guard.

### 🧑‍💼 Resident Management
- Admins add/approve residents.
- Residents view/edit profiles and access their own visit history.

---

## 📊 Admin & Security Dashboards

- View daily visitor list.
- Search/filter visitors.
- Perform quick check-in/out actions.

---

## 🖥️ Tech Stack & Integrations

- **Frontend**: Next.js
- **Backend**: Node.js APIs
- **Database**: MongoDB (Atlas/local)
- **Auth**: JWT (access & refresh tokens)
- **Notifications**: Email via SendGrid/NodeMailer, FCM for push
- **Storage**: Optional support for AWS S3 / Firebase
- **State Management**: React Context or Redux

---

## 📁 Folder Structure

