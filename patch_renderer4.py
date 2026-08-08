with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_block = "} else if (el.templateStyle === 'colorful_words') {"

new_block = """} else if (el.templateStyle === 'brush_stroke') {
                  // A slight textured shadow for brush stroke text
                  ctx.shadowColor = 'rgba(0,0,0,0.4)';
                  ctx.shadowBlur = 10;
                  ctx.shadowOffsetX = 2;
                  ctx.shadowOffsetY = 4;
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  // Reset shadow
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                } else if (el.templateStyle === 'colorful_words') {"""

content = content.replace(old_block, new_block)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
