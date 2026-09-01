import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const targetStr = `{ id: 'dots', name: 'Dotted Column' },`;
const replaceStr = `{ id: 'dots', name: 'Dotted Column' },
                            { id: 'segmented', name: 'Segmented Blocks' },`;

if (code.includes(targetStr) && !code.includes('Segmented Blocks')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Editor.tsx patched for Segmented Blocks option");
} else {
    console.log("Segmented option already exists or target string not found in Editor.tsx");
}
