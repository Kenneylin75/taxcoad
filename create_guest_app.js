const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace relative imports
content = content.replace(/from "\.\/shared-types"/g, 'from "@/app/shared-types"');
content = content.replace(/from "\.\/actions"/g, 'from "@/app/actions"');

// Export name change and add props
content = content.replace('export default function Home() {', 'export default function GuestAppClient({ templeId, forceLogin }: { templeId: string, forceLogin?: boolean }) {\n  const [isRedirecting, setIsRedirecting] = useState(false);\n');

// Add router import
if (!content.includes('useRouter')) {
  content = content.replace('import React, { useState, useEffect, useRef } from "react";', 'import React, { useState, useEffect, useRef } from "react";\nimport { useRouter } from "next/navigation";');
}

// Intercept guestUser check for forceLogin redirection
const redirectEffect = `
  const router = useRouter();
  useEffect(() => {
    if (forceLogin && guestUser && !isRedirecting) {
      setIsRedirecting(true);
      router.push(\`/\${templeId}\`);
    }
  }, [forceLogin, guestUser, isRedirecting, router, templeId]);
`;
content = content.replace('useEffect(() => {', redirectEffect + '\n  useEffect(() => {');

// We also need to fix the case where if !guestUser && !forceLogin, it shows the login wall. This is normal.
// But if they are accessing the root page and not logged in, they see the login wall. This is exactly what we want.

fs.writeFileSync('src/app/[templeId]/GuestAppClient.tsx', content, 'utf8');
console.log('GuestAppClient.tsx created successfully.');
