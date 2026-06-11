const fs = require('fs');

let distClient = fs.readFileSync('src/app/dist-admin-portal/[distId]/DistAdminClient.tsx', 'utf8');

// 1. Fix doc to document
distClient = distClient.replace(/\[\'doc\', \'contract\'\]/g, "['document', 'contract']");

// 2. Remove fake contract
const contractStart = distClient.indexOf('<div className="bg-white/60 backdrop-blur-xl rounded-[45px] p-10 shadow-2xl border border-white space-y-8 group">');
if (contractStart > -1) {
  const contractEnd = distClient.indexOf('</div>', distClient.indexOf('啟動官方數位合約簽署')) + 6;
  if (contractEnd > 6) {
    distClient = distClient.substring(0, contractStart) + distClient.substring(contractEnd);
  }
}

// 3. Move modal out of renderTools to the end of the root div (after <nav>)
const modalStart = distClient.indexOf('{/* --- TOOL PREVIEW MODAL --- */}');
if (modalStart > -1) {
  // Find the closing )} of the modal.
  const modalEnd = distClient.indexOf(')}', distClient.indexOf('確認下載檔案')) + 2;
  if (modalEnd > 2) {
    const modalStr = distClient.substring(modalStart, modalEnd);
    distClient = distClient.substring(0, modalStart) + distClient.substring(modalEnd);
    
    // Inject at the end of the file, right before the last closing </div>\n  );\n}
    const navIndex = distClient.lastIndexOf('</nav>');
    if (navIndex > -1) {
        distClient = distClient.substring(0, navIndex + 6) + '\n\n' + modalStr + '\n\n' + distClient.substring(navIndex + 6);
    }
  }
}

fs.writeFileSync('src/app/dist-admin-portal/[distId]/DistAdminClient.tsx', distClient);

// DO THE SAME FOR SUPER SALES PAGE
let superSalesPage = fs.readFileSync('src/app/super-sales/[salesId]/page.tsx', 'utf8');
const ssModalStart = superSalesPage.indexOf('{/* --- TOOL PREVIEW MODAL --- */}');
if (ssModalStart > -1) {
  const ssModalEnd = superSalesPage.indexOf(')}', superSalesPage.indexOf('確認下載檔案')) + 2;
  if (ssModalEnd > 2) {
    const ssModalStr = superSalesPage.substring(ssModalStart, ssModalEnd);
    superSalesPage = superSalesPage.substring(0, ssModalStart) + superSalesPage.substring(ssModalEnd);
    
    // Inject at the end, before the last closing </div>\n  );\n};
    const rootEnd = superSalesPage.lastIndexOf('</div>');
    if (rootEnd > -1) {
       superSalesPage = superSalesPage.substring(0, rootEnd) + ssModalStr + '\n' + superSalesPage.substring(rootEnd);
    }
  }
}
fs.writeFileSync('src/app/super-sales/[salesId]/page.tsx', superSalesPage);

console.log('Fixed files successfully!');
