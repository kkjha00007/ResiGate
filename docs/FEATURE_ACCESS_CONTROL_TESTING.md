# Feature Access Control UI Testing Guide

This guide explains how to test the comprehensive Feature Access Control UI for Owner (App) and Ops roles.

## Prerequisites

1. **Demo Users Created**: Follow the Demo Users Guide to create test users
2. **Society Setup**: Ensure `society-demo-001` exists with demo users
3. **Server Running**: Application running on `http://localhost:9002`

## Testing Steps

### 1. Login as Platform Admin

**Option A: Owner (App) Role**
- Email: `demo.owner.app@example.com`
- Password: `demo123`

**Option B: Ops Role**
- Email: `demo.ops@example.com`  
- Password: `demo123`

### 2. Navigate to Feature Access Control

1. After login, you should see the dashboard
2. In the left sidebar, look for **"Feature Access Control"** 
3. This menu item should only be visible to Owner (App), Ops, and SuperAdmin roles
4. Click on "Feature Access Control"

### 3. Feature Access Control Interface

The UI should display:

#### 3.1 Society Selection
- Dropdown to select society (`society-demo-001` should be available)
- Current selection displayed prominently

#### 3.2 Role Group Tabs
Four tabs representing role groups:
- **PLATFORM_ADMIN** (Owner App, Ops)
- **SOCIETY_ADMIN** (Society Admin, Guard)  
- **RESIDENT** (Owner Resident, Renter Resident, Member Resident)
- **SUPPORT** (Staff, API System)

#### 3.3 Feature Modules Grid
For each role group, 12 feature modules should be displayed:

| Module | Description |
|--------|-------------|
| Visitor Management | Guest registration, check-in/out |
| Gate Pass Management | QR code passes, validation |
| Facility Management | Booking, management |
| Parking Management | Spot allocation, vehicles |
| Notice Management | Announcements, pins |
| Meeting Management | Scheduling, attendance |
| Committee Management | Elections, voting |
| Billing Management | Bills, payments, disputes |
| Complaint Management | Issue tracking, resolution |
| User Management | User CRUD, approvals |
| Setting Management | Society configuration |
| SOS Management | Emergency alerts, response |

### 4. Testing Feature Controls

#### 4.1 Enable/Disable Features
For each feature module:

1. **Toggle Switch**: Each module has an enable/disable toggle
2. **Click to Toggle**: Test enabling and disabling features
3. **Visual Feedback**: Enabled features should be highlighted/colored differently
4. **Immediate Effect**: Changes should apply immediately

#### 4.2 Granular Permission Controls
When a feature is enabled:

1. **Permission Checkboxes**: Should show specific CRUD permissions
2. **Common Permissions**: Create, Read, Update, Delete
3. **Special Permissions**: Module-specific permissions (e.g., approve, validate)

Example for Visitor Management:
- ☐ visitor_create
- ☐ visitor_read  
- ☐ visitor_update
- ☐ visitor_delete
- ☐ visitor_approve
- ☐ validate_passes

#### 4.3 Bulk Actions
Test bulk operations:
1. **Enable All**: Button to enable all features for a role group
2. **Disable All**: Button to disable all features for a role group
3. **Reset to Default**: Button to reset to default permissions

### 5. Real-time Updates Testing

#### 5.1 Save Changes
1. Make changes to permissions
2. Look for **"Save Changes"** button
3. Click save and verify success message
4. Check that changes persist after page refresh

#### 5.2 Cross-User Testing
1. Make permission changes for RESIDENT role group
2. In another browser/tab, login as a resident user (`demo.owner.resident@example.com`)
3. Verify that disabled features are not accessible
4. Check that navigation menus update accordingly

### 6. Error Handling Testing

#### 6.1 Unauthorized Access
1. Logout from admin account
2. Login as a non-admin user (e.g., resident or guard)
3. Try to access `/dashboard/feature-access-control` directly
4. Should be redirected or see access denied message

#### 6.2 Network Errors
1. Disconnect internet temporarily
2. Try to save changes
3. Should see appropriate error message
4. Reconnect and verify retry functionality

### 7. Expected UI Elements

#### 7.1 Header Section
- Page title: "Feature Access Control"
- Society selector dropdown
- Instructions/help text

#### 7.2 Role Group Tabs
- Four tabs with role group names
- Active tab highlighted
- Tab content shows relevant features

#### 7.3 Feature Cards/Sections
Each feature module should display:
- Feature name and icon
- Enable/disable toggle
- Permission checkboxes (when enabled)
- Description or help text

#### 7.4 Action Buttons
- Save Changes (primary button)
- Reset to Default (secondary button)  
- Bulk Enable/Disable (utility buttons)

#### 7.5 Status Indicators
- Loading states during API calls
- Success/error messages
- Unsaved changes indicator

### 8. Permission Matrix Testing

Create a test matrix to verify permission enforcement:

| Role Group | Feature | Expected Access |
|------------|---------|----------------|
| PLATFORM_ADMIN | All Features | Full Access |
| SOCIETY_ADMIN | User Management | Admin Functions Only |
| RESIDENT | Visitor Management | Personal Visitors Only |
| SUPPORT | All Features | Support Functions Only |

### 9. Advanced Testing Scenarios

#### 9.1 Multi-Society Testing
1. Create users in different societies
2. Test feature access control per society
3. Verify isolation between societies

#### 9.2 Custom Permission Override
1. Set custom permissions for specific users
2. Verify custom permissions override role defaults
3. Test permission inheritance

#### 9.3 Role Association Testing
1. Create users with multiple roles
2. Test permission aggregation
3. Verify role precedence

## Troubleshooting

### Common Issues

#### Feature Access Control Not Visible
- Check user role (must be Owner App, Ops, or SuperAdmin)
- Verify authentication state
- Check navigation permissions

#### Permission Changes Not Saving
- Check network connectivity
- Verify API endpoints are working
- Check browser console for errors

#### UI Not Loading Properly
- Check browser compatibility
- Clear browser cache
- Verify all static assets are loading

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Network Tab**: Monitor API calls and responses
3. **Authentication**: Verify user session and role
4. **Database**: Check if changes are persisted

## Expected Results

After successful testing:
- ✅ Feature Access Control UI loads for admin users
- ✅ All 12 modules display with proper controls
- ✅ Permission changes save and persist
- ✅ Real-time updates work across user sessions
- ✅ Role-based access is properly enforced
- ✅ UI provides clear feedback and error handling
