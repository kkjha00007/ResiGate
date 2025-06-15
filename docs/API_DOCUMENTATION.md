ResiGate API Documentation
==========================

 **Base URL**  
 All endpoints are prefixed with:  
> ```
> https://<your-domain-or-host>/api/v1
> ```  
 (e.g. `https://resi-gate.app/api/v1`)

---

1\. Authentication
------------------

### 1.1. Login (Authenticate User)

*   **Endpoint**: POST /auth/login
    
*   **Description**: Given an email and password, returns a JSON Web Token (JWT).
    
*   **Request Headers**:
    
    *   Content-Type: application/json
        
*   **Request Body**:
> ```json
> {
>   "email": "user@example.com",
>   "password": "yourPassword123"
> }
> ```
*   { "token": "", "user": { /\* user profile details \*/ }}
    

### 1.2. Get Authenticated User

*   **Endpoint**: GET /auth/me
    
*   **Description**: Returns the authenticated user's profile (based on session cookie).
    
*   **Request Headers**:
    
    *   Cookie: session=
        
*   { "id": "user-id", "email": "user@example.com", "name": "John Doe", "role": "resident", "exp": 1718000000}
    

### 1.3. Logout

*   **Endpoint**: POST /auth/logout
    
*   **Description**: Logs out the user by clearing the session cookie.
    
*   { "success": true }
    
---
2\. Users
---------

### 2.1. Get Users

*   **Endpoint**: GET /users?societyId=&isApproved=
    
*   **Description**: Get all users for a given society, optionally filtered by approval status.
    
*   \[ { "id": "user-id", "email": "user@example.com", "name": "John Doe", "role": "resident" }\]
    

### 2.2. Register User

*   **Endpoint**: POST /users
    
*   **Description**: Register (create) a new user for a society.
    
*   { "email": "newuser@example.com", "password": "pass123", "name": "Jane Doe", "flatNumber": "A-101", "role": "resident", "societyId": "society-id"}
    
*   { "id": "generated-user-id", "email": "newuser@example.com", "name": "Jane Doe", "role": "resident"}
    
---
3\. Personas
------------

### 3.1. List Personas

*   **Endpoint**: GET /personas?societyId=
    
*   **Description**: List all personas for a society.
    
*   \[ { "id": "persona-id", "societyId": "society-id", "name": "Manager", "description": "Can manage facilities", "roleKeys": \["facility\_manager"\], "featureAccess": {} }\]
    

### 3.2. Create Persona

*   **Endpoint**: POST /personas
    
*   **Description**: Create a new persona.
    
*   { "societyId": "society-id", "name": "Manager", "roleKeys": \["facility\_manager"\]}
    
*   { "id": "generated-persona-id", "societyId": "society-id", "name": "Manager", "roleKeys": \["facility\_manager"\], "featureAccess": {}}
    

### 3.3. Update Persona

*   **Endpoint**: PATCH /personas
    
*   **Description**: Update an existing persona.
    
*   { "id": "persona-id", "societyId": "society-id", "name": "Updated Manager"}
    
*   { "id": "persona-id", "societyId": "society-id", "name": "Updated Manager", "roleKeys": \["facility\_manager"\], "featureAccess": {}}
    

### 3.4. Delete Persona

*   **Endpoint**: DELETE /personas
    
*   **Description**: Delete a persona.
    
*   { "id": "persona-id", "societyId": "society-id"}
    
*   { "success": true}
    
---
4\. HelpDesk
-----------

### 4.1. Create HelpDesk Request

*   **Endpoint**: POST /helpdesk
*   **Description**: Resident creates a new HelpDesk request (ticket).
*   **Request Body (form-data)**:
    *   category: string
    *   description: string
    *   urgent: 'true' | 'false'
    *   document: file (optional)
    *   photo: file (optional)
*   **Response**: { "success": true }

### 4.2. List My HelpDesk Requests

*   **Endpoint**: GET /helpdesk
*   **Description**: Resident fetches their own HelpDesk requests (optionally filter by status).
*   **Query Params**: status (optional: 'open' | 'resolved')
*   **Response**: Array of HelpDeskRequest objects

### 4.3. Get HelpDesk Request (Admin/Owner)

*   **Endpoint**: GET /helpdesk/{id}
*   **Description**: Fetch a single HelpDesk request by ID (admin or owner only).
*   **Response**: HelpDeskRequest object

### 4.4. Update HelpDesk Request (Edit/Resolve)

*   **Endpoint**: PUT /helpdesk/{id}
*   **Description**: Edit (owner) or resolve (admin) a HelpDesk request.
*   **Request Body**: { description?, category?, urgent?, status? }
*   **Response**: Updated HelpDeskRequest object

### 4.5. Delete HelpDesk Request

*   **Endpoint**: DELETE /helpdesk/{id}
*   **Description**: Delete a HelpDesk request (owner or admin).
*   **Response**: { "success": true }

### 4.6. Add Comment to HelpDesk Request (Admin)

*   **Endpoint**: POST /helpdesk/{id}/comment
*   **Description**: Add a comment to a HelpDesk request (admin only).
*   **Request Body**: { comment: string }
*   **Response**: Updated HelpDeskRequest object (with new comment)

---
5\. Facilities
--------------

### 5.1. List Facilities

*   **Endpoint**: GET /facilities?societyId=
    
*   **Description**: Get all facilities in a society.
    
*   \[ { "id": "facility-id", "name": "Gym", "capacity": 50, "societyId": "society-id", "isActive": true }\]
    

### 5.2. Create Facility

*   **Endpoint**: POST /facilities
    
*   **Description**: Create a new facility.
    
*   { "name": "Swimming Pool", "capacity": 30, "societyId": "society-id"}
    
*   { "id": "facility-id", "name": "Swimming Pool", "capacity": 30, "societyId": "society-id", "isActive": true}
    
---
6\. Parking
-----------

### 6.1. List Parking Spots

*   **Endpoint**: GET /parking/spots?societyId=
    
*   **Description**: List all parking spots in a society.
    
*   \[ { "id": "spot-id", "societyId": "society-id", "spotNumber": "P-1", "type": "covered", "status": "available" }\]
    

### 6.2. Create Parking Spot

*   **Endpoint**: POST /parking/spots
    
*   **Description**: Create a new parking spot.
    
*   { "spotNumber": "P-2", "type": "open", "location": "Block A", "societyId": "society-id"}
    
*   { "id": "spot-id", "spotNumber": "P-2", "type": "open", "location": "Block A", "status": "available", "societyId": "society-id"}
    
---
7\. Notices
-----------

### 7.1. List Notices

*   **Endpoint**: GET /notices?societyId=
    
*   **Description**: List all notices for a society.
    
*   \[ { "id": "notice-id", "societyId": "society-id", "title": "Water supply maintenance", "content": "Water will be off on Sunday.", "postedByUserId": "user-id", "postedByName": "John Admin", "createdAt": "2025-06-03T00:00:00.000Z", "isActive": true }\]
    

### 7.2. Create Notice

*   **Endpoint**: POST /notices
    
*   **Description**: Create a new notice.
    
*   { "title": "Water supply maintenance", "content": "Water will be off on Sunday.", "postedByUserId": "user-id", "postedByName": "John Admin", "societyId": "society-id"}
    
*   { "id": "notice-id", "societyId": "society-id", "title": "Water supply maintenance", "content": "Water will be off on Sunday.", "postedByUserId": "user-id", "postedByName": "John Admin", "createdAt": "2025-06-03T00:00:00.000Z", "isActive": true}
    
---
8\. Security Incidents (currently disabled)
-------------------------------------------

*   **Endpoint**: POST /security-incidents
    
*   **Description**: Not implemented. Always returns 404.
    
*   { "message": "Security incident reporting is currently disabled." }
    

---
9\. Notifications API
---------------------

### PATCH /api/notifications/mark-all-read
- **Description:** Marks all notifications as read for the current user.
- **Method:** PATCH
- **Request Body:** _none_
- **Headers:**
  - `Authorization` (if required)
- **Response:**
  - 200 OK: `{ success: true }`
  - 401/403: Unauthorized/Forbidden

#### Example
```http
PATCH /api/notifications/mark-all-read
```

### Notification Read Logic
- The frontend now uses this endpoint to mark all notifications as read in a single request, ensuring notifications do not reappear after a refresh.
- If the endpoint is not available, the frontend falls back to marking each notification as read individually.

---
10\. Meetings API
----------------

- The dashboard's "Upcoming Meetings" now only shows meetings with a start time in the future for all users. Expired meetings are always excluded.

**Note:**

*   Some endpoints may require authentication via session cookie or JWT in headers.
    
*   More endpoints may exist. For complete coverage, see the [full list in the code search](https://github.com/kkjha00007/ResiGate/search?q=/api/v1).

---

## 11. Maintenance Billing & Accounting API (2025)

### 11.1. Billing Config (Admin)
- **GET** `/billing/config?societyId=...` — Get current billing config for a society
- **POST** `/billing/config` — Create/update billing config (see fields below)
  - **Body:**
    ```json
    {
      "societyId": "society-id",
      "categories": [ ... ],
      "flatTypes": [ ... ],
      "effectiveFrom": "YYYY-MM-DD",
      "interestRules": { ... },
      "penaltyRules": { ... },
      ...
    }
    ```
  - **interestRules**: `{ enabled, daysAfterDue, rateType, amount, compounding, maxAmount, perCategory, description }`
  - **penaltyRules**: `{ latePayment: { enabled, daysAfterDue, rateType, amount, maxAmount, description } }`

### 11.2. Bill Generation
- **POST** `/billing/bills` — Generate bills (single/multi-period)
  - **Body:**
    ```json
    {
      "action": "generate",
      "societyId": "society-id",
      "periods": ["2025-06", "2025-07"],
      "dueDate": "2025-06-30",
      "flats": [ { "flatNumber": "A-101", ... } ],
      ...
    }
    ```
  - **Response:** Array of `MaintenanceBill` objects, each with:
    - `amount`, `breakdown`, `discountAmount`, `penaltyAmount`, `interestAmount`, `waiverAmount`, `adHocCharges`, `auditTrail`, etc.
    - `interestAmount` and `interestReason` are auto-calculated for overdue bills as per config.

### 11.3. Payments
- **POST** `/billing/payments` — Record a payment
- **GET** `/billing/payments?societyId=...` — List payments (with filters)

### 11.4. Expenses
- **POST** `/billing/expenses` — Record an expense
- **GET** `/billing/expenses?societyId=...` — List expenses (with filters)

### 11.5. Bill Reminders
- **POST** `/billing/bills/reminders` — Trigger reminders for unpaid/overdue bills (admin or resident)
- **POST** `/billing/bills/reminders/schedule` — Set user-level reminder schedule (resident)
- **GET** `/billing/bills/reminders/schedule?societyId=...&userId=...` — Get reminder schedule

### 11.6. Disputes
- **POST** `/billing/bills/[billId]/dispute` — Resident raises a dispute/query on a bill
- **GET** `/billing/bills/disputes?societyId=...` — Admin views all disputes
- **POST** `/helpdesk/[id]/comment` — Admin adds comment to dispute
- **PUT** `/helpdesk/[id]` — Admin resolves dispute

### 11.7. Audit Trail
- All bill/config changes are logged in `auditTrail` arrays (see response objects)
- **GET** `/billing/bills?societyId=...` — Returns bills with full audit trail

### 11.8. ERP/Accounting Export
- **GET** `/billing/bills/export?format=csv|pdf` — Export all bills
- **GET** `/billing/payments/export?format=csv|pdf` — Export all payments
- **GET** `/billing/expenses/export?format=csv|pdf` — Export all expenses

### 11.9. Advanced Reporting
- **GET** `/billing/reports?societyId=...&period=...&userId=...` — Get live analytics (income, expenses, dues, payment status, etc.)

### 11.10. Notification & Reminder APIs
- **POST** `/notifications` — Send notification (in-app/email/real-time)
- **PATCH** `/notifications/mark-all-read` — Mark all notifications as read

---

## Key Data Models (2025)

### MaintenanceBill
```json
{
  "id": "...",
  "societyId": "...",
  "flatNumber": "A-101",
  "userId": "...",
  "period": "2025-06",
  "amount": 2500,
  "dueDate": "2025-06-30",
  "status": "unpaid",
  "breakdown": { "maintenance": 2000, "sinkingFund": 500 },
  "discountAmount": 0,
  "penaltyAmount": 0,
  "interestAmount": 50, // NEW: interest on overdue
  "waiverAmount": 0,
  "adHocCharges": [],
  "auditTrail": [ ... ],
  ...
}
```

### SocietyBillingConfig
```json
{
  "id": "...",
  "societyId": "...",
  "categories": [ ... ],
  "flatTypes": [ ... ],
  "effectiveFrom": "2025-06-01",
  "interestRules": {
    "enabled": true,
    "daysAfterDue": 5,
    "rateType": "percent",
    "amount": 2,
    "compounding": "monthly",
    "maxAmount": 500,
    "perCategory": false,
    "description": "2% per month after 5 days grace"
  },
  ...
}
```

---

## See also: Functional Documentation for workflows and UI details.
