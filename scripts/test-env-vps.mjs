// Test .env loading on VPS
import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const key = process.env.BQ_PRIVATE_KEY;
console.log('Key loaded:', !!key);
console.log('Key length:', key?.length);
console.log('Has literal \\n:', key?.includes('\\n'));
console.log('Starts correct:', key?.startsWith('-----BEGIN'));
console.log('Has newlines:', key?.includes('\n'));