with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace('    | "hanging"\n', '')

with open('src/types.ts', 'w') as f:
    f.write(content)
