// Usage: node scripts/create-demo-users.js
// Requires: Node.js v18+ (for global fetch) or install 'node-fetch' for older versions
// Set ADMIN_TOKEN in your environment for authentication if required by your backend

const DEMO_USERS = [
  { name: 'Owner App User', email: 'owner@app.com', password: 'Password123!', role: 'owner_app', flatNumber: 'A-101' },
  { name: 'Ops User', email: 'ops@app.com', password: 'Password123!', role: 'ops', flatNumber: 'A-102' },
  { name: 'Society Admin', email: 'admin@society.com', password: 'Password123!', role: 'society_admin', flatNumber: 'A-103' },
  { name: 'Platform Admin', email: 'platform@admin.com', password: 'Password123!', role: 'platform_admin', flatNumber: 'A-104' },
  { name: 'Support User', email: 'support@app.com', password: 'Password123!', role: 'support', flatNumber: 'A-105' },
  { name: 'Resident User', email: 'resident@app.com', password: 'Password123!', role: 'resident', flatNumber: 'A-106' },
];

const DEMO_SOCIETY = {
  id: '27497df0-529a-49e2-bc63-c5f9ebd042e1',
  name: 'Demo Society',
  city: 'Demo City',
  pincode: '123456',
  state: 'Demo State',
  country: 'Demo Country',
};

async function createDemoUsers() {
  let adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken && typeof window === 'undefined') {
    console.error('❌ ADMIN_TOKEN environment variable is required.');
    console.error('Set it with: set ADMIN_TOKEN=your_token_here (Windows) or export ADMIN_TOKEN=your_token_here (Linux/macOS)');
    process.exit(1);
  }

  // Create society first (if your API requires it)
  try {
    const societyRes = await fetch('http://localhost:9002/api/societies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { 'Cookie': `session=${adminToken}` } : {})
      },
      body: JSON.stringify(DEMO_SOCIETY)
    });
    if (societyRes.ok) {
      console.log('✅ Demo society created or already exists.');
    } else {
      const err = await societyRes.text();
      if (!err.includes('already exists')) {
        console.error('❌ Error creating society:', err);
        return;
      }
      console.log('ℹ️ Society already exists.');
    }
  } catch (e) {
    console.error('❌ Network error creating society:', e.message);
    return;
  }

  // Create users
  for (const user of DEMO_USERS) {
    try {
      const res = await fetch('http://localhost:9002/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Cookie': `session=${adminToken}` } : {})
        },
        body: JSON.stringify({ ...user, societyId: DEMO_SOCIETY.id })
      });
      if (res.ok) {
        console.log(`✅ Created: ${user.role} (${user.email})`);
      } else {
        const err = await res.text();
        if (err.includes('already exists')) {
          console.log(`ℹ️ Already exists: ${user.role} (${user.email})`);
        } else {
          console.error(`❌ Error creating ${user.role}:`, err);
        }
      }
    } catch (e) {
      console.error(`❌ Network error for ${user.role}:`, e.message);
    }
  }
  console.log('🎉 Demo user creation complete.');
}

if (typeof window === 'undefined') {
  createDemoUsers();
} else {
  window.createDemoUsers = createDemoUsers;
  console.log('Run createDemoUsers() in the browser console to create demo users');
}
