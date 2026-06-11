const fs = require('fs');

const distFile = fs.readFileSync('src/app/dist-admin-portal/[distId]/DistAdminClient.tsx', 'utf8');
const salesFile = fs.readFileSync('src/app/dist-sales-portal/[distId]/[salesId]/page.tsx', 'utf8');

// Extract renderTools from dist-admin
const distRenderToolsStart = distFile.indexOf('const renderTools = () => (');
const distRenderToolsEnd = distFile.indexOf('  );', distRenderToolsStart) + 4;
let newRenderTools = distFile.substring(distRenderToolsStart, distRenderToolsEnd);

// Replace officialTools with tools
newRenderTools = newRenderTools.replace(/officialTools/g, 'tools');

// Extract Tool Preview Modal from dist-admin
const modalStart = distFile.indexOf('{/* --- TOOL PREVIEW MODAL --- */}');
const modalEnd = distFile.lastIndexOf('</div>\n  );\n}');
let newModal = distFile.substring(modalStart, modalEnd);

// Now patch salesFile
let updatedSales = salesFile;

// 1. Add state
const stateInsertIdx = updatedSales.indexOf('const [tools, setTools]');
updatedSales = updatedSales.substring(0, stateInsertIdx) + 'const [activeToolPreview, setActiveToolPreview] = useState<any>(null);\n  ' + updatedSales.substring(stateInsertIdx);

// 2. Replace renderTools
const salesRenderToolsStart = updatedSales.indexOf('const renderTools = () => (');
// Because there might be extra spaces or formatting, let's find the closing of renderTools.
// It ends with   ); right before   const renderProfile = () => (
const salesRenderToolsEnd = updatedSales.indexOf('const renderProfile = () => (');
// Find the `  );` right before `const renderProfile`
const endOfSalesRenderTools = updatedSales.lastIndexOf('  );\n', salesRenderToolsEnd) + 5;

updatedSales = updatedSales.substring(0, salesRenderToolsStart) + newRenderTools + '\n\n  ' + updatedSales.substring(endOfSalesRenderTools);

// 3. Add Modal at the bottom
const rootEnd = updatedSales.lastIndexOf('</div>\n  );\n}');
if (rootEnd > -1) {
    updatedSales = updatedSales.substring(0, rootEnd) + newModal + '\n' + updatedSales.substring(rootEnd);
}

fs.writeFileSync('src/app/dist-sales-portal/[distId]/[salesId]/page.tsx', updatedSales);
console.log('Successfully patched dist-sales-portal page.tsx');
