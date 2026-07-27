import re

with open('schema.prisma', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '[]' in line and '@map' in line:
        line = re.sub(r'@map\("[^"]+"\)', '', line)
    elif '@relation' in line and '@map' in line:
        line = re.sub(r'@map\("[^"]+"\)', '', line)
    new_lines.append(line)

with open('schema.prisma', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
