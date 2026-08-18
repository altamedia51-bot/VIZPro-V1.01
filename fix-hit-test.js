import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

// The issue might just be caching or the previous replacement missed something. 
// Let's do a hard replace of the hit test logic just to be safe.
const targetHit = `const textToMeasure = (el.type === 'text' || el.type === 'sticker_text') ? el.text : 'Subtitle Text';`;
const replacementHit = `const textToMeasure = el.text || 'Subtitle Text';`;

if(code.includes(targetHit)) {
   code = code.replace(targetHit, replacementHit);
   fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
   console.log("Fixed Hit test.");
}
