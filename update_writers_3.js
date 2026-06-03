const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(/currentSlots\.push\(\{([\s\S]*?)\}\);/g, (match, inner) => {
  if (inner.includes('id:') && !inner.includes('templeId')) {
    return `currentSlots.push({${inner}, templeId});`;
  }
  return match;
});

content = content.replace(/currentAppointments\.push\(\{([\s\S]*?)\}\);/g, (match, inner) => {
  if (inner.includes('id:') && !inner.includes('templeId')) {
    return `currentAppointments.push({${inner}, templeId});`;
  }
  return match;
});

content = content.replace(/currentServices\.push\(\{([\s\S]*?)\}\);/g, (match, inner) => {
  if (inner.includes('id:') && !inner.includes('templeId')) {
    return `currentServices.push({${inner}, templeId});`;
  }
  return match;
});

content = content.replace(/currentForms\.push\(\{([\s\S]*?)\}\);/g, (match, inner) => {
  if (inner.includes('id:') && !inner.includes('templeId')) {
    return `currentForms.push({${inner}, templeId});`;
  }
  return match;
});

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Done 3');
