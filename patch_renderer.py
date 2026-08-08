with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_code = """                } else if (el.templateStyle === 'glow_border') {"""

new_code = """                } else if (el.templateStyle === 'layered_outline') {
                  const strokeWidth = el.fontSize * 0.12;
                  const offset = el.fontSize * 0.08;
                  const color = el.color || '#E87D2A';
                  
                  ctx.lineJoin = 'round';
                  ctx.miterLimit = 2;
                  
                  // Bottom Layer (Shadow with Stroke)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, offset, lineY + offset);
                  ctx.fillStyle = color;
                  ctx.fillText(line, offset, lineY + offset);
                  
                  // Top Layer (White with Stroke)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'glow_border') {"""

content = content.replace(old_code, new_code)
with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
