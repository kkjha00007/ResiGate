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
4\. Complaints
--------------

### 4.1. Add Reply to Complaint

*   **Endpoint**: POST /complaints/{id}/reply
    
*   **Description**: Add a reply to a complaint.
    
*   { "reply": "Thank you for your feedback.", "societyId": "society-id"}
    
*   { "success": true }
    
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
    

**Note:**

*   Some endpoints may require authentication via session cookie or JWT in headers.
    
*   More endpoints may exist. For complete coverage, see the [full list in the code search](https://github.com/kkjha00007/ResiGate/search?q=/api/v1).
