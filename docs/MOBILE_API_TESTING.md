# Quick API Testing Guide for Mobile App Team

## Test Server Setup

The RBAC-enabled backend is running and ready for testing:
- **Base URL**: `http://localhost:9002/api`
- **Server Status**: ✅ Running with full RBAC implementation

## Demo Users for Testing

Use these credentials to test different role scenarios. All demo credentials are now stored in your `.env` file as environment variables (see below).

### Platform Admin (Full Access)
```
Email: $DEMO_OWNER_EMAIL
Password: $DEMO_OWNER_PASSWORD
Role: owner_app
Access: All features, impersonation, feature control
```

### Society Admin (Society Management)
```
Email: $DEMO_SOCIETY_ADMIN_EMAIL
Password: $DEMO_SOCIETY_ADMIN_PASSWORD
Role: society_admin
Access: Society-level admin functions
```

### Security Guard (Visitor Management)
```
Email: $DEMO_GUARD_EMAIL
Password: $DEMO_GUARD_PASSWORD
Role: guard
Access: Visitor management, gate passes, security
```

### Owner Resident (Full Resident Access)
```
Email: $DEMO_OWNER_RESIDENT_EMAIL
Password: $DEMO_OWNER_RESIDENT_PASSWORD
Role: owner_resident
Access: Personal visitors, facility booking, bills
```

### Renter Resident (Limited Resident Access)
```
Email: $DEMO_RENTER_RESIDENT_EMAIL
Password: $DEMO_RENTER_RESIDENT_PASSWORD
Role: renter_resident
Access: Limited visitor management, facilities
```

### Staff (Support Access)
```
Email: $DEMO_STAFF_EMAIL
Password: $DEMO_STAFF_PASSWORD
Role: staff
Access: Support functions, help desk, impersonation
```
## Demo Credentials Setup

Add the following variables to your `.env` file (or `.env.demo`):

```
DEMO_OWNER_EMAIL=demo.owner.app@example.com
DEMO_OWNER_PASSWORD=demo123
DEMO_SOCIETY_ADMIN_EMAIL=demo.society.admin@example.com
DEMO_SOCIETY_ADMIN_PASSWORD=demo123
DEMO_GUARD_EMAIL=demo.guard@example.com
DEMO_GUARD_PASSWORD=demo123
DEMO_OWNER_RESIDENT_EMAIL=demo.owner.resident@example.com
DEMO_OWNER_RESIDENT_PASSWORD=demo123
DEMO_RENTER_RESIDENT_EMAIL=demo.renter.resident@example.com
DEMO_RENTER_RESIDENT_PASSWORD=demo123
DEMO_STAFF_EMAIL=demo.staff@example.com
DEMO_STAFF_PASSWORD=demo123
```

Reference these variables in your scripts and documentation instead of hardcoding demo credentials.

## Quick API Test Sequence

### 1. Authentication Test
```bash
POST /api/auth/login
{
  "email": "demo.owner.app@example.com",
  "password": "demo123"
}
```

**Expected Response**: JWT token with role information

### 2. User Profile Test
```bash
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

**Expected Response**: User profile with `primaryRole`, `roleAssociations`, `permissions`

### 3. Permission Check Test
```bash
GET /api/rbac/permissions
Authorization: Bearer <jwt_token>
```

**Expected Response**: Detailed permissions for current user

### 4. Protected Endpoint Test
```bash
POST /api/visitors
Authorization: Bearer <jwt_token>
{
  "visitorName": "Test Visitor",
  "mobileNumber": "1234567890",
  "purposeOfVisit": "Meeting"
}
```

**Expected Behavior**: 
- ✅ Success for roles with `visitor_create` permission
- ❌ 403 Forbidden for roles without permission

### 5. Role-Based Feature Test
```bash
GET /api/users?societyId=society-demo-001
Authorization: Bearer <jwt_token>
```

**Expected Behavior**:
- ✅ Admin roles: Full user list
- ❌ Regular users: 403 Forbidden

## Permission Testing Matrix

| API Endpoint | owner_app | society_admin | guard | owner_resident | renter_resident |
|--------------|-----------|---------------|-------|----------------|-----------------|
| `POST /api/visitors` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `DELETE /api/visitors/{id}` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `POST /api/facilities` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /api/users` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /api/notices` | ✅ | ✅ | ❌ | ❌ | ❌ |

## Error Response Examples

### 401 Unauthorized (Invalid/Missing Token)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "statusCode": 401
}
```

### 403 Forbidden (Insufficient Permissions)
```json
{
  "error": "Insufficient permissions", 
  "required": ["visitor_delete"],
  "userPermissions": ["visitor_create", "visitor_read"],
  "statusCode": 403
}
```

## Mobile App Integration Checklist

- [ ] **Authentication Flow**: Login → Store JWT → Include in API calls
- [ ] **Role Detection**: Parse `primaryRole` from user profile
- [ ] **Permission Checking**: Use `permissions` object for feature access
- [ ] **Error Handling**: Handle 401/403 responses appropriately
- [ ] **Multi-Role Support**: Handle `roleAssociations` array
- [ ] **Session Management**: Refresh tokens, handle expiration
- [ ] **Feature Toggling**: Show/hide features based on permissions

## Support & Documentation

- **Full API Documentation**: `docs/API_DOCUMENTATION.md`
- **RBAC Details**: `docs/MOBILE_APP_RBAC_CONFIRMATION.md` 
- **Demo Users Guide**: `docs/DEMO_USERS_GUIDE.md`
- **Testing Guide**: `docs/FEATURE_ACCESS_CONTROL_TESTING.md`

**Ready for mobile app development!** 🚀
