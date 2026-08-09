with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_block = "} else if (el.templateStyle === 'vintage_brush') {"

new_block = """} else if (el.templateStyle === 'pen_story') {
                  ctx.fillStyle = el.color || '#000000';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'vintage_brush') {"""

content = content.replace(old_block, new_block)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
