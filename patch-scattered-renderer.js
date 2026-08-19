import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetStr = `} else if (el.templateStyle === 'tiktok_karaoke') {`;

const replaceStr = `} else if (el.templateStyle === 'scattered') {
                  const words = line.split(' ');
                  const totalWords = words.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  const wordLineHeight = el.fontSize * 0.9; 
                  const groupStartY = lineY - ((totalWords - 1) * wordLineHeight) / 2;
                  
                  ctx.textAlign = 'center';
                  
                  words.forEach((word, wIdx) => {
                      const isActive = (wIdx === activeWordIndex);
                      
                      let staggerX = 0;
                      if (totalWords === 3) {
                          if (wIdx === 0) staggerX = el.fontSize * 1.2;
                          else if (wIdx === 1) staggerX = 0;
                          else staggerX = -el.fontSize * 1.2;
                      } else if (totalWords === 4) {
                          if (wIdx === 0) staggerX = -el.fontSize * 0.8;
                          else if (wIdx === 1) staggerX = el.fontSize * 0.8;
                          else if (wIdx === 2) staggerX = -el.fontSize * 0.6;
                          else staggerX = 0;
                      } else {
                          if (wIdx % 2 === 0) staggerX = -el.fontSize * 0.8;
                          else staggerX = el.fontSize * 0.8;
                      }
                      
                      if (isActive) staggerX *= 0.3;
                      
                      const wY = groupStartY + wIdx * wordLineHeight;
                      
                      ctx.save();
                      ctx.translate(staggerX, wY);
                      
                      const wordProgress = (progress * totalWords) - wIdx;
                      let scale = 0.75; 
                      
                      if (isActive) {
                         scale = 1.0 + Math.sin(Math.max(0, Math.min(1, wordProgress)) * Math.PI) * 0.6;
                         ctx.fillStyle = el.color || '#E31B1B'; 
                         ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                         ctx.shadowBlur = 4;
                      } else {
                         ctx.fillStyle = '#FFFFFF'; 
                         ctx.shadowColor = 'rgba(0,0,0,0.5)';
                         ctx.shadowBlur = 4;
                         ctx.shadowOffsetX = 2;
                         ctx.shadowOffsetY = 2;
                      }
                      
                      ctx.scale(scale, scale);
                      ctx.fillText(word, 0, 0);
                      ctx.restore();
                  });
                } else if (el.templateStyle === 'tiktok_karaoke') {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Renderer patched");
}
