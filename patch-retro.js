import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetStr = `                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'neon') {`;

const replaceStr = `                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'retro') {
                  const shadowColor = el.color || '#E87D2A';
                  const offset = el.fontSize * 0.08;
                  
                  ctx.lineWidth = el.fontSize * 0.04;
                  ctx.lineJoin = 'miter';
                  
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, offset, lineY + offset);
                  ctx.fillStyle = shadowColor;
                  ctx.fillText(line, offset, lineY + offset);
                  
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'neon') {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Retro style rendering added");
} else {
    console.log("Could not find insertion point");
}
