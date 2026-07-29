
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const matches = code.match(/export async function approveTempleBill/g);
console.log('approveTempleBill count:', matches ? matches.length : 0);

const salesMatches = code.match(/export async function fetchSalesProfileById/g);
console.log('fetchSalesProfileById count:', salesMatches ? salesMatches.length : 0);

