import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetStr = `} else if (el.templateStyle === 'tiktok_karaoke') {`;

const replaceStr = `} else if (el.templateStyle === 'arabic_cascade') {
                  const words = line.split(' ');
                  const totalWords = words.length;
                  const activeAudioIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  const wordLineHeight = el.fontSize * 1.3; 
                  const groupStartY = lineY - ((totalWords - 1) * wordLineHeight) / 2;
                  
                  ctx.textAlign = 'center';
                  
                  words.forEach((word, audioIdx) => {
                      const isActive = (audioIdx === activeAudioIndex);
                      
                      // Susun vertikal dan geser rata kanan (diagonal ke kiri bawah)
                      // AudioIdx 0 (kata pertama) ada di paling atas (groupStartY) dan paling kanan
                      const staggerX = ((totalWords - 1) / 2 - audioIdx) * (el.fontSize * 0.4);
                      const wY = groupStartY + audioIdx * wordLineHeight;
                      
                      ctx.save();
                      ctx.translate(staggerX, wY);
                      
                      let scale = 1.0; 
                      if (isActive) {
                         scale = 1.25;
                         ctx.fillStyle = el.color || '#E31B1B'; 
                         ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                         ctx.shadowBlur = 6;
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

if (code.includes(targetStr) && !code.includes('arabic_cascade')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Renderer patched for Arabic Cascade");
}
