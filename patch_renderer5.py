with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_block = "} else if (el.templateStyle === 'colorful_words') {"

new_block = """} else if (el.templateStyle === 'vintage_brush') {
                  ctx.shadowColor = 'rgba(0,0,0,0.6)';
                  ctx.shadowBlur = 8;
                  ctx.shadowOffsetX = 3;
                  ctx.shadowOffsetY = 3;
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  // Second layer for rough edge look
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  ctx.fillStyle = 'rgba(255,255,255,0.1)';
                  ctx.fillText(line, 1, lineY + 1);
                } else if (el.templateStyle === 'colorful_words') {"""

content = content.replace(old_block, new_block)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
