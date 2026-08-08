with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace('| "brush_stroke"', '| "brush_stroke"\n    | "vintage_brush"')

with open('src/types.ts', 'w') as f:
    f.write(content)
