// debug-env.js
require('dotenv').config();
console.log('DB_NAME ->', process.env.DB_NAME);
console.log('DB_USER ->', process.env.DB_USER);
console.log('DB_PASS ->', JSON.stringify(process.env.DB_PASS));
console.log('DB_HOST ->', process.env.DB_HOST);
console.log('DB_PORT ->', process.env.DB_PORT);
console.log('DATABASE_PUBLIC_URL ->', process.env.DATABASE_PUBLIC_URL ? '<present>' : '<missing>');
console.log('typeof DB_PASS ->', typeof process.env.DB_PASS);
console.log('--- all env keys (trimmed names) ---');
Object.keys(process.env)
  .filter(k => k.toLowerCase().includes('db') || k.toLowerCase().includes('database'))
  .forEach(k => console.log(k + ' = ' + String(process.env[k]).slice(0, 80)));
