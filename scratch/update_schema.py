import re

with open('schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

def camel_to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

# Add @map to fields
lines = content.split('\n')
new_lines = []
in_model = False
model_name = ""

for line in lines:
    m = re.match(r'^model\s+(\w+)\s*\{', line)
    if m:
        in_model = True
        model_name = m.group(1)
        new_lines.append(line)
        continue
        
    if in_model and line.strip() == '}':
        # Add @@map before closing
        table_name = camel_to_snake(model_name)
        # Handle plurals manually based on plan
        plural_map = {
            'Temple': 'temples',
            'TempleBill': 'temple_bills',
            'User': 'personnel',
            'DeepRecord': 'deep_records',
            'DistributorSales': 'dist_sales',
            'Slot': 'slots',
            'Service': 'services',
            'Event': 'events',
            'EventRegistration': 'event_registrations',
            'Appointment': 'appointments',
            'LampRecord': 'lamp_records',
            'LampCategory': 'lamp_categories',
            'QueueEvent': 'queue_events',
            'QueueTicket': 'queue_tickets',
            'AuditLog': 'audit_logs',
            'AdminLog': 'admin_logs',
            'SystemConfig': 'system_config',
            'Distributor': 'distributors',
            'DistributorApplication': 'distributor_applications',
            # Add others as standard plurals if not explicitly mapped
        }
        if model_name in plural_map:
            table_name = plural_map[model_name]
        elif not table_name.endswith('s'):
            table_name += 's'
            
        new_lines.append(f'  @@map("{table_name}")')
        new_lines.append(line)
        in_model = False
        continue
        
    if in_model and line.strip() and not line.strip().startswith('//') and not line.strip().startswith('@@'):
        # Field mapping
        # Match: name Type ...
        field_match = re.match(r'^\s+(\w+)\s+([A-Za-z0-9_\[\]\?]+)(.*)', line)
        if field_match:
            field_name = field_match.group(1)
            field_type = field_match.group(2)
            rest = field_match.group(3)
            
            snake_name = camel_to_snake(field_name)
            if snake_name != field_name and '@relation' not in rest:
                # Add @map if not already there
                if '@map' not in rest:
                    rest += f' @map("{snake_name}")'
            new_lines.append(f'  {field_name} {field_type}{rest}')
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('schema.prisma', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Updated schema.prisma")
