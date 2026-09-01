import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const targetStr = `{ id: 'segmented', name: 'Segmented Blocks' },`;
const replaceStr = `{ id: 'segmented', name: 'Segmented Blocks' },
                            { id: 'spectrum', name: 'Spectrum Bars (Rainbow)' },`;

if (code.includes(targetStr) && !code.includes('Spectrum Bars')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Editor.tsx patched for Spectrum Bars option");
} else {
    console.log("Spectrum option already exists or target string not found in Editor.tsx");
}
