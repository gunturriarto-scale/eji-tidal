#!/usr/bin/env python3
# Fix the .env file on VPS - convert BQ_PRIVATE_KEY to proper multi-line format
import re

env_path = '/home/digitaldecade/eji-kol/.env'

with open(env_path, 'r') as f:
    content = f.read()

lines = content.split('\n')
new_lines = []

for line in lines:
    if line.startswith('BQ_PRIVATE_KEY='):
        # Found the key line - need to check if it's multi-line
        if line.startswith('BQ_PRIVATE_KEY=""'):
            # Multi-line key - find all continuation lines
            new_lines.append(line)
        elif 'PRIVATE KEY' in line:
            # Single-line with \n escapes
            # This is the problem - extract key, convert \n to actual newlines
            match = re.match(r'(BQ_PRIVATE_KEY=)(")(.*)(")', line, re.DOTALL)
            if match:
                prefix, quote1, key_body, quote2 = match.groups()
                # Convert literal \n to actual newlines
                fixed_key = key_body.replace('\\n', '\n')
                new_lines.append(prefix + quote1 + fixed_key + quote2)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

fixed_content = '\n'.join(new_lines)

with open(env_path, 'w') as f:
    f.write(fixed_content)

print("Fixed .env - checking key format...")
with open(env_path, 'r') as f:
    lines = f.read().split('\n')
key_line_idx = next(i for i, l in enumerate(lines) if 'PRIVATE KEY' in l and 'BQ_PRIVATE' in lines[max(0,i-1)])
# Check if key is on one line or multiple
key_lines = [l for l in lines if 'PRIVATE KEY' in l or ('----' in l and 'KEY' in l)]
print(f"Key spans {key_lines[0]} lines starting at index {key_line_idx}")
print("Done!" if '\n' in lines[key_line_idx] or len(key_lines) > 1 else "WARNING: key may still be single-line")