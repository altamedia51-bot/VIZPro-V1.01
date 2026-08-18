import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target = `                } else if (el.templateStyle === 'layered_outline') {
                  const strokeWidth = el.fontSize * 0.12;
                  const offset = el.fontSize * 0.08;
                  const color = el.color || '#E87D2A';`;

const replacement = `                } else if (el.templateStyle === 'calli') {
                  const strokeWidth = Math.max(2, el.fontSize * 0.05); // Thin white stroke
                  const offset = el.fontSize * 0.08;
                  const fillColor = el.color || '#015B28'; // Pakistan Green
                  const shadowColor = '#013B18'; // Darker green shadow
                  
                  ctx.lineJoin = 'round';
                  ctx.miterLimit = 2;
                  
                  // Bottom Shadow Layer (Solid block, slightly offset)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = shadowColor;
                  ctx.strokeText(line, offset, lineY + offset);
                  ctx.fillStyle = shadowColor;
                  ctx.fillText(line, offset, lineY + offset);
                  
                  // Top Layer (Green Fill with White Stroke)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = '#FFFFFF';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillStyle = fillColor;
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'layered_outline') {
                  const strokeWidth = el.fontSize * 0.12;
                  const offset = el.fontSize * 0.08;
                  const color = el.color || '#E87D2A';`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Canvas patched");
} else {
    console.log("Canvas target not found");
}

