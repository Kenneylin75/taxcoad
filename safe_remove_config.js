const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');

// The block we want to remove starts with {/* Dashboard Config */} and ends with a </div> that is 21 lines below it.
// Let's just find the exact string that is currently there.
const startIndex = content.indexOf('{/* Dashboard Config */}');
if (startIndex !== -1) {
    // Find the end of this specific div
    // We can just find the string that follows it: `         </div>\n      </div>\n    </div>\n  );\n}`
    
    // Find the string `      </div>\n    </div>\n  );\n}`
    const endStr = `         </div>\n      </div>\n    </div>\n  );\n}`;
    const endIndex = content.lastIndexOf(endStr);
    
    if (endIndex !== -1 && endIndex > startIndex) {
        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex);
        content = before + after;
        fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', content, 'utf8');
        console.log('Successfully removed Dashboard Config block.');
    } else {
        console.log('Could not find end of file structure.');
    }
} else {
    console.log('Dashboard Config block not found.');
}
