// Test Google Auth on VPS (ESM)
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: 'test@test.com',
    private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
  },
  scopes: ['test'],
});

console.log('GoogleAuth instantiated:', auth.constructor.name);

auth.getClient().then(c => {
  console.log('Auth client type:', c.constructor.name);
  process.exit(0);
}).catch(err => {
  console.log('Expected error:', err.message.slice(0, 150));
  process.exit(0);
});