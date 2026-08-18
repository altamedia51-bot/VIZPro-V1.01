import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const target = `    } else if (type === 'text') {
      newEl.text = 'New Text';
      newEl.fontSize = 60;
      newEl.fontFamily = 'Arial';`;

const replacement = `    } else if (type === 'text') {
      newEl.text = 'New Text';
      newEl.fontSize = 60;
      newEl.fontFamily = 'Arial';
    } else if (type === 'sticker_text') {
      newEl.text = 'Happy Birthday';
      newEl.fontSize = 120;
      newEl.fontFamily = 'Brush Script MT, cursive';
      newEl.color = '#ff0000';
      newEl.color2 = '#ff8888';
      newEl.useGradient = true;
      newEl.strokeColor1 = '#ffffff';
      newEl.lineWidth = 15;`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Success");
} else {
    console.log("Target not found!");
}
