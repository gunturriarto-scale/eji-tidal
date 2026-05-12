// Test Google Auth on VPS
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: 'test@test.com',
    private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
  },
  scopes: ['test'],
});

console.log('GoogleAuth instantiated:', auth.constructor.name);

// Try to get a token (will fail but tells us the auth method works)
auth.getClient().then(c => {
  console.log('Auth client type:', c.constructor.name);
  process.exit(0);
}).catch(err => {
  console.log('Expected error:', err.message.slice(0, 100));
  process.exit(0);
});
