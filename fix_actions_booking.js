const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// Fix bookAppointment
const oldBookStr = `      const newAppointment = {
        id: newId,
        date: slot.date,
        time: slot.time,
        staff: slot.staff,
        guestName,
        phone,
        service: slot.description,
        serviceId: slot.bound_service_id || slot.serviceId || null,`;

const newBookStr = `      const svcId = slot.bound_service_id || slot.serviceId;
      const svc = db_services.find((s: any) => s.id === svcId);
      const serviceName = svc ? svc.name : (slot.service || '一般預約');

      const newAppointment = {
        id: newId,
        date: slot.date,
        time: slot.time,
        staff: slot.staff,
        guestName,
        phone,
        service: serviceName,
        serviceId: svcId || null,`;

content = content.replace(oldBookStr, newBookStr);

// Fix fetchAppointments to inject proper service name for legacy mock data
const oldFetchStr = `        if (!app.serviceId) {
          const slot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff && s.description === app.service);
          if (slot && (slot.bound_service_id || slot.serviceId)) {
            app.serviceId = slot.bound_service_id || slot.serviceId;
          }
        }`;
const newFetchStr = `        if (!app.serviceId) {
          const slot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff);
          if (slot && (slot.bound_service_id || slot.serviceId)) {
            app.serviceId = slot.bound_service_id || slot.serviceId;
          }
        }
        if (app.serviceId) {
          const svc = db_services.find((s: any) => s.id === app.serviceId);
          if (svc) app.service = svc.name;
        }`;
content = content.replace(oldFetchStr, newFetchStr);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Fixed actions.ts');
