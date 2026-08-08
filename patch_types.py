with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace('| "architect"', '| "architect"\n    | "jhun_brush"')

with open('src/types.ts', 'w') as f:
    f.write(content)
