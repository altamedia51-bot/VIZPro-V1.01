with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_block = "} else if (el.templateStyle === 'vintage_brush') {"

new_block = """} else if (el.templateStyle === 'jhun_brush') {
                  // Rough brush style with some drop shadow
                  ctx.shadowColor = 'rgba(0,0,0,0.8)';
                  ctx.shadowBlur = 4;
                  ctx.shadowOffsetX = 3;
                  ctx.shadowOffsetY = 3;
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  // Reset shadow
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  // Optional: add a slight stroke to emphasize the brush texture
                  ctx.lineWidth = 1.5;
                  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                  ctx.strokeText(line, 0, lineY);
                } else if (el.templateStyle === 'vintage_brush') {"""

content = content.replace(old_block, new_block)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
