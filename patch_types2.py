with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace('| "colorful_words"', '| "colorful_words"\n    | "brush_stroke"')

with open('src/types.ts', 'w') as f:
    f.write(content)
