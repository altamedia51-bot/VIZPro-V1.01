import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target1 = `            let textToRender = '';
            let activeSub = null;
            if (el.type === 'subtitle') {
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
            } else {
               textToRender = (el as any).text || '';
            }`;

const targetAlt = `            let textToRender = (el as any).text || '';
            let activeSub: any = null;
            if (el.type === 'subtitle') {
                 // ... (We need to replace this block carefully)
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

const realTarget = `            let textToRender = (el as any).text || '';
            let activeSub: any = null;
            
            if (el.type === 'subtitle') {
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

// Let's just find exactly what is there
const lines = code.split('\\n');
const startIndex = lines.findIndex(l => l.includes("let textToRender"));
if (startIndex !== -1) {
    console.log("Lines around textToRender:");
    for(let i=startIndex-2; i<startIndex+20; i++) {
        console.log(lines[i]);
    }
}
