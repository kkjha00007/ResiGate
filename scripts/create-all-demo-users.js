// scripts/create-all-demo-users.js
// Usage: node scripts/create-all-demo-users.js

const fetch = global.fetch || require('node-fetch');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const SOCIETY_ID = '27497df0-529a-49e2-bc63-c5f9ebd042e1';
const PREFIX = 'demo';

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN environment variable is required.');
  process.exit(1);
}

async function createAllDemoUsers() {
  try {
    const res = await fetch('http://localhost:9002/api/rbac/demo-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${ADMIN_TOKEN}`
      },
      body: JSON.stringify({ societyId: SOCIETY_ID, prefix: PREFIX })
    });
    const result = await res.json();
    if (res.ok) {
      console.log('✅ All demo users created!');
      if (result.loginCredentials) {
        result.loginCredentials.forEach(user => {
          // Demo credentials are now stored in .env, do not print them to console
          console.log(`- ${user.role}: $DEMO_${user.role.toUpperCase()}_EMAIL ($DEMO_${user.role.toUpperCase()}_PASSWORD)`);
        });
      } else {
        console.log(result);
      }
    } else {
      console.error('❌ Error:', result);
    }
  } catch (e) {
    console.error('❌ Network error:', e.message);
  }
}

createAllDemoUsers();
