import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `            if (el.type === 'text') {
              textToRender = el.text;`;
const replacement1 = `            if (el.type === 'text' || el.type === 'sticker_text') {
              textToRender = el.text || '';`;

if(code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Success textToRender");
} else {
    console.log("Target not found!");
}
