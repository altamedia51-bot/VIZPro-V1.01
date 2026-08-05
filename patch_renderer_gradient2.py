import re

with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

target = """                  // Draw front face
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  ctx.fillStyle = textColor;
                  
                  // Draw ring front
                  if (i === 0) {
                     ctx.beginPath();
                     ctx.arc(0, ringY, ringOuter, 0, Math.PI * 2, false);
                     ctx.arc(0, ringY, ringInner, 0, Math.PI * 2, true);
                     ctx.fill();
                  }
                  
                  ctx.fillText(line, 0, lineY);
                  ctx.restore();"""

replace = """                  // Draw front face
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  const lineWidth = ctx.measureText(line).width;
                  ctx.fillStyle = el.useGradient ? getStyle(el, -lineWidth/2, lineY, lineWidth/2, lineY) : textColor;
                  
                  // Draw ring front
                  if (i === 0) {
                     ctx.beginPath();
                     ctx.arc(0, ringY, ringOuter, 0, Math.PI * 2, false);
                     ctx.arc(0, ringY, ringInner, 0, Math.PI * 2, true);
                     ctx.fill();
                  }
                  
                  ctx.fillText(line, 0, lineY);
                  ctx.restore();"""

content = content.replace(target, replace)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
