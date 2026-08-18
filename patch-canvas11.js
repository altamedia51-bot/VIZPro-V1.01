import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `const lines = textToRender.split('\\n');
              let startY = -(lines.length - 1) * lineHeight / 2;`;
const replacement1 = `const lines = textToRender.split('\\n');
              const lineHeight = el.fontSize * 1.2;
              let startY = -(lines.length - 1) * lineHeight / 2;`;

if(code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Success textToRender startY");
} else {
    console.log("Target not found!");
}
