import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target = `const textToMeasure = (el.type === 'text' || el.type === 'sticker_text') ? el.text : 'Subtitle Text';`;
const replacement = `const textToMeasure = (el.type === 'text' || el.type === 'sticker_text') ? el.text : 'Subtitle Text';
        if (el.type === 'sticker_text') {
            console.log("Sticker Text hit check", textToMeasure);
        }`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Added hit debug");
}

const target2 = `const lines = textToRender.split('\\n');
              
              if (el.type === 'sticker_text') {`;
const replacement2 = `const lines = textToRender.split('\\n');
              
              if (el.type === 'sticker_text') {
                 // console.log("Drawing sticker text", textToRender);`;

if(code.includes(target2)) {
    code = code.replace(target2, replacement2);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Added draw debug");
} else {
    console.log("Could not find draw target");
}
