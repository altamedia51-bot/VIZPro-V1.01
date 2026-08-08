import re
with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'    };\n    };\n    draw\(\);', r'    };\n    draw();', content)
content = re.sub(r'    };\r?\n    };\r?\n    draw\(\);', r'    };\n    draw();', content)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
