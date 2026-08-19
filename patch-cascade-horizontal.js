import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetRegex = /\} else if \(el\.templateStyle === 'arabic_cascade'\) \{[\s\S]*?\} else if \(el\.templateStyle === 'tiktok_karaoke'\) \{/;

const replacement = `} else if (el.templateStyle === 'arabic_cascade') {
                  const words = line.split(' ').filter(w => w.trim() !== '');
                  const totalWords = words.length;
                  
                  const allWords = textToRender.split(/\\s+/).filter(w => w.trim() !== '');
                  const globalTotalWords = allWords.length;
                  const globalActiveWordIdx = Math.min(globalTotalWords - 1, Math.floor(progress * globalTotalWords));
                  
                  let startWordIdx = 0;
                  for(let k=0; k<i; k++) {
                      startWordIdx += lines[k].split(' ').filter(w => w.trim() !== '').length;
                  }
                  
                  const spaceWidth = ctx.measureText(' ').width;
                  const wordWidths = words.map(w => ctx.measureText(w).width);
                  const totalLineWidth = wordWidths.reduce((a, b) => a + b, 0) + Math.max(0, totalWords - 1) * spaceWidth;
                  
                  // RTL layout: Start drawing from the right edge of the centered line
                  let currentX = totalLineWidth / 2;
                  ctx.textAlign = 'center';
                  
                  words.forEach((word, wIdx) => {
                      const globalIdx = startWordIdx + wIdx;
                      const isActive = (globalIdx === globalActiveWordIdx);
                      
                      const wWidth = wordWidths[wIdx];
                      const wordCenterX = currentX - (wWidth / 2);
                      
                      ctx.save();
                      ctx.translate(wordCenterX, lineY);
                      
                      if (isActive) {
                          ctx.scale(1.15, 1.15);
                          ctx.fillStyle = el.color || '#FFFFFF'; // Sorotan warna kustom (atau putih)
                          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                          ctx.shadowBlur = 8;
                          ctx.shadowOffsetX = 0;
                          ctx.shadowOffsetY = 0;
                      } else {
                          ctx.fillStyle = '#FFFFFF'; 
                          ctx.shadowColor = 'rgba(0,0,0,0.6)';
                          ctx.shadowBlur = 4;
                          ctx.shadowOffsetX = 1;
                          ctx.shadowOffsetY = 1;
                      }
                      
                      ctx.fillText(word, 0, 0);
                      ctx.restore();
                      
                      currentX -= (wWidth + spaceWidth);
                  });
                } else if (el.templateStyle === 'tiktok_karaoke') {`;

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Arabic Cascade updated to horizontal multi-line RTL");
} else {
    console.log("Could not find arabic_cascade block");
}
