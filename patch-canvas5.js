import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `const textToMeasure = el.type === 'text' ? el.text : 'Subtitle Text';`;
const replacement1 = `const textToMeasure = (el.type === 'text' || el.type === 'sticker_text') ? el.text : 'Subtitle Text';`;

if(code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Success");
} else {
    console.log("Target not found!");
}
