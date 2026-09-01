import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetStr = `} else if (style === 'dots') {`;
const replaceStr = `} else if (style === 'segmented') {
                 // Render segmented LED-style blocks
                 const segmentHeight = 4; // Height of each small block
                 const segmentGap = 2;    // Vertical gap between blocks
                 const stepHeight = segmentHeight + segmentGap;
                 
                 for (let i = 0; i < barCount; i++) {
                     const barProg = barCount > 1 ? i / (barCount - 1) : 0;
                     const isPast = barProg <= prog;
                     const freqIdx = Math.floor((i / barCount) * Math.min(freqLength, 96));
                     const val = freqData[freqIdx] || 0;
                     
                     // Minimum 1 block, calculate max blocks based on maxBarHeight
                     const amp = val / 255;
                     const targetTotalHeight = Math.max(stepHeight, amp * maxBarHeight + (bassAvg * 4));
                     const activeSegments = Math.ceil(targetTotalHeight / stepHeight);
                     
                     const bx = startX + i * barStep;
                     
                     for (let s = 0; s < activeSegments; s++) {
                         // Calculate Y position for each segment going upwards
                         const by = -trackHeight / 2 - 2 - (s * stepHeight) - segmentHeight;
                         
                         if (isPast) {
                             ctx.fillStyle = getStyle(el, -width/2, 0, width/2, 0);
                             if (glow > 0) {
                                 ctx.shadowBlur = glow * (0.6 + amp * 0.4);
                                 ctx.shadowColor = el.color || '#3b82f6';
                             }
                         } else {
                             ctx.fillStyle = trackColor;
                             ctx.shadowBlur = 0;
                         }
                         
                         ctx.beginPath();
                         // Draw small rectangular block
                         ctx.rect(bx, by, barWidth, segmentHeight);
                         ctx.fill();
                     }
                 }
                 ctx.shadowBlur = 0;
             } else if (style === 'dots') {`;

if (code.includes(targetStr) && !code.includes(`style === 'segmented'`)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("CanvasRenderer.tsx patched to render Segmented Blocks");
} else {
    console.log("Segmented render logic already exists or target string not found in CanvasRenderer.tsx");
}
