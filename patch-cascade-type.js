import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('"arabic_cascade"')) {
    code = code.replace(/\| "scattered"/g, '| "scattered"\n    | "arabic_cascade"');
    fs.writeFileSync('src/types.ts', code);
    console.log("types.ts patched for Arabic Cascade");
}
