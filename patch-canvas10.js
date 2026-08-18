import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `              const lines = textToRender.split('\\n');
              const lineHeight = el.fontSize * 1.2;
              const startY = -(lines.length - 1) * lineHeight / 2;`;

const replacement1 = `              const lines = textToRender.split('\\n');
              const lineHeight = el.fontSize * 1.2;
              let startY = -(lines.length - 1) * lineHeight / 2;`;

const target2 = `              const lines = textToRender.split('\\n');
              
              if (el.type === 'sticker_text') {
                 // console.log("Drawing sticker text", textToRender);
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
                 });`;
                 
const replacement2 = `              const lines = textToRender.split('\\n');
              const lineHeight = el.fontSize * 1.2;
              let startY = -(lines.length - 1) * lineHeight / 2;
              
              if (el.type === 'sticker_text') {
                 // console.log("Drawing sticker text", textToRender);
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
                 });`;

if (code.includes(target2)) {
    code = code.replace(target2, replacement2);
    // clean up duplicate if exists
    code = code.replace(`              const lines = textToRender.split('\\n');\n              const lineHeight = el.fontSize * 1.2;\n              let startY = -(lines.length - 1) * lineHeight / 2;\n              \n              const lines = textToRender.split('\\n');`, `              const lines = textToRender.split('\\n');`);
    
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Success replacing const startY");
} else {
    console.log("Target 2 not found");
}

