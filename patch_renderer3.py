import re

with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

# 1. Update the string drawing block to include the ring
old_string_block = """              // Draw hanging string if templateStyle is hanging
              if ((el as any).isHanging) {
                 ctx.save();
                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                 ctx.lineWidth = 1.5;
                 ctx.beginPath();
                 
                 const ringOuter = 8;
                 const topOfText = startY - el.fontSize * 0.38;
                 const ringY = topOfText - ringOuter * 0.6;
                 
                 // string from far up to the top of the ring
                 // Extend well past the top of the screen to ensure it never looks cut off
                 ctx.moveTo(0, -(finalY - swayLift) - 2000);
                 ctx.lineTo(0, ringY - ringOuter);
                 ctx.stroke();
                 
                 ctx.restore();
              }"""

new_string_block = """              // Draw hanging string if templateStyle is hanging
              if ((el as any).isHanging) {
                 ctx.save();
                 ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                 ctx.lineWidth = 1.5;
                 ctx.beginPath();
                 
                 const ringOuter = 8;
                 const ringInner = 3;
                 const topOfText = startY - el.fontSize * 0.38;
                 const ringY = topOfText - ringOuter * 0.6;
                 
                 // string from far up to the top of the ring
                 // Extend well past the top of the screen to ensure it never looks cut off
                 ctx.moveTo(0, -(finalY - swayLift) - 2000);
                 ctx.lineTo(0, ringY - ringOuter);
                 ctx.stroke();
                 
                 // Draw ring extrusion
                 const textColor = el.color || '#FFFFFF';
                 let r = 200, g = 200, b = 200;
                 if (textColor.startsWith('#') && textColor.length === 7) {
                   r = parseInt(textColor.slice(1,3), 16);
                   g = parseInt(textColor.slice(3,5), 16);
                   b = parseInt(textColor.slice(5,7), 16);
                 }
                 const extrudeColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;
                 
                 const extrudeDepth = Math.max(4, Math.floor(el.fontSize * 0.12));
                 ctx.fillStyle = extrudeColor;
                 for(let j = extrudeDepth; j >= 1; j--) {
                     if (j === extrudeDepth) {
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 12;
                        ctx.shadowOffsetX = 4;
                        ctx.shadowOffsetY = 8;
                     } else {
                        ctx.shadowBlur = 0;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                     }
                     ctx.beginPath();
                     ctx.arc(0, ringY + j, ringOuter, 0, Math.PI * 2, false);
                     ctx.arc(0, ringY + j, ringInner, 0, Math.PI * 2, true);
                     ctx.fill();
                 }
                 
                 // Draw ring front
                 ctx.shadowBlur = 0;
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 0;
                 ctx.fillStyle = el.useGradient ? getStyle(el, -ringOuter, ringY, ringOuter, ringY) : textColor;
                 ctx.beginPath();
                 ctx.arc(0, ringY, ringOuter, 0, Math.PI * 2, false);
                 ctx.arc(0, ringY, ringInner, 0, Math.PI * 2, true);
                 ctx.fill();
                 
                 ctx.restore();
              }"""

content = content.replace(old_string_block, new_string_block)

# 2. Update the else if ((el as any).isHanging) to only render 3D text and remove ring
old_text_hanging = """                } else if ((el as any).isHanging) {
                  const textColor = el.color || '#FFFFFF';
                  const extrudeDepth = Math.max(4, Math.floor(el.fontSize * 0.12));
                  const ringOuter = 8;
                  const ringInner = 3;
                  const topOfText = startY - el.fontSize * 0.38;
                  const ringY = topOfText - ringOuter * 0.6; // Sink the ring slightly into the text
                  
                  // Parse color to make darker shade
                  let r = 200, g = 200, b = 200;
                  if (textColor.startsWith('#') && textColor.length === 7) {
                    r = parseInt(textColor.slice(1,3), 16);
                    g = parseInt(textColor.slice(3,5), 16);
                    b = parseInt(textColor.slice(5,7), 16);
                  }
                  
                  // Extrusion color (darker)
                  const extrudeColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;
                  
                  ctx.save();
                  
                  // Draw extrusion layers from back to front
                  for(let j = extrudeDepth; j >= 1; j--) {
                      ctx.fillStyle = extrudeColor;
                      
                      // Add shadow only to the furthest back layer
                      if (j === extrudeDepth) {
                         ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                         ctx.shadowBlur = 12;
                         ctx.shadowOffsetX = 4;
                         ctx.shadowOffsetY = 8;
                      } else {
                         ctx.shadowBlur = 0;
                         ctx.shadowOffsetX = 0;
                         ctx.shadowOffsetY = 0;
                      }
                      
                      // Draw ring extrusion on the first line
                      if (i === 0) {
                         ctx.beginPath();
                         ctx.arc(0, ringY + j, ringOuter, 0, Math.PI * 2, false);
                         ctx.arc(0, ringY + j, ringInner, 0, Math.PI * 2, true);
                         ctx.fill();
                      }
                      
                      ctx.fillText(line, 0, lineY + j);
                  }
                  
                  // Draw front face
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  const lineWidth = ctx.measureText(line).width;
                  ctx.fillStyle = el.useGradient ? getStyle(el, -lineWidth/2, lineY, lineWidth/2, lineY) : textColor;
                  
                  // Draw ring front
                  if (i === 0) {
                     ctx.beginPath();
                     ctx.arc(0, ringY, ringOuter, 0, Math.PI * 2, false);
                     ctx.arc(0, ringY, ringInner, 0, Math.PI * 2, true);
                     ctx.fill();
                  }
                  
                  ctx.fillText(line, 0, lineY);
                  ctx.restore();"""

new_text_hanging = """                } else if ((el as any).isHanging && (!el.templateStyle || el.templateStyle === 'default')) {
                  const textColor = el.color || '#FFFFFF';
                  const extrudeDepth = Math.max(4, Math.floor(el.fontSize * 0.12));
                  
                  // Parse color to make darker shade
                  let r = 200, g = 200, b = 200;
                  if (textColor.startsWith('#') && textColor.length === 7) {
                    r = parseInt(textColor.slice(1,3), 16);
                    g = parseInt(textColor.slice(3,5), 16);
                    b = parseInt(textColor.slice(5,7), 16);
                  }
                  
                  // Extrusion color (darker)
                  const extrudeColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;
                  
                  ctx.save();
                  
                  // Draw extrusion layers from back to front
                  for(let j = extrudeDepth; j >= 1; j--) {
                      ctx.fillStyle = extrudeColor;
                      
                      // Add shadow only to the furthest back layer
                      if (j === extrudeDepth) {
                         ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                         ctx.shadowBlur = 12;
                         ctx.shadowOffsetX = 4;
                         ctx.shadowOffsetY = 8;
                      } else {
                         ctx.shadowBlur = 0;
                         ctx.shadowOffsetX = 0;
                         ctx.shadowOffsetY = 0;
                      }
                      
                      ctx.fillText(line, 0, lineY + j);
                  }
                  
                  // Draw front face
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  const lineWidth = ctx.measureText(line).width;
                  ctx.fillStyle = el.useGradient ? getStyle(el, -lineWidth/2, lineY, lineWidth/2, lineY) : textColor;
                  
                  ctx.fillText(line, 0, lineY);
                  ctx.restore();"""

content = content.replace(old_text_hanging, new_text_hanging)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)

