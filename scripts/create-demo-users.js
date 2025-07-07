// Demo user creation script
const createDemoUsers = async () => {
  // For Node.js: require admin token from env
  let adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken && typeof window === 'undefined') {
    console.error('❌ ADMIN_TOKEN environment variable is required.');
    console.error('Set it with: set ADMIN_TOKEN=your_token_here (Windows) or export ADMIN_TOKEN=your_token_here (Linux/macOS)');
    process.exit(1);
  }
  try {
    const response = await fetch('http://localhost:9002/api/rbac/demo-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Send as cookie for session-based auth
        ...(adminToken ? { 'Cookie': `session=${adminToken}` } : {})
      },
      body: JSON.stringify({
        societyId: 'society-demo-001',
        prefix: 'demo'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Demo users created successfully!');
      console.log('Created users:');
      if (Array.isArray(result.loginCredentials)) {
        result.loginCredentials.forEach(user => {
          console.log(`- ${user.role}: ${user.email} (password: ${user.password})`);
        });
      } else {
        console.log(result);
      }
    } else {
      console.log('❌ Error creating demo users:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// For browser console usage
if (typeof window !== 'undefined') {
  window.createDemoUsers = createDemoUsers;
  console.log('Run createDemoUsers() in the browser console to create demo users');
} else {
  // For Node.js usage
  createDemoUsers();
}
