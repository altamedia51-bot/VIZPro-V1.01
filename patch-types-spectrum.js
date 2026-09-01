import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetStr = `| "segmented"`;
const replaceStr = `| "segmented" | "spectrum"`;

if (code.includes(targetStr) && !code.includes('"spectrum"')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/types.ts', code);
    console.log("types.ts patched for spectrum waveform");
} else if (code.includes('"spectrum"')) {
    console.log("spectrum already in types.ts");
} else {
    // Fallback if previous regex was different
    const fallbackRegex = /waveformStyle:\s*"bars"\s*\|\s*"mirrored"\s*\|\s*"wave"\s*\|\s*"dots"\s*\|\s*"segmented"/;
    const fallbackReplace = 'waveformStyle: "bars" | "mirrored" | "wave" | "dots" | "segmented" | "spectrum"';
    if (fallbackRegex.test(code)) {
        code = code.replace(fallbackRegex, fallbackReplace);
        fs.writeFileSync('src/types.ts', code);
        console.log("types.ts patched via regex fallback");
    } else {
        console.log("Could not patch types.ts");
    }
}
