# ResiGate API Documentation

> **Base URL**  
> All endpoints are prefixed with:  
> ```
> https://<your-domain-or-host>/api/v1
> ```  
> (e.g. `https://resi-gate.app/api/v1`)

---

## 1. Authentication

### 1.1. Login (Authenticate User)
- **Endpoint**: `POST /auth/login`
- **Description**: Given an email and password, returns a JSON Web Token (JWT).
- **Request Headers**: 
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourPassword123"
  }
