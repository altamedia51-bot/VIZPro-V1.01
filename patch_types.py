with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace('| "jhun_brush"', '| "jhun_brush"\n    | "pen_story"')

with open('src/types.ts', 'w') as f:
    f.write(content)
