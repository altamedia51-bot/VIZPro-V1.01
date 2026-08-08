import re
with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

content = content.replace("el.templateStyle === 'hanging'", "el.isHanging")

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
