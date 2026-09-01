import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetRegex = /waveformStyle:\s*"bars"\s*\|\s*"mirrored"\s*\|\s*"wave"\s*\|\s*"dots"/;
const replacement = 'waveformStyle: "bars" | "mirrored" | "wave" | "dots" | "segmented"';

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/types.ts', code);
    console.log("types.ts patched for segmented waveform");
} else {
    console.log("Could not find waveformStyle union in types.ts");
}
