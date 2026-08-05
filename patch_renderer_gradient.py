import re

with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

target1 = """      const getStyle = (el: any, x1: number, y1: number, x2: number, y2: number) => {
        if (el.useGradient && el.color2) {
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, el.color);
          grad.addColorStop(1, el.color2);
          return grad;
        }
        return el.color;
      };"""

replace1 = """      const getStyle = (el: any, x1: number, y1: number, x2: number, y2: number) => {
        if (el.useGradient) {
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, el.color || '#ffffff');
          grad.addColorStop(1, el.color2 || '#00ffff');
          return grad;
        }
        return el.color || '#ffffff';
      };"""

content = content.replace(target1, replace1)


target2 = """                  // Draw main front text
                  ctx.fillStyle = textColor;
                  ctx.shadowBlur = 0;
                  
                  // Draw ring on front
                  if (i === 0) {
                     ctx.beginPath();
                     ctx.arc(0, ringY, ringOuter, 0, Math.PI * 2, false);
                     ctx.arc(0, ringY, ringInner, 0, Math.PI * 2, true);
                     ctx.fill();
                  }
                  
                  ctx.fillText(line, 0, lineY);"""

replace2 = """                  // Draw main front text
                  const lineWidth = ctx.measureText(line).width;
                  ctx.fillStyle = el.useGradient ? getStyle(el, -lineWidth/2, lineY, lineWidth/2, lineY) : textColor;
                  ctx.shadowBlur = 0;
                  
                  // Draw ring on front
                  if (i === 0) {
                     ctx.beginPath();
                     ctx.arc(0, ringY, ringOuter, 0, Math.PI * 2, false);
                     ctx.arc(0, ringY, ringInner, 0, Math.PI * 2, true);
                     ctx.fill();
                  }
                  
                  ctx.fillText(line, 0, lineY);"""

content = content.replace(target2, replace2)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
