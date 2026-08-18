import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `      } else if ((el.type === 'text' || el.type === 'subtitle') && ctx) {`;
const replacement1 = `      } else if ((el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') && ctx) {`;

const target2 = `          else if (el.type === 'text' || el.type === 'subtitle') {`;
const replacement2 = `          else if (el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') {`;

const target3 = `              const lines = textToRender.split('\\n');`;
const replacement3 = `              const lines = textToRender.split('\\n');
              
              if (el.type === 'sticker_text') {
                 ctx.lineJoin = 'round';
                 ctx.miterLimit = 2;
                 ctx.strokeStyle = el.strokeColor1 || '#ffffff';
                 ctx.lineWidth = el.lineWidth || 15;
                 
                 // Add 3D Drop Shadow effect for sticker
                 ctx.shadowColor = 'rgba(0,0,0,0.4)';
                 ctx.shadowBlur = 10;
                 ctx.shadowOffsetX = 4;
                 ctx.shadowOffsetY = 6;
                 
                 lines.forEach((line, index) => {
                    const y = startY + index * lineHeight;
                    ctx.strokeText(line, 0, y);
                 });
                 
                 // Remove shadow for fill
                 ctx.shadowColor = 'transparent';
                 ctx.shadowBlur = 0;
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 0;
              }`;

const target4 = `                } else {
                  // Default
                  ctx.fillStyle = getStyle(el, -width/2, lineY, width/2, lineY);
                  ctx.fillText(line, 0, lineY);
                }`;
const replacement4 = `                } else if (el.type === 'sticker_text') {
                  if (el.useGradient && el.color2) {
                     // Create vertical gradient matching the text bounds
                     const grad = ctx.createLinearGradient(0, lineY - el.fontSize/2, 0, lineY + el.fontSize/2);
                     grad.addColorStop(0, el.color || '#ff0000');
                     grad.addColorStop(1, el.color2 || '#ff8888');
                     ctx.fillStyle = grad;
                  } else {
                     ctx.fillStyle = el.color || '#FFFFFF';
                  }
                  ctx.fillText(line, 0, lineY);
                } else {
                  // Default
                  ctx.fillStyle = getStyle(el, -width/2, lineY, width/2, lineY);
                  ctx.fillText(line, 0, lineY);
                }`;

if(code.includes(target1) && code.includes(target2) && code.includes(target3) && code.includes(target4)) {
    code = code.replace(target1, replacement1);
    code = code.replace(target2, replacement2);
    code = code.replace(target3, replacement3);
    code = code.replace(target4, replacement4);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Success");
} else {
    console.log("Target not found!");
}
