with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_code = """              // Pre-render Backgrounds
              if (el.templateStyle === 'bubble_yellow' || el.templateStyle === 'bubble_black') {
                 lines.forEach((line, i) => {
                   const lineWidth = ctx.measureText(line).width;
                   ctx.fillStyle = el.templateStyle === 'bubble_yellow' ? '#FFD700' : 'rgba(0, 0, 0, 0.7)';
                   ctx.beginPath();
                   ctx.roundRect(-lineWidth/2 - paddingX, startY + i * lineHeight - el.fontSize/2 - paddingY, lineWidth + paddingX*2, el.fontSize + paddingY*2, el.templateStyle === 'bubble_yellow' ? 12 : 8);
                   ctx.fill();
                   
                   if (el.templateStyle === 'bubble_black') {
                     ctx.strokeStyle = el.color || '#FFFFFF';
                     ctx.lineWidth = 2;
                     ctx.stroke();
                   }
                 });
              }"""

new_code = """              // Pre-render Backgrounds
              if (el.templateStyle === 'bubble_yellow' || el.templateStyle === 'bubble_black' || el.templateStyle === 'background_box') {
                 lines.forEach((line, i) => {
                   const lineWidth = ctx.measureText(line).width;
                   if (el.templateStyle === 'background_box') {
                     // Set opacity and color
                     const bgOpacity = (el as any).backgroundOpacity !== undefined ? (el as any).backgroundOpacity : 0.8;
                     ctx.globalAlpha = bgOpacity * el.opacity * alpha;
                     ctx.fillStyle = (el as any).backgroundColor || '#000000';
                   } else {
                     ctx.fillStyle = el.templateStyle === 'bubble_yellow' ? '#FFD700' : 'rgba(0, 0, 0, 0.7)';
                   }
                   ctx.beginPath();
                   const borderRadius = el.templateStyle === 'bubble_yellow' ? 12 : (el.templateStyle === 'background_box' ? 16 : 8);
                   ctx.roundRect(-lineWidth/2 - paddingX, startY + i * lineHeight - el.fontSize/2 - paddingY, lineWidth + paddingX*2, el.fontSize + paddingY*2, borderRadius);
                   ctx.fill();
                   
                   // Reset global alpha after drawing background
                   ctx.globalAlpha = el.opacity * alpha;
                   
                   if (el.templateStyle === 'bubble_black') {
                     ctx.strokeStyle = el.color || '#FFFFFF';
                     ctx.lineWidth = 2;
                     ctx.stroke();
                   }
                 });
              }"""

content = content.replace(old_code, new_code)
with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
