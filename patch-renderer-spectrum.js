import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetStr = `} else if (style === 'segmented') {`;
const replaceStr = `} else if (style === 'spectrum') {
                 // Rainbow Spectrum Bars
                 const spectrumGrad = ctx.createLinearGradient(startX, 0, startX + width, 0);
                 spectrumGrad.addColorStop(0, '#3b82f6');    // Blue
                 spectrumGrad.addColorStop(0.15, '#a855f7'); // Purple
                 spectrumGrad.addColorStop(0.3, '#ec4899');  // Pink
                 spectrumGrad.addColorStop(0.5, '#eab308');  // Yellow
                 spectrumGrad.addColorStop(0.65, '#22c55e'); // Green
                 spectrumGrad.addColorStop(0.85, '#ef4444'); // Red
                 spectrumGrad.addColorStop(1, '#3b82f6');    // Blue

                 for (let i = 0; i < barCount; i++) {
                     const barProg = barCount > 1 ? i / (barCount - 1) : 0;
                     const isPast = barProg <= prog;
                     const freqIdx = Math.floor((i / barCount) * Math.min(freqLength, 96));
                     const val = freqData[freqIdx] || 0;
                     const amp = val / 255;
                     const bh = Math.max(2, amp * maxBarHeight + (bassAvg * 4));
                     
                     const bx = startX + i * barStep;
                     const by = -trackHeight / 2 - wOffset;
                     
                     if (isPast) {
                         ctx.fillStyle = spectrumGrad;
                         if (glow > 0) {
                             ctx.shadowBlur = glow * (0.5 + amp * 0.5);
                             ctx.shadowColor = el.color || '#ffffff';
                         }
                     } else {
                         ctx.fillStyle = trackColor;
                         ctx.shadowBlur = 0;
                     }
                     
                     ctx.beginPath();
                     ctx.roundRect(bx, by, barWidth, -bh, barWidth / 2);
                     ctx.fill();
                 }
                 ctx.shadowBlur = 0;
             } else if (style === 'segmented') {`;

if (code.includes(targetStr) && !code.includes(`style === 'spectrum'`)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("CanvasRenderer.tsx patched to render Spectrum Bars");
} else {
    console.log("Spectrum render logic already exists or target string not found in CanvasRenderer.tsx");
}
