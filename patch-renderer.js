import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target = `                } else if (el.templateStyle === 'tiktok_karaoke') {`;

const replacement = `                } else if (el.templateStyle === 'popup_words') {
                  const words = line.split(' ');
                  const totalWords = words.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));

                  const totalWidth = ctx.measureText(line).width;
                  let currentX = isArabic ? (totalWidth / 2) : (-totalWidth / 2);
                  
                  ctx.textAlign = 'center';

                  words.forEach((word, wIdx) => {
                    const wordWidth = ctx.measureText(word).width;
                    const spaceWidth = ctx.measureText(' ').width;

                    const centerX = isArabic ? (currentX - wordWidth/2) : (currentX + wordWidth/2);

                    ctx.save();
                    ctx.translate(centerX, lineY);
                    
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    ctx.lineWidth = Math.max(2, el.fontSize * 0.1);
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#000000';

                    if (wIdx === activeWordIndex) {
                      ctx.fillStyle = el.color || '#FFFF00'; 
                      
                      const wordProgress = (progress * totalWords) - wIdx;
                      let scale = 1.0;
                      if (wordProgress >= 0 && wordProgress <= 1) {
                         scale = 1.0 + Math.sin(wordProgress * Math.PI) * 0.3; 
                      }
                      
                      ctx.scale(scale, scale);
                      
                      ctx.strokeText(word, 0, 0);
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 0;
                      ctx.fillText(word, 0, 0);
                    } else {
                      ctx.fillStyle = '#FFFFFF'; 
                      ctx.strokeText(word, 0, 0);
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 0;
                      ctx.fillText(word, 0, 0);
                    }

                    ctx.restore();

                    if (isArabic) {
                        currentX -= (wordWidth + spaceWidth);
                    } else {
                        currentX += (wordWidth + spaceWidth);
                    }
                  });
                } else if (el.templateStyle === 'tiktok_karaoke') {`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Renderer patched successfully");
} else {
    console.log("Target not found!");
}
