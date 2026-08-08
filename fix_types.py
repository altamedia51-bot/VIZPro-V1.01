import re
with open('src/types.ts', 'r') as f:
    content = f.read()

content = re.sub(r'  backgroundOpacity\?: number;\n\}\n\}', r'  backgroundOpacity?: number;\n}', content)

with open('src/types.ts', 'w') as f:
    f.write(content)
