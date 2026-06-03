const fs = require('fs');

let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// Change the button text
content = content.replace(/>VIEW DETAIL<\/button>/g, '>VIEW DETAIL 🔑</button>');

// Enforce inline styles for the modal overlay to guarantee it displays on top of everything
const oldOverlay = '<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">';
const newOverlay = '<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} className="backdrop-blur-sm">';
content = content.replace(oldOverlay, newOverlay);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content, 'utf8');
console.log('Updated scratch');
