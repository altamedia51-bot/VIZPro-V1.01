import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('"scattered"')) {
    code = code.replace(/\| "popup_words"/g, '| "popup_words"\n    | "scattered"');
    fs.writeFileSync('src/types.ts', code);
    console.log("types.ts patched");
}
