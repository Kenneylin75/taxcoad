
const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// saveServiceDefinition
content = content.replace(/currentServices\.push\(\{ id: id \|\| \s-\\\$\{Date\.now\(\)\}\, status: 'Active', color: newColor, \.\.\.data \}\);/,
  'const templeId = await getDynamicTempleId();\n    currentServices.push({ id: id || \s-\\, status: \'Active\', color: newColor, templeId, ...data });');

// saveForm
content = content.replace(/currentForms\.push\(\{ id: id \|\| \-\\\$\{Date\.now\(\)\}\, \.\.\.data \}\);/,
  'const templeId = await getDynamicTempleId();\n    currentForms.push({ id: id || \-\\, templeId, ...data });');

// addLampCategory
content = content.replace(/db_lamp_categories\.push\(\{ id: \\\cat-\\\$\{Date\.now\(\)\}\\\, \.\.\.data \}\);/,
  'const templeId = await getDynamicTempleId();\n  db_lamp_categories.push({ id: \cat-\\, templeId, ...data });');

// createSlot -> already has templeId check! Wait, let's check createSlot.
// bookAppointment -> let's check it.
fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Done writers');

