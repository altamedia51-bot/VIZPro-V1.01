import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `      } else if ((el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') && ctx) {`;
const target2 = `          else if (el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') {`;

if (code.includes(target1) && code.includes(target2)) {
    console.log("Found both targets, renderer should be processing it.");
} else {
    console.log("Renderer is missing the hit-test or drawing code.");
}
