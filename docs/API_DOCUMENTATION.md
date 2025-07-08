ResiGate API Documentation
==========================

 **Base URL**  
 All endpoints are prefixed with:  
> ```
> https://<your-domain-or-host>/api/v1
> ```  
 (e.g. `https://resi-gate.app/api/v1`)

---



## Consolidated API Coverage Table

| Feature/Module         | Endpoint(s)                                         | Methods Enabled         | Description                                 | Society/User Filter |
|-----------------------|-----------------------------------------------------|------------------------|---------------------------------------------|--------------------|
| **Feature Flags**      | /feature-flags                                      | GET                    | Get all feature flags for a society                                 | Society         |
| **Feature Flags**      | /feature-flags                                      | POST                   | Create a new feature flag                                           | Society         |
| **Feature Flags**      | /feature-flags/{key}                                | PUT                    | Update a specific feature flag                                       | Society         |
| **Feature Flags**      | /feature-flags/{key}                                | DELETE                 | Delete a feature flag                                                | Society         |
| **Feature Flags**      | /feature-flags/{key}/permissions                    | GET                    | Get permissions matrix for a feature flag                            | Society         |
| **Feature Flags**      | /feature-flags/{key}/permissions                    | PUT                    | Update permissions matrix for a feature flag                         | Society         |
| **Feature Flags**      | /feature-flags/health                               | GET                    | Health check for feature flags system                               | Global          |
| **Feature Flags**      | /feature-flags/health                               | POST                   | Initialize feature flags system                                      | Society         |
| **Feature Flags**      | /rbac/roles                                         | GET                    | Get all role groups and names for permissions matrix                 | Global          |
| **Feature Flags**      | /audit-logs                                         | GET                    | Get audit/history logs for a feature flag                            | Society         |
| Parking Management   | /parking/my-spots                                   | GET                    | Get parking spots assigned to the authenticated user            | User            |
| Parking Management   | /parking/requests                                   | GET                    | List all parking requests (admin)                                   | Society/User |
| Parking Management   | /parking/requests                                   | POST                   | Create a new parking request                                        | Society/User |
| Facilities           | /facilities/[facilityId]                            | GET                    | Get a specific facility by ID                                        | Society         |
| Facilities           | /facilities/[facilityId]                            | PUT                    | Update a specific facility by ID                                     | Society         |
| Facilities           | /facilities/[facilityId]                            | DELETE                 | Delete a specific facility by ID                                     | Society         |
| Users                | /users/residents                                    | GET                    | Get all approved residents (owners and renters)                     | Society         |
| Gate Pass            | /gate-passes/user/[userId]                          | GET                    | Get gate passes for a specific user                                 | User/Society       |
| Settings             | /settings/payment-details                           | GET                    | Get society payment details                                         | Society            |
| Settings             | /settings/payment-details                           | POST                   | Create society payment details                                      | Society            |
| Settings             | /settings/payment-details                           | PUT                    | Update society payment details                                       | Society            |
| SOS                  | /sos                                                | POST                   | Raise an SOS alert                                                  | User/Society       |
| Visitor Management   | /visitors/{id}/approve                              | POST                   | Approve a visitor (guard/admin)                                     | Society/User       |
| Visitor Management   | /visitors/{id}/deny                                 | POST                   | Deny a visitor (guard/admin)                                        | Society/User       |
| Visitor Management   | /visitors/{id}                                      | PATCH                  | Update visitor status (check-in/check-out)                          | Society/User       |
| Visitor Management   | /gate-passes                                        | POST                   | Generate a gate pass with QR code                                   | Society/User       |
| Visitor Management   | /gate-passes/{passId}                               | GET                    | Get gate pass details                                               | Society/User       |
| Visitor Management   | /gate-passes/by-token/{tokenCode}                   | GET                    | Validate gate pass by QR code                                       | Society/User       |
| Visitor Management   | /visitors/photo-upload                              | POST                   | Upload visitor photo (Enhancement required)                         | Society/User       |
| Facility Booking     | /facilities/{id}/bookings/{bookingId}/approve       | POST                   | Approve a facility booking (Enhancement required)                   | Society/User   |
| Facility Booking     | /facilities/{id}/bookings/{bookingId}/reject        | POST                   | Reject a facility booking (Enhancement required)                    | Society/User   |
| Facility Booking     | /facilities/{id}/bookings/{bookingId}/cancel        | POST                   | Cancel a facility booking (Enhancement required)                    | Society/User   |
| Parking Management   | /parking/vehicles                                   | GET                    | List registered vehicles (Enhancement required)                     | Society/User |
| Parking Management   | /parking/vehicles                                   | POST                   | Register a new vehicle (Enhancement required)                       | Society/User |
| Parking Management   | /parking/vehicles                                   | PUT                    | Update vehicle details (Enhancement required)                       | Society/User |
| Parking Management   | /parking/vehicles                                   | DELETE                 | Delete a registered vehicle (Enhancement required)                  | Society/User |
| Notifications        | /notifications                                      | GET                    | List/view notifications                                              | User/Society       |
| Notifications        | /notifications/device-token                         | POST                   | Register device token for push notifications (Enhancement required) | User/Society |
| Document Management  | /documents                                          | GET                    | List society documents (Enhancement required)                       | Society      |
| Document Management  | /documents                                          | POST                   | Upload a society document (Enhancement required)                    | Society      |
| Document Management  | /documents/{id}/download                            | GET                    | Download a society document (Enhancement required)                  | Society      |
| Committee Management | /committee-members                                  | GET                    | List committee members                                               | Society            |
| Committee Management | /committee-members                                  | POST                   | Add a committee member                                               | Society            |
| Committee Management | /committee-members                                  | PUT                    | Update committee member details                                      | Society            |
| Committee Management | /committee-members                                  | DELETE                 | Remove a committee member                                            | Society            |
| Vendor Management    | /vendors                                            | GET                    | List vendors                                                         | Society            |
| Visitor Management   | /public-visitors                                    | GET                    | List all public visitor entries                                      | Society            |
| Visitor Management   | /public-visitors                                    | POST                   | Create a new public visitor entry                                    | Society            |
| Visitor Management   | /visitors                                           | GET                    | List all visitors for a society/user                                 | Society/User       |
| Visitor Management   | /visitors                                           | POST                   | Create a new visitor entry                                           | Society/User       |
| Visitor Management   | /visitors/{id}                                      | PUT                    | Update a visitor entry                                               | Society/User       |
| Visitor Management   | /visitors/{id}                                      | DELETE                 | Delete a visitor entry                                               | Society/User       |
| Guard Dashboard      | /dashboard                                          | GET                    | Get guard dashboard summary                                          | User/Society       |
| Guard Dashboard      | /dashboard/visitors                                 | GET                    | List visitors for guard dashboard                                    | User/Society       |
| Guard Dashboard      | /dashboard/notifications                            | GET                    | List notifications for guard dashboard                               | User/Society       |
| Facility Booking     | /facilities                                         | GET                    | List all facilities in a society                                     | Society            |
| Facility Booking     | /facilities                                         | POST                   | Create a new facility                                                | Society            |
| Facility Booking     | /facilities/{id}/bookings                           | GET                    | List bookings for a facility                                         | Society/User       |
| Facility Booking     | /facilities/{id}/bookings                           | POST                   | Create a new facility booking                                        | Society/User       |
| Facility Booking     | /facilities/{id}/bookings/{bookingId}               | PUT                    | Update a facility booking                                            | Society/User       |
| Facility Booking     | /facilities/{id}/bookings/{bookingId}               | DELETE                 | Cancel a facility booking                                            | Society/User       |
| Authentication       | /auth/login                                         | POST                   | Login with email and password, returns JWT                           | User               |
| Authentication       | /auth/me                                            | GET                    | Get authenticated user profile                                       | User               |
| Authentication       | /auth/logout                                        | POST                   | Logout user and clear session                                        | User               |
| Users                | /users                                              | GET                    | List users for a society (with filters)                              | Society            |
| Users                | /users                                              | POST                   | Register (create) a new user                                         | Society            |
| Personas             | /personas                                           | GET                    | List all personas for a society                                      | Society            |
| Personas             | /personas                                           | POST                   | Create a new persona                                                 | Society            |
| Personas             | /personas                                           | PATCH                  | Update an existing persona                                           | Society            |
| Personas             | /personas                                           | DELETE                 | Delete a persona                                                     | Society            |
| HelpDesk             | /helpdesk                                           | GET                    | List my HelpDesk requests                                            | User/Society       |
| HelpDesk             | /helpdesk                                           | POST                   | Create a new HelpDesk request                                        | User/Society       |
| HelpDesk             | /helpdesk/{id}                                      | GET                    | Get a single HelpDesk request (admin/owner)                         | User/Society       |
| HelpDesk             | /helpdesk/{id}                                      | PUT                    | Edit or resolve a HelpDesk request                                   | User/Society       |
| HelpDesk             | /helpdesk/{id}                                      | DELETE                 | Delete a HelpDesk request                                            | User/Society       |
| HelpDesk             | /helpdesk/{id}/comment                              | POST                   | Add comment to HelpDesk request (admin)                              | User/Society       |
| Facilities           | /facilities                                         | GET                    | List all facilities in a society                                     | Society            |
| Facilities           | /facilities                                         | POST                   | Create a new facility                                                | Society            |
| Parking              | /parking/spots                                      | GET                    | List all parking spots in a society                                  | Society            |
| Parking              | /parking/spots                                      | POST                   | Create a new parking spot                                            | Society            |
| Parking              | /parking/spots/[spotId]                             | PUT                    | Update a parking spot                                                | Society            |
| Parking              | /parking/spots/[spotId]                             | DELETE                 | Delete a parking spot                                                | Society            |
| Notices              | /notices                                            | GET                    | List all notices for a society                                       | Society            |
| Notices              | /notices                                            | POST                   | Create a new notice                                                  | Society            |
| Notices              | /notices/{id}                                       | PUT                    | Update a notice                                                      | Society            |
| Security Incidents   | /security-incidents                                 | POST                   | Report security incident (currently disabled)                        | Society           |
| Notifications        | /notifications/mark-all-read                        | PATCH                  | Mark all notifications as read                                       | User               |
| Meetings             | /meetings                                           | GET                    | List meetings (future only)                                          | Society            |
| Billing Config       | /billing/config                                     | GET                    | Get current billing config for a society                             | Society            |
| Billing Config       | /billing/config                                     | POST                   | Create/update billing config                                         | Society            |
| Bills                | /billing/bills                                      | GET                    | List all bills for a society/user                                    | Society/User       |
| Bills                | /billing/bills                                      | POST                   | Generate bills (single/multi-period)                                 | Society/User       |
| Bills                | /billing/bills/[billId]/dispute                     | POST                   | Raise a dispute/query on a bill                                      | Society/User       |
| Bills                | /billing/bills/disputes                             | GET                    | Admin views all disputes                                             | Society/User       |
| Payments             | /billing/payments                                   | GET                    | List payments (with filters)                                         | Society/User       |
| Payments             | /billing/payments                                   | POST                   | Record a payment                                                     | Society/User       |
| Expenses             | /billing/expenses                                   | GET                    | List expenses (with filters)                                         | Society            |
| Expenses             | /billing/expenses                                   | POST                   | Record an expense                                                    | Society            |
| Bill Reminders       | /billing/bills/reminders                            | POST                   | Trigger reminders for unpaid/overdue bills                           | Society/User       |
| Bill Reminders       | /billing/bills/reminders/schedule                   | POST                   | Set user-level reminder schedule                                     | Society/User       |
| Bill Reminders       | /billing/bills/reminders/schedule                   | GET                    | Get reminder schedule                                                | Society/User       |
| Audit Trail          | /billing/bills                                      | GET                    | Returns bills with full audit trail                                  | Society/User       |
| ERP/Accounting Export| /billing/bills/export                               | GET                    | Export all bills (csv/pdf)                                           | Society            |
| ERP/Accounting Export| /billing/payments/export                            | GET                    | Export all payments (csv/pdf)                                        | Society            |
| ERP/Accounting Export| /billing/expenses/export                            | GET                    | Export all expenses (csv/pdf)                                        | Society            |
| Advanced Reporting   | /billing/reports                                    | GET                    | Get live analytics (income, expenses, dues)                          | Society            |
| Notification/Reminder| /notifications                                      | POST                   | Send notification (in-app/email/real-time)                           | User/Society       |
| Additional/Planned   | /billing/bills/email-log                            | GET                    | List bill email logs (admin view)                                    | Society            |
| Additional/Planned   | /billing/bills/email-log                            | POST                   | Create a new bill email log entry                                    | Society            |
| Additional/Planned   | /billing/bills/email                                | POST                   | Email a bill to a resident                                           | Society            |
| Additional/Planned   | /billing/bills/download                             | GET                    | Download bills for a period                                          | Society            |
| Additional/Planned   | /billing/reports/download                           | GET                    | Download admin financial reports                                     | Society            |
| RBAC Management      | /rbac/permissions                                   | GET                    | Get effective permissions for current user                           | User               |
| RBAC Management      | /rbac/roles                                         | GET                    | Get user roles and associations                                      | User               |
| RBAC Management      | /rbac/roles                                         | POST                   | Assign roles to users (admin only)                                   | Admin              |
| RBAC Management      | /rbac/permissions/update                            | POST                   | Update custom permissions for role associations                      | Admin              |
| RBAC Management      | /rbac/migrate                                       | POST                   | Migrate existing users to new RBAC structure                        | Admin              |
| RBAC Management      | /rbac/feature-settings                              | GET                    | Get feature access settings by role group                           | Admin              |
| RBAC Management      | /rbac/feature-settings                              | POST                   | Update feature access settings                                       | Admin              |
| RBAC Management      | /rbac/demo-users                                    | POST                   | Create demo users for all roles (testing)                           | Admin              |

### Format: Each endpoint below is listed as:

#### [METHOD] [ENDPOINT]
**Request:**
```json
// Example request body or parameters (if applicable)
```
**Response:**
```json
// Example response body
```
**Filter:** [User-based | Society-based | Society/User | ...]

---

#### POST /auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "yourPassword123"
}
```
**Response:**
```json
{
  "token": "...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "resident"
  }
}
```
**Filter:** User-based

#### GET /auth/me
**Request:** (Cookie: session=)
**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "resident",
  "exp": 1718000000
}
```
**Filter:** User-based

#### POST /auth/logout
**Request:** (Cookie: session=)
**Response:**
```json
{
  "success": true
}
```
**Filter:** User-based

#### GET /users?societyId=&isApproved=
**Request:** (Query params: societyId, isApproved)
**Response:**
```json
[
  { "id": "user-id", "email": "user@example.com", "name": "John Doe", "role": "resident" }
]
```
**Filter:** Society-based

#### POST /users
**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "pass123",
  "name": "Jane Doe",
  "flatNumber": "A-101",
  "role": "resident",
  "societyId": "society-id"
}
```
**Response:**
```json
{
  "id": "generated-user-id",
  "email": "newuser@example.com",
  "name": "Jane Doe",
  "role": "resident"
}
```
**Filter:** Society-based

#### GET /users/residents
**Request:** (Query param: societyId)
**Response:**
```json
[
  { "id": "user-id", "email": "user@example.com", "name": "John Doe", "role": "resident" }
]
```
**Filter:** Society-based

#### GET /personas?societyId=
**Request:** (Query param: societyId)
**Response:**
```json
[
  { "id": "persona-id", "societyId": "society-id", "name": "Manager", "description": "Can manage facilities", "roleKeys": ["facility_manager"], "featureAccess": {} }
]
```
**Filter:** Society-based

#### POST /personas
**Request:**
```json
{
  "societyId": "society-id",
  "name": "Manager",
  "roleKeys": ["facility_manager"]
}
```
**Response:**
```json
{
  "id": "generated-persona-id",
  "societyId": "society-id",
  "name": "Manager",
  "roleKeys": ["facility_manager"],
  "featureAccess": {}
}
```
**Filter:** Society-based

#### PATCH /personas
**Request:**
```json
{
  "id": "persona-id",
  "societyId": "society-id",
  "name": "Updated Manager"
}
```
**Response:**
```json
{
  "id": "persona-id",
  "societyId": "society-id",
  "name": "Updated Manager",
  "roleKeys": ["facility_manager"],
  "featureAccess": {}
}
```
**Filter:** Society-based

#### DELETE /personas
**Request:**
```json
{
  "id": "persona-id",
  "societyId": "society-id"
}
```
**Response:**
```json
{
  "success": true
}
```
**Filter:** Society-based

#### GET /facilities?societyId=
**Request:** (Query param: societyId)
**Response:**
```json
[
  { "id": "facility-id", "name": "Gym", "capacity": 50, "societyId": "society-id", "isActive": true }
]
```
**Filter:** Society-based

#### POST /facilities
**Request:**
```json
{
  "name": "Swimming Pool",
  "capacity": 30,
  "societyId": "society-id"
}
```
**Response:**
```json
{
  "id": "facility-id",
  "name": "Swimming Pool",
  "capacity": 30,
  "societyId": "society-id",
  "isActive": true
}
```
**Filter:** Society-based

#### GET /facilities/[facilityId]
**Request:** (Path param: facilityId)
**Response:**
```json
{
  "id": "facility-id",
  "name": "Swimming Pool",
  "capacity": 30,
  "societyId": "society-id",
  "isActive": true
}
```
**Filter:** Society-based

#### PUT /facilities/[facilityId]
**Request:**
```json
{
  "name": "Updated Facility Name",
  "capacity": 40
}
```
**Response:**
```json
{
  "id": "facility-id",
  "name": "Updated Facility Name",
  "capacity": 40,
  "societyId": "society-id",
  "isActive": true
}
```
**Filter:** Society-based

#### DELETE /facilities/[facilityId]
**Request:** (Path param: facilityId)
**Response:**
```json
{
  "success": true
}
```
**Filter:** Society-based

#### GET /parking/my-spots
**Request:**
```json
// No body required
```
**Response:**
```json
[
  { "id": "spot-id", "societyId": "society-id", "spotNumber": "P-1", "type": "covered", "status": "available" }
]
```
**Filter:** User-based

#### GET /parking/requests
**Request:**
```json
// No body required
```
**Response:**
```json
[
  { "id": "request-id", "userId": "user-id", "status": "pending", "createdAt": "2025-07-04T00:00:00.000Z" }
]
```
**Filter:** Society/User

#### POST /parking/requests
**Request:**
```json
{
  "userId": "user-id",
  "spotType": "covered"
}
```
**Response:**
```json
{
  "id": "request-id",
  "userId": "user-id",
  "status": "pending",
  "createdAt": "2025-07-04T00:00:00.000Z"
}
```
**Filter:** Society/User

#### GET /parking/vehicles
**Request:**
```json
// No body required
```
**Response:**
```json
[
  { "id": "vehicle-id", "userId": "user-id", "number": "MH12AB1234", "type": "car" }
]
```
**Filter:** Society/User (Enhancement required)

#### POST /parking/vehicles
**Request:**
```json
{
  "userId": "user-id",
  "number": "MH12AB1234",
  "type": "car"
}
```
**Response:**
```json
{
  "id": "vehicle-id",
  "userId": "user-id",
  "number": "MH12AB1234",
  "type": "car"
}
```
**Filter:** Society/User (Enhancement required)

#### PUT /parking/vehicles
**Request:**
```json
{
  "id": "vehicle-id",
  "number": "MH12XY9876"
}
```
**Response:**
```json
{
  "id": "vehicle-id",
  "userId": "user-id",
  "number": "MH12XY9876",
  "type": "car"
}
```
**Filter:** Society/User (Enhancement required)

#### DELETE /parking/vehicles
**Request:**
```json
{
  "id": "vehicle-id"
}
```
**Response:**
```json
{
  "success": true
}
```
**Filter:** Society/User (Enhancement required)

// ... (Add similar blocks for all endpoints in the coverage table, using the above format)
```
**Filter:** Society-based

---

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


---

## 12. Additional/Planned Endpoints & Implementation Status

The following endpoints exist in the codebase but may be partially implemented, experimental, or planned for future releases. Their status is as follows:

- **/billing/bills/email-log**
  - **GET**: List bill email logs (admin view, filter by billId, userId, status, etc.)
  - **POST**: Create a new bill email log entry (called after sending email)
  - _Status: To be implemented_

- **/billing/bills/email**
  - **POST**: Email a bill to a resident
  - _Status: To be implemented_

- **/billing/bills/download**
  - **GET**: Download bills for a period (current, 3, 6, 12 months)
  - _Status: To be implemented_

- **/billing/reports/download**
  - **GET**: Download admin financial reports (bills, payments, expenses)
  - _Status: To be implemented_

---

**Note:**
- Some endpoints may be stubs or under development. For the most current and complete list, refer to the codebase or contact the technical team.
- See also: Functional Documentation for workflows and UI details.

---

## 13. RBAC (Role-Based Access Control) API Endpoints

The RBAC system provides comprehensive role and permission management with support for multi-role, multi-society associations.

### 13.1 Role System Overview

**Role Hierarchy:**
- **Platform Admin**: Owner (App), Ops
- **Society Admin**: Society Admin, Guard  
- **Resident**: Owner Resident, Renter Resident, Member Resident
- **Support**: Staff, API System

**Login-Eligible Roles:** All roles except legacy roles can login to the main application.

### 13.2 Get User Permissions

**Endpoint:** `GET /api/rbac/permissions`

Returns the effective permissions for the current authenticated user.

**Response:**
```json
{
  "permissions": {
    "visitor_management": ["visitor_create", "visitor_read", "visitor_update"],
    "gate_pass_management": ["gate_pass_create", "gate_pass_read"],
    "facility_management": ["facility_read", "facility_book"]
  },
  "roleAssociations": [
    {
      "id": "role-assoc-001",
      "role": "owner_resident",
      "societyId": "society-001",
      "isActive": true,
      "permissions": {
        "visitor_management": ["visitor_create", "visitor_read", "visitor_update"]
      }
    }
  ]
}
```

### 13.3 Role Management

**Endpoint:** `GET /api/rbac/roles`

Get current user's role assignments.

**Endpoint:** `POST /api/rbac/roles`

Assign roles to users (Admin only).

**Request:**
```json
{
  "userId": "user-123",
  "roleAssignments": [
    {
      "role": "society_admin",
      "societyId": "society-001",
      "assignedBy": "admin-user-id"
    }
  ]
}
```

### 13.4 Permission Updates

**Endpoint:** `POST /api/rbac/permissions/update`

Update custom permissions for specific role associations (Admin only).

**Request:**
```json
{
  "roleAssociationId": "role-assoc-001",
  "customPermissions": {
    "visitor_management": ["visitor_create", "visitor_read"],
    "facility_management": ["facility_read"]
  }
}
```

### 13.5 User Migration

**Endpoint:** `POST /api/rbac/migrate`

Migrate existing users from legacy role structure to new RBAC system.

**Request:**
```json
{
  "batchSize": 50,
  "dryRun": false
}
```

### 13.6 Feature Access Control

**Endpoint:** `GET /api/rbac/feature-settings`

Get feature access settings by role group and society.

**Endpoint:** `POST /api/rbac/feature-settings`

Update feature access settings (Owner App/Ops only).

**Request:**
```json
{
  "societyId": "society-001",
  "roleGroup": "RESIDENT", 
  "featureSettings": {
    "visitor_management": {
      "enabled": true,
      "permissions": ["visitor_create", "visitor_read", "visitor_update"]
    },
    "facility_management": {
      "enabled": false,
      "permissions": []
    }
  }
}
```

### 13.7 Demo User Creation

**Endpoint:** `POST /api/rbac/demo-users`

Create demo users for all roles for testing purposes.

**Request:**
```json
{
  "societyId": "society-demo-001",
  "prefix": "demo"
}
```

**Response:**
```json
{
  "message": "Demo users created successfully",
  "users": [
    {
      "role": "owner_app",
      "email": "demo.owner.app@example.com",
      "password": "demo123",
      "name": "Demo Owner App"
    },
    {
      "role": "society_admin", 
      "email": "demo.society.admin@example.com",
      "password": "demo123",
      "name": "Demo Society Admin"
    }
  ]
}
```

### 13.8 Permission Enforcement

All protected endpoints automatically enforce RBAC permissions using middleware. Unauthorized access returns:

```json
{
  "error": "Insufficient permissions",
  "required": ["visitor_create"],
  "userPermissions": ["visitor_read"],

## 14. Feature Flags Management

The Feature Flags system provides dynamic feature control with environment, role, pricing tier, permissions matrix, and A/B testing support. All changes are fully auditable.

### 14.1 Get All Feature Flags

**Endpoint:** `GET /api/feature-flags`

Retrieves all feature flags for a specific society.

**Query Parameters:**
- `societyId` (optional): Society ID (defaults to "global")

**Response:**
```json
[
  {
    "key": "visitor_management",
    "name": "Visitor Management",
    "description": "Basic visitor registration and tracking",
    "enabled": true,
    "environments": {
      "dev": true,
      "prod": true,
      "demo": false
    },
    "roles": {
      "society_admin": true,
      "guard": true,
      "owner_resident": false
    },
    "tiers": {
      "free": true,
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
    "permissions": {
      "PLATFORM_ADMIN": ["Create", "Read", "Update", "Delete"],
      "SOCIETY_ADMIN": ["Read", "Update"],
      "RESIDENT": ["Read"]
    },
    "createdAt": "2025-07-08T10:00:00Z",
    "updatedAt": "2025-07-08T10:00:00Z",
    "createdBy": "admin",
    "modifiedBy": "admin"
  }
]
```
**Filter:** Society-based

### 14.2 Create Feature Flag

**Endpoint:** `POST /api/feature-flags`

Creates a new feature flag.

**Request:**
```json
{
  "key": "billing_management",
  "name": "Billing Management",
  "description": "Advanced billing and payment tracking",
  "enabled": true,
  "environments": {
    "dev": true,
    "prod": true,
    "demo": false
  },
  "roles": {
    "society_admin": true,
    "owner_resident": true
  },
  "tiers": {
    "free": false,
    "premium": true,
    "enterprise": true
  },
  "abTestConfig": {
    "enabled": false,
    "groups": {}
  },
  "permissions": {
    "PLATFORM_ADMIN": ["Create", "Read", "Update", "Delete"],
    "SOCIETY_ADMIN": ["Read", "Update"],
    "RESIDENT": ["Read"]
  }
}
```
**Response:**
```json
{
  "success": true,
  "flag": { /* feature flag object */ }
}
```
**Filter:** Society-based

### 14.3 Update Feature Flag

**Endpoint:** `PUT /api/feature-flags/{key}`

Updates an existing feature flag.

**Request:**
```json
{
  "name": "Visitor Management",
  "description": "Updated description",
  "enabled": false,
  "environments": {
    "dev": true,
    "prod": false,
    "demo": true
  },
  "roles": {
    "society_admin": true,
    "guard": true
  },
  "tiers": {
    "free": true,
    "premium": true,
    "enterprise": true
  },
  "abTestConfig": {
    "enabled": true,
    "groups": {
      "A": { "percentage": 50, "enabled": true },
      "B": { "percentage": 50, "enabled": false }
    }
  },
  "permissions": {
    "PLATFORM_ADMIN": ["Create", "Read", "Update", "Delete"],
    "SOCIETY_ADMIN": ["Read", "Update"],
    "RESIDENT": ["Read"]
  }
}
```
**Response:**
```json
{
  "success": true,
  "flag": { /* feature flag object */ }
}
```
**Filter:** Society-based

### 14.4 Delete Feature Flag

**Endpoint:** `DELETE /api/feature-flags/{key}`

Deletes a feature flag.

**Response:**
```json
{
  "success": true
}
```
**Filter:** Society-based

### 14.5 Permissions Matrix

**Endpoint:** `GET /api/feature-flags/{key}/permissions`

Returns the permissions matrix for a feature flag (per role group).

**Response:**
```json
{
  "permissions": {
    "PLATFORM_ADMIN": ["Create", "Read", "Update", "Delete"],
    "SOCIETY_ADMIN": ["Read", "Update"],
    "RESIDENT": ["Read"]
  }
}
```

**Endpoint:** `PUT /api/feature-flags/{key}/permissions`

Updates the permissions matrix for a feature flag.

**Request:**
```json
{
  "permissions": {
    "PLATFORM_ADMIN": ["Create", "Read", "Update", "Delete"],
    "SOCIETY_ADMIN": ["Read", "Update"],
    "RESIDENT": ["Read"]
  }
}
```
**Response:**
```json
{
  "success": true
}
```

### 14.6 Role Groups

**Endpoint:** `GET /api/rbac/roles`

Returns all role groups and their display names for the permissions matrix.

**Response:**
```json
{
  "roleGroups": {
    "PLATFORM_ADMIN": ["Owner (App)", "Ops"],
    "SOCIETY_ADMIN": ["Society Admin", "Guard"],
    "RESIDENT": ["Owner Resident", "Renter Resident", "Member Resident"]
  },
  "roleGroupNames": {
    "PLATFORM_ADMIN": "Platform Admin",
    "SOCIETY_ADMIN": "Society Admin",
    "RESIDENT": "Resident"
  }
}
```

### 14.7 Audit Logs

**Endpoint:** `GET /api/audit-logs?targetType=FeatureFlag&targetId={key}`

Returns audit/history logs for a feature flag, including changes to permissions, pricing, A/B tests, and more.

**Response:**
```json
[
  {
    "id": "log-id",
    "timestamp": "2025-07-08T10:30:00Z",
    "userName": "admin",
    "userRole": "Platform Admin",
    "action": "Updated permissions",
    "details": { "changed": "permissions", "before": {...}, "after": {...} }
  },
  {
    "id": "log-id-2",
    "timestamp": "2025-07-08T10:35:00Z",
    "userName": "admin",
    "userRole": "Platform Admin",
    "action": "Changed pricing tier",
    "details": { "changed": "pricing", "before": {...}, "after": {...} }
  }
]
```

**Filter:** Society-based

### 14.8 Error Responses

Common error responses for feature flag endpoints:

**Invalid Feature Flag Data:**
```json
{
  "error": "Invalid feature flag data",
  "status": 400
}
```

**Feature Flag Not Found:**
```json
{
  "error": "Feature flag not found",
  "status": 404
}
```

**System Initialization Failed:**
```json
{
  "success": false,
  "message": "Failed to initialize feature flags system",
  "error": "Container creation failed"
}
```

  "error": "Container creation failed"
}
```

---

## 15. Authentication & Authorization

All API endpoints require proper authentication and authorization. The system uses JWT tokens with role-based access control.

### 15.1 Authentication Headers

All requests must include:
```
Authorization: Bearer <jwt-token>
```

### 15.2 Permission Enforcement

All protected endpoints automatically enforce RBAC permissions using middleware. Unauthorized access returns:

```json
{
  "error": "Insufficient permissions",
  "required": ["visitor_create"],
  "userPermissions": ["visitor_read"],
  "statusCode": 403
}
```
