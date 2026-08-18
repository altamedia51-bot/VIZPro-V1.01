import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const target = `<option value="drop_bounce">Hanging / Drop Bounce</option>`;
const replacement = `<option value="drop_bounce">Hanging / Drop Bounce</option>
                              <option value="popup_words">Pop-Up Words (RTL/LTR)</option>`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Editor patched");
}
