// Manual JWT auth test - bypass google-auth-library
import crypto from 'crypto';
import { readFileSync } from 'fs';
import 'dotenv/config';

const email = process.env.BQ_CLIENT_EMAIL;
const rawKey = process.env.BQ_PRIVATE_KEY;

// Reconstruct multi-line key from .env format
// The .env has key on multiple lines from line 3 to end
const envContent = readFileSync('/home/digitaldecade/eji-kol/.env', 'utf8');
const lines = envContent.split('\n');

// Find PEM block only (-----BEGIN ... to -----END ...)
const pemLines = []
let inPem = false
for (const line of lines) {
  if (line.includes('-----BEGIN PRIVATE KEY-----')) { inPem = true }
  if (inPem) pemLines.push(line)
  if (line.trim().endsWith('-----END PRIVATE KEY-----')) break
}

const pemKey = pemLines.join('\n') + '\n'
console.log('PEM key length:', pemKey.length)
console.log('PEM key starts:', pemKey.slice(0,60))

// Create JWT manually
const now = Math.floor(Date.now() / 1000)
const payload = {
  iss: email,
  scope: 'https://www.googleapis.com/auth/spreadsheets',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
}

const header = { alg: 'RS256', typ: 'JWT' }
const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
const signingInput = `${headerB64}.${payloadB64}`

const signer = crypto.createSign('RSA-SHA256')
signer.update(signingInput)
signer.end()

try {
  const signature = signer.sign(pemKey, 'base64url')
  const jwt = `${signingInput}.${signature}`
  console.log('JWT created successfully! Length:', jwt.length)
  console.log('JWT header:', jwt.split('.')[0])

  // Exchange for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await response.json()
  if (data.access_token) {
    console.log('✅ Access token obtained! Length:', data.access_token.length)
  } else {
    console.log('❌ Token error:', JSON.stringify(data))
  }
} catch (err) {
  console.log('❌ Error:', err.message)
  console.log('Key error:', err.cause?.message)
}