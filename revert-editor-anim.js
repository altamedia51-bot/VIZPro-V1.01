import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

code = code.replace('<option value="popup_words">Pop-Up Words (RTL/LTR)</option>', '');

fs.writeFileSync('src/components/Editor.tsx', code);
