const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldRenderBlock = `const dateStr = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}-\${day.toString().padStart(2, '0')}\`;
                    const isSelected = selectedDate === dateStr;
                    const hasSlots = slots.some(s => s.date === dateStr && (!selectedStaff || s.staff === selectedStaff.name));
                    
                    return (
                      <button 
                        key={i} 
                        disabled={!hasSlots}
                        onClick={() => setSelectedDate(dateStr)}
                        className={\`aspect-square rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative \${
                          isSelected ? 'bg-red-700 text-white shadow-lg scale-110 z-10' : 
                          hasSlots ? 'bg-white text-gray-900' : 'text-gray-300 cursor-not-allowed'
                        }\`}
                        style={hasSlots && !isSelected ? { 
                          border: \`2px solid \${selectedService?.color || '#cbd5e1'}\`,
                          boxShadow: \`0 0 0 2px white, 0 0 0 4px \${selectedService?.color || '#cbd5e1'}\`
                        } : {}}
                      >
                        {day}
                      </button>
                    );`;

const newRenderBlock = `const dateStr = \`\${currentYear}-\${(currentMonth + 1).toString().padStart(2, '0')}-\${day.toString().padStart(2, '0')}\`;
                    const isSelected = selectedDate === dateStr;
                    const today = new Date();
                    const todayStr = \`\${today.getFullYear()}-\${(today.getMonth() + 1).toString().padStart(2, '0')}-\${today.getDate().toString().padStart(2, '0')}\`;
                    const isPast = dateStr < todayStr;
                    const hasSlots = slots.some(s => s.date === dateStr && (!selectedStaff || s.staff === selectedStaff.name));
                    
                    const isDisabled = isPast || !hasSlots;
                    
                    return (
                      <button 
                        key={i} 
                        disabled={isDisabled}
                        onClick={() => setSelectedDate(dateStr)}
                        className={\`aspect-square rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative \${
                          isSelected ? 'bg-red-700 text-white shadow-lg scale-110 z-10' : 
                          isPast ? 'text-gray-200 bg-gray-50 cursor-not-allowed' :
                          hasSlots ? 'bg-white text-gray-900 hover:scale-105' : 'text-gray-300 cursor-not-allowed'
                        }\`}
                        style={hasSlots && !isSelected && !isPast ? { 
                          border: \`2px solid \${selectedService?.color || '#cbd5e1'}\`,
                          boxShadow: \`0 0 0 2px white, 0 0 0 4px \${selectedService?.color || '#cbd5e1'}\`
                        } : {}}
                      >
                        {day}
                      </button>
                    );`;

content = content.replace(oldRenderBlock, newRenderBlock);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Fixed calendar past dates');
