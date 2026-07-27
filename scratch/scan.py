import os
import re

search_dirs = ['src', 'app', 'lib', 'utils', 'server', 'actions', 'api', 'middleware', 'services', 'repositories', 'database', 'db', 'controllers', 'cron', 'jobs', 'workers']

def scan():
    results = {}
    for dir_name in search_dirs:
        path = os.path.join(os.getcwd(), dir_name)
        if not os.path.exists(path):
            continue
        for root, dirs, files in os.walk(path):
            for file in files:
                if not file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                    continue
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    matches = []
                    # Check for incorrect table names in queries or prisma calls
                    patterns = [
                        r'\b(temples|temple_bills|personnel|deep_records|distributor_sales)\b',
                        r'(?i)fallback\s+to\s+memory',
                        r'\[PostgreSQL Session Failed\]',
                        r'\b(?:let|const)\s+\w+\s*=\s*\[\]\s*;//\s*memory\b',
                    ]
                    for p in patterns:
                        for m in re.finditer(p, content):
                            matches.append(m.group(0))
                            
                    if matches:
                        results[filepath] = list(set(matches))
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")
                    
    for k, v in results.items():
        print(f"{k}: {v}")
        
if __name__ == '__main__':
    scan()
