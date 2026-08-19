import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

// FIX HIGHLIGHT_POP
const hpRegex = /} else if \(el\.templateStyle === 'highlight_pop'\) \{[\s\S]*?ctx\.font = `italic 900 \${el\.fontSize}px \${el\.fontFamily}`;/m;
const hpReplace = `} else if (el.templateStyle === 'highlight_pop') {
                  // highlight_pop: active word is larger, tilted, colored. Others are white.
                  const words = line.split(' ');
                  const totalWords = words.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  let currentX = 0;
                  ctx.font = \`italic 900 \${el.fontSize}px \${el.fontFamily}\`;`;
code = code.replace(hpRegex, hpReplace);

// FIX SCATTERED
const scatRegex = /} else if \(el\.templateStyle === 'scattered'\) \{[\s\S]*?} else if \(el\.templateStyle === 'tiktok_karaoke'\) \{/m;
const scatReplace = `} else if (el.templateStyle === 'scattered') {
                  const words = line.split(' ');
                  const totalWords = words.length;
                  
                  const isArabic = /[\\u0600-\\u06FF\\u0750-\\u077F]/.test(line);
                  const activeAudioIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  const wordLineHeight = el.fontSize * 0.9; 
                  const groupStartY = lineY - ((totalWords - 1) * wordLineHeight) / 2;
                  
                  ctx.textAlign = 'center';
                  
                  words.forEach((word, audioIdx) => {
                      const isActive = (audioIdx === activeAudioIndex);
                      
                      let staggerX = 0;
                      const wY = groupStartY + audioIdx * wordLineHeight;
                      const isRightSided = isArabic ? (audioIdx % 2 === 0) : (audioIdx % 2 !== 0);
                      
                      if (totalWords === 3) {
                          if (audioIdx === 0) staggerX = el.fontSize * 1.2;
                          else if (audioIdx === 1) staggerX = 0;
                          else staggerX = -el.fontSize * 1.2;
                      } else if (totalWords === 4) {
                          if (audioIdx === 0) staggerX = -el.fontSize * 0.8;
                          else if (audioIdx === 1) staggerX = el.fontSize * 0.8;
                          else if (audioIdx === 2) staggerX = -el.fontSize * 0.6;
                          else staggerX = 0;
                      } else {
                          staggerX = isRightSided ? el.fontSize * 0.8 : -el.fontSize * 0.8;
                      }
                      
                      if (isActive) staggerX *= 0.3;
                      
                      ctx.save();
                      ctx.translate(staggerX, wY);
                      
                      const wordProgress = (progress * totalWords) - audioIdx;
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
code = code.replace(scatRegex, scatReplace);

fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
console.log("Cleanup applied");
