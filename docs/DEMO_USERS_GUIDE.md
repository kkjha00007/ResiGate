# Demo Users Creation Guide

This guide explains how to create demo users for testing the RBAC system.

## Method 1: Using the API Endpoint Directly

### Prerequisites
- Application server running on `http://localhost:9002`
- Admin access (Owner App or Ops role)

### API Call
```bash
POST /api/rbac/demo-users
Content-Type: application/json

{
  "societyId": "society-demo-001",
  "prefix": "demo"
}
```

### Expected Response
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
      "role": "ops",
      "email": "demo.ops@example.com",
      "password": "demo123", 
      "name": "Demo Ops"
    },
    {
      "role": "society_admin",
      "email": "demo.society.admin@example.com",
      "password": "demo123",
      "name": "Demo Society Admin"
    },
    {
      "role": "guard", 
      "email": "demo.guard@example.com",
      "password": "demo123",
      "name": "Demo Guard",
      "flatNumber": "NA"
    },
    {
      "role": "owner_resident",
      "email": "demo.owner.resident@example.com",
      "password": "demo123", 
      "name": "Demo Owner Resident",
      "flatNumber": "A-101"
    },
    {
      "role": "renter_resident",
      "email": "demo.renter.resident@example.com", 
      "password": "demo123",
      "name": "Demo Renter Resident",
      "flatNumber": "A-102"
    },
    {
      "role": "member_resident",
      "email": "demo.member.resident@example.com",
      "password": "demo123",
      "name": "Demo Member Resident", 
      "flatNumber": "A-103"
    },
    {
      "role": "staff",
      "email": "demo.staff@example.com",
      "password": "demo123",
      "name": "Demo Staff",
      "flatNumber": "NA"
    },
    {
      "role": "api_system", 
      "email": "demo.api.system@example.com",
      "password": "demo123",
      "name": "Demo API System",
      "flatNumber": "NA"
    }
  ]
}
```

## Method 2: Using Browser Console

1. Open the application in browser: `http://localhost:9002`
2. Login as an admin user (Owner App or Ops)
3. Open browser developer tools (F12)
4. Go to Console tab
5. Copy and paste the script from `scripts/create-demo-users.js`
6. Run `createDemoUsers()` in the console

## Method 3: Using PowerShell (with authentication)

First, login to get a session cookie, then make the API call:

```powershell
# Step 1: Login to get session
$loginResponse = Invoke-WebRequest -Uri "http://localhost:9002/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@resigate.com","password":"adminpassword"}' -SessionVariable session

# Step 2: Create demo users using the session
$demoResponse = Invoke-RestMethod -Uri "http://localhost:9002/api/rbac/demo-users" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"societyId":"society-demo-001","prefix":"demo"}' -WebSession $session

# View the result
$demoResponse
```

## Testing the Demo Users

After creation, you can test login with any of the demo users:

### Login Credentials
- **Email Pattern**: `demo.{role_name}@example.com`
- **Password**: `demo123` (for all demo users)

### Example Logins
1. **Platform Admin**: `demo.owner.app@example.com` / `demo123`
2. **Society Admin**: `demo.society.admin@example.com` / `demo123`
3. **Guard**: `demo.guard@example.com` / `demo123`
4. **Owner Resident**: `demo.owner.resident@example.com` / `demo123`
5. **Renter Resident**: `demo.renter.resident@example.com` / `demo123`

### Verification Steps
1. Login with each demo user
2. Navigate to different sections based on role permissions
3. Test Feature Access Control UI (for Platform Admin roles)
4. Verify role-specific navigation and features

## Notes

- Demo users are created with `isApproved: true` so they can login immediately
- Each user has appropriate role associations for the specified society
- Default permissions are applied based on role type
- Society ID `society-demo-001` should exist or be created first
- Demo users are for testing only and should not be used in production

## Troubleshooting

### Error: Unauthorized (401)
- Ensure you're authenticated as an admin user
- Check if session/cookie is properly set

### Error: Society not found
- Create the society first or use an existing society ID
- Verify the society ID exists in the database

### Error: Demo users already exist
- The endpoint may prevent duplicate creation
- Check existing users or use a different prefix
