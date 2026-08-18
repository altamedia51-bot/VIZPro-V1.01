import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `else if (el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') {
            const time = performance.now();
            let finalY = el.y;`;
const replacement1 = `else if (el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') {
            const time = performance.now();
            let finalY = el.y;
            let textToRender = (el as any).text || '';
            if (el.type === 'subtitle') {
                 // Subtitle logic
                 let activeSub = null;
                 if (el.subtitles && el.subtitles.length > 0) {
                     for (let i = 0; i < el.subtitles.length; i++) {
                         if (currentT >= el.subtitles[i].start && currentT <= el.subtitles[i].end) {
                             activeSub = el.subtitles[i];
                             break;
                         }
                     }
                 }
                 if (activeSub) {
                   textToRender = activeSub.text;
                 } else if (!isPlaying) {
                   textToRender = 'Teks Baru';
                 } else {
                   ctx.restore();
                   continue;
                 }
            }`;

if (code.includes(target1)) {
    console.log("Subtitle logic overwrite is the issue!");
} else {
    console.log("Not finding the subtitle logic area.");
}

const targetCheck = `            let alpha = 1;
            
            let textToRender = (el as any).text || '';`;

if (code.includes(targetCheck)) {
    console.log("Target textToRender logic found.");
}
