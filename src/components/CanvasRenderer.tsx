import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Project, VizElement } from '../types';

interface CanvasRendererProps {
  project: Project | null;
  getAudioData: () => { dataArray: Uint8Array; bufferLength: number };
  getWaveformData: () => { dataArray: Uint8Array; bufferLength: number };
  isPlaying: boolean;
  isRecording?: boolean;
  currentTime?: number;
  selectedElementId?: string | null;
  onUpdateElement?: (id: string, updates: Partial<VizElement>) => void;
  onSelectElement?: (id: string | null) => void;
}

export interface CanvasRendererRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const CanvasRenderer = forwardRef<CanvasRendererRef, CanvasRendererProps>(({ project, getAudioData, getWaveformData, isPlaying, isRecording = false, currentTime = 0, selectedElementId, onUpdateElement, onSelectElement }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [renderCount, setRenderCount] = useState(0);
  const dragOffset = useRef({ x: 0, y: 0 });
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!project || !onUpdateElement) return;
    const { x, y } = getMousePos(e);
    
    // Reverse array to hit top-most elements first
    const elements = [...project.elements].reverse();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    for (const el of elements) {
      // Hit test only active elements
      if (el.startTime !== undefined && currentTime < el.startTime) continue;
      if (el.endTime !== undefined && currentTime > el.endTime) continue;
      
      let hit = false;
      const elScale = el.scale || 1;
      
      if (el.type === 'circle' || el.type === 'double_circle' || el.type === 'circular_spectrum' || el.type === 'bass_pulse' || el.type === 'triangle_spectrum' || el.type === 'diamond_spectrum' || el.type === 'glowing_ring') {
        const dx = x - el.x;
        const dy = y - el.y;
        hit = Math.sqrt(dx * dx + dy * dy) <= el.radius * elScale;
      } else if (el.type === 'image') {
        const imgEl = el as any;
        const w = (imgEl.width || 48) * elScale;
        const h = (imgEl.height || 48) * elScale;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
      } else if ((el.type === 'text' || el.type === 'subtitle') && ctx) {
        ctx.font = `${el.fontSize}px ${el.fontFamily}`;
        const textToMeasure = el.type === 'text' ? el.text : 'Subtitle Text';
        const metrics = ctx.measureText(textToMeasure);
        const width = metrics.width * elScale;
        const height = el.fontSize * elScale;
        hit = x >= el.x - width / 2 && x <= el.x + width / 2 && y >= el.y - height / 2 && y <= el.y + height / 2;
      } else if (el.type === 'bars' || el.type === 'symmetrical_mirror' || el.type === 'mirrored_bars') {
        // symmetrical mirror has bar spacing too, roughly the same width
        const totalWidth = 64 * (el.barWidth + el.barSpacing) * elScale;
        const h = el.height * elScale;
        hit = x >= el.x - totalWidth / 2 && x <= el.x + totalWidth / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
      } else if (el.type === 'waveform' || el.type === 'smooth_curve' || el.type === 'multi_sine' || el.type === 'single_sine' || el.type === 'flames' || el.type === 'line_glow') {
        const w = (el.width || 600) * elScale;
        const h = (el.height || 100) * elScale;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
      } else if (el.type === 'particles' || el.type === 'orbs' || el.type === 'spiral_galaxy') {
        const dx = x - el.x;
        const dy = y - el.y;
        const radius = el.type === 'orbs' || el.type === 'spiral_galaxy' ? el.radius : 150;
        hit = Math.sqrt(dx * dx + dy * dy) <= radius * elScale;
      } else if (el.type === 'neon_grid' || el.type === 'rain') {
        const w = (canvasRef.current?.width || canvas.width) * elScale;
        const h = (canvasRef.current?.height || canvas.height) * elScale;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
      }
      
      if (hit) {
        setDraggingId(el.id);
        dragOffset.current = { x: x - el.x, y: y - el.y };
        if (onSelectElement) onSelectElement(el.id);
        return;
      }
    }
    
    // if nothing hit
    if (onSelectElement) onSelectElement(null);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingId && onUpdateElement) {
      // Prevent default to stop pull-to-refresh on mobile if dragging
      // e.preventDefault(); 
      const { x, y } = getMousePos(e);
      onUpdateElement(draggingId, {
        x: Math.round(x - dragOffset.current.x),
        y: Math.round(y - dragOffset.current.y)
      });
    }
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }));

  useEffect(() => {
    // Cleanup previous video if exists
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.removeAttribute('src');
      bgVideoRef.current.load();
      bgVideoRef.current = null;
    }
    bgImageRef.current = null;

    if (project?.backgroundConfig.type === 'image' && project.backgroundConfig.value) {
      const img = new Image();
      img.src = project.backgroundConfig.value;
      img.onload = () => {
        bgImageRef.current = img;
      };
    } else if (project?.backgroundConfig.type === 'video' && project.backgroundConfig.value) {
      const vid = document.createElement('video');
      vid.src = project.backgroundConfig.value;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') {
            console.error("Error playing background video:", e);
          }
        });
      }
      bgVideoRef.current = vid;
    }
  }, [project?.backgroundConfig]);

  useEffect(() => {
    if (bgVideoRef.current) {
      if (isPlaying) {
        const playPromise = bgVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') {
              console.error("Error playing video:", e);
            }
          });
        }
      } else {
        bgVideoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution based on project setting, default to 1280x720
    const res = project?.resolution || { width: 1280, height: 720 };
    canvas.width = res.width;
    canvas.height = res.height;

    const draw = () => {
      // Always draw to keep canvas updated even if not playing
      animationRef.current = requestAnimationFrame(draw);

      // Draw Background
      ctx.save();
      const bgConf = project?.backgroundConfig;
      
      if (bgConf) {
        let filterStr = '';
        if (bgConf.blur) filterStr += `blur(${bgConf.blur}px) `;
        if (bgConf.brightness !== undefined) filterStr += `brightness(${bgConf.brightness}%) `;
        if (bgConf.contrast !== undefined) filterStr += `contrast(${bgConf.contrast}%) `;
        if (filterStr) {
          ctx.filter = filterStr.trim();
        }
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (bgConf?.type === 'image' && bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
      } else if (bgConf?.type === 'video' && bgVideoRef.current) {
        ctx.drawImage(bgVideoRef.current, 0, 0, canvas.width, canvas.height);
      } else if (bgConf?.type === 'solid_color' || bgConf?.type === 'color' as any) {
        ctx.fillStyle = bgConf?.value || '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgConf?.type === 'linear_gradient') {
         const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
         grad.addColorStop(0, bgConf.color1 || '#1a1a2e');
         grad.addColorStop(1, bgConf.color2 || '#e94560');
         ctx.fillStyle = grad;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgConf?.type === 'minimal_grid') {
         ctx.fillStyle = bgConf.value || '#0a0a0a';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
         ctx.lineWidth = 1;
         for (let i = 0; i < canvas.width; i += 40) {
           ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
         }
         for (let i = 0; i < canvas.height; i += 40) {
           ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
         }
      } else if (bgConf?.type === 'cyber_grid') {
         ctx.fillStyle = '#050510';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
         ctx.lineWidth = 1;
         const time = performance.now() * 0.002;
         const lines = 30;
         const cx = canvas.width / 2;
         const cy = canvas.height / 2;
         for (let i = 0; i <= lines; i++) {
            const xTop = cx - canvas.width + (i * (canvas.width * 2 / lines));
            const xBot = cx + (xTop - cx) * 2;
            ctx.beginPath();
            ctx.moveTo(xTop, cy);
            ctx.lineTo(xBot, canvas.height);
            ctx.stroke();
         }
         for (let i = 0; i < 15; i++) {
            const yOffset = ((i * (cy/15) + time * 50) % cy);
            const yPos = cy + yOffset;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvas.width, yPos);
            ctx.stroke();
         }
      } else if (bgConf?.type === 'particle_starfield') {
         ctx.fillStyle = '#000000';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.fillStyle = '#ffffff';
         const time = performance.now() * 0.05;
         for (let i = 0; i < 150; i++) {
           const px = (i * 123 + time * ((i % 3) + 1)) % canvas.width;
           const py = (i * 321 + time * 0.5) % canvas.height;
           const size = (i % 3) * 0.5 + 0.5;
           ctx.beginPath();
           ctx.arc(px, py, size, 0, 2 * Math.PI);
           ctx.fill();
         }
      } else if (bgConf?.type === 'animated_gradient') {
         const time = performance.now() * 0.001;
         const x1 = Math.sin(time) * canvas.width;
         const y1 = Math.cos(time) * canvas.height;
         const x2 = canvas.width - x1;
         const y2 = canvas.height - y1;
         const grad = ctx.createLinearGradient(x1, y1, x2, y2);
         grad.addColorStop(0, '#ff0080');
         grad.addColorStop(0.5, '#7928ca');
         grad.addColorStop(1, '#00b4d8');
         ctx.fillStyle = grad;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();

      // Vignette effect
      if (bgConf?.vignette && bgConf.vignette > 0) {
        ctx.save();
        const outerRadius = Math.max(canvas.width, canvas.height) * 0.75;
        const innerRadius = outerRadius * (1 - (bgConf.vignette / 100));
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, innerRadius,
          canvas.width / 2, canvas.height / 2, outerRadius
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${bgConf.vignette / 100})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      const { dataArray: freqData, bufferLength: freqLength } = getAudioData();
      const { dataArray: waveData, bufferLength: waveLength } = getWaveformData();

      const getStyle = (el: any, x1: number, y1: number, x2: number, y2: number) => {
        if (el.useGradient) {
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, el.color || '#ffffff');
          grad.addColorStop(1, el.color2 || '#00ffff');
          return grad;
        }
        return el.color || '#ffffff';
      };

      // Draw Elements
      if (project?.elements) {
        for (const el of project.elements) {
          // Skip if element is not active at current time
          if (el.startTime !== undefined && currentTimeRef.current < el.startTime) continue;
          if (el.endTime !== undefined && currentTimeRef.current > el.endTime) continue;

          ctx.save();
          ctx.globalAlpha = el.opacity;
          
          ctx.translate(el.x, el.y);
          if (el.rotation) {
            ctx.rotate(el.rotation * Math.PI / 180);
          }
          if (el.scale && el.scale !== 1) {
            ctx.scale(el.scale, el.scale);
          }
          ctx.translate(-el.x, -el.y);
          
          if (el.type === 'bars') {
            const barCount = Math.min(64, freqLength);
            const totalWidth = barCount * (el.barWidth + el.barSpacing);
            let startX = el.x - totalWidth / 2;
            
            ctx.fillStyle = getStyle(el, el.x - totalWidth / 2, el.y, el.x + totalWidth / 2, el.y);
            
            for (let i = 0; i < barCount; i++) {
              const value = freqData[i] || 0;
              const barHeight = (value / 255) * el.height;
              
              ctx.fillRect(startX, el.y - barHeight / 2, el.barWidth, barHeight);
              startX += el.barWidth + el.barSpacing;
            }
          } 
          else if (el.type === 'circle') {
            const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
            const radiusPulse = el.radius + (averageFreq / 255) * 50;
            
            ctx.beginPath();
            ctx.arc(el.x, el.y, radiusPulse, 0, 2 * Math.PI);
            ctx.strokeStyle = getStyle(el, el.x - radiusPulse, el.y - radiusPulse, el.x + radiusPulse, el.y + radiusPulse);
            ctx.lineWidth = el.lineWidth;
            ctx.stroke();
          }
          else if (el.type === 'image') {
              const imgEl = el as any;
              let img = imageCacheRef.current[imgEl.src];
              if (!img) {
                img = new Image();
                img.src = imgEl.src;
                img.onload = () => {
                    setRenderCount(c => c + 1);
                };
                imageCacheRef.current[imgEl.src] = img;
              }
              
              if (img.complete && img.naturalWidth > 0) {
                ctx.save();
                ctx.translate(el.x, el.y);
                ctx.rotate((el.rotation * Math.PI) / 180);
                ctx.scale(el.scale, el.scale);
                ctx.globalAlpha = el.opacity;
                
                ctx.drawImage(img, -imgEl.width / 2, -imgEl.height / 2, imgEl.width, imgEl.height);
                
                if (!isRecording && selectedElementId === el.id) {
                   ctx.strokeStyle = '#3b82f6';
                   ctx.lineWidth = 2 / el.scale;
                   ctx.strokeRect(-imgEl.width / 2 - 2, -imgEl.height / 2 - 2, imgEl.width + 4, imgEl.height + 4);
                }
                
                ctx.restore();
              }
          }
          else if (el.type === 'text' || el.type === 'subtitle') {
            const time = performance.now();
            let finalY = el.y;
            let finalScale = 1;
            let alpha = 1;
            
            let textToRender = '';
            let activeSub: any = null;
            const currentT = currentTimeRef.current;
            if (el.type === 'text') {
              textToRender = el.text;
              if (el.animation === 'glow_pulse') {
                const pulse = Math.sin(time * 0.003) * 0.5 + 0.5;
                ctx.shadowBlur = 10 + pulse * 20;
                ctx.shadowColor = el.color;
              } else if (el.animation === 'bounce') {
                finalY = el.y + Math.sin(time * 0.005) * 15;
              } else if (el.animation === 'wave') {
                const waveFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
                finalScale = 1 + (waveFreq / 255) * 0.2;
              } else if (el.animation === 'drop_bounce') {
                const elapsed = currentT - (el.startTime || 0);
                // Animate for the first 1.5 seconds
                if (elapsed < 1.5 && elapsed >= 0) {
                  // Damped sine wave: e^(-decay * t) * cos(freq * t)
                  const startOffset = -600; // Drop from 600px above
                  const decay = 3;
                  const freq = 10;
                  const offset = startOffset * Math.exp(-decay * elapsed) * Math.cos(freq * elapsed);
                  finalY = el.y + offset;
                }
              }
            } else if (el.type === 'subtitle') {
              activeSub = project?.subtitles?.find(s => currentT >= s.start && currentT <= s.end);
              textToRender = activeSub ? activeSub.text : '';
                  
              if ((el as any).shadowBlur) {
                ctx.shadowBlur = (el as any).shadowBlur;
                ctx.shadowColor = (el as any).shadowColor || '#000000';
              }
            }
               
            if (!textToRender) {
                 if (!isRecording && el.type === 'text' && (draggingId === el.id || selectedElementId === el.id)) {
                   textToRender = 'Teks Baru';
                 } else {
                   continue;
                 }
            }

            if (el.textCase) {
                if (el.textCase === 'uppercase') {
                  textToRender = textToRender.toUpperCase();
                } else if (el.textCase === 'lowercase') {
                  textToRender = textToRender.toLowerCase();
                } else if (el.textCase === 'capitalize') {
                  textToRender = textToRender.replace(/\b\w/g, c => c.toUpperCase());
                }
            }

              ctx.font = `${el.fontSize}px ${el.fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const isArabic = /[؀-ۿ]/.test(textToRender);
              ctx.direction = isArabic ? 'rtl' : 'ltr';
                 
              if (el.letterSpacing) {
                 ctx.letterSpacing = `${el.letterSpacing}px`;
              }

              const width = ctx.measureText(textToRender).width;
              ctx.globalAlpha = el.opacity * alpha;
              
              let progress = 0;
              if (activeSub) {
                progress = Math.max(0, Math.min(1, (currentT - activeSub.start) / (activeSub.end - activeSub.start)));
              }

              ctx.save();
              
              let swayAngle = 0;
              let swayDepth = 0;
              let swayLift = 0;
              if (el.templateStyle === 'hanging') {
                 // sway like a pendulum
                 swayAngle = Math.sin(time * 0.002) * 0.06; // Left/right swing
                 
                 // Simulate forward/backward swing by scaling and slightly lifting
                 swayDepth = Math.sin(time * 0.0013) * 0.12; 
                 swayLift = Math.abs(swayDepth) * 30; // Lifts up when swinging away/towards
                 
                 // pivot at the top of the screen (x = el.x, y = 0)
                 ctx.translate(el.x, 0);
                 ctx.rotate(swayAngle);
                 ctx.scale(1 + swayDepth, 1 + swayDepth);
                 ctx.translate(0, finalY - swayLift); // move down to el.y
              } else {
                 ctx.translate(el.x, finalY);
              }
              
              // Apply TikTok Pop-up animation
              if (el.templateStyle === 'tiktok_pop') {
                // scale from 0.5 to 1.0 very quickly at the beginning
                const popScale = progress < 0.1 ? 0.5 + (progress / 0.1) * 0.5 : 1.0;
                ctx.scale(popScale, popScale);
                // slight rotation wobble
                const rotation = Math.sin(progress * Math.PI * 4) * 0.05 * (1 - progress);
                ctx.rotate(rotation);
              } else if (finalScale !== 1) {
                ctx.scale(finalScale, finalScale);
              }

              const lines = textToRender.split('\n');
              const lineHeight = el.fontSize * 1.2;
              const startY = -(lines.length - 1) * lineHeight / 2;
              const paddingX = 20;
              const paddingY = 10;
              
              // Draw hanging string if templateStyle is hanging
              if (el.templateStyle === 'hanging') {
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
              }

              // Pre-render Backgrounds
              if (el.templateStyle === 'bubble_yellow' || el.templateStyle === 'bubble_black') {
                 lines.forEach((line, i) => {
                   const lineWidth = ctx.measureText(line).width;
                   ctx.fillStyle = el.templateStyle === 'bubble_yellow' ? '#FFD700' : 'rgba(0, 0, 0, 0.7)';
                   ctx.beginPath();
                   ctx.roundRect(-lineWidth/2 - paddingX, startY + i * lineHeight - el.fontSize/2 - paddingY, lineWidth + paddingX*2, el.fontSize + paddingY*2, el.templateStyle === 'bubble_yellow' ? 12 : 8);
                   ctx.fill();
                   
                   if (el.templateStyle === 'bubble_black') {
                     ctx.strokeStyle = el.color || '#FFFFFF';
                     ctx.lineWidth = 2;
                     ctx.stroke();
                   }
                 });
              }

              // Render text line by line
              lines.forEach((line, i) => {
                const lineY = startY + i * lineHeight;
                
                if (el.templateStyle === 'bubble_yellow') {
                  ctx.fillStyle = '#000000';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'bubble_black') {
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'neon') {
                  ctx.shadowBlur = 15;
                  ctx.shadowColor = el.color || '#00FFFF';
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  ctx.fillText(line, 0, lineY); // double fill for stronger neon
                } else if (el.templateStyle === 'glow_border') {
                  ctx.strokeStyle = el.color || '#FF00FF';
                  ctx.lineWidth = 2;
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = el.color || '#FF00FF';
                  ctx.strokeText(line, 0, lineY);
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'tiktok_pop' || el.templateStyle === 'tiktok_shadow') {
                  // TikTok text shadow
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.shadowColor = '#000000';
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 2;
                  ctx.shadowOffsetY = 2;
                  
                  if (el.templateStyle === 'tiktok_shadow') {
                    // Cyan and Red offset
                    ctx.shadowColor = 'transparent';
                    ctx.fillStyle = '#00FFFF';
                    ctx.fillText(line, -2, lineY);
                    ctx.fillStyle = '#FF0050';
                    ctx.fillText(line, 2, lineY);
                    ctx.fillStyle = el.color || '#FFFFFF';
                  }
                  
                  ctx.fillText(line, 0, lineY);
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                } else if (el.templateStyle === 'hanging') {
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
                  ctx.restore();
                  
                } else if (el.templateStyle === 'highlight_pop') {
                  // highlight_pop: active word is larger, tilted, colored. Others are white.
                  const words = line.split(' ');
                  const totalWords = words.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  let currentX = 0;
                  ctx.font = `italic 900 ${el.fontSize}px ${el.fontFamily}`;
                  ctx.textAlign = 'left';
                  
                  const totalWidth = ctx.measureText(line).width;
                  let startX = -totalWidth / 2;
                  
                  words.forEach((word, wIdx) => {
                    const wordWidth = ctx.measureText(word).width;
                    const spaceWidth = ctx.measureText(' ').width;
                    
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    // thick stroke
                    ctx.lineWidth = el.fontSize * 0.15;
                    ctx.strokeStyle = '#000000';
                    
                    if (wIdx === activeWordIndex) {
                      ctx.fillStyle = el.color || '#FFFF00'; // Default yellow
                      
                      ctx.save();
                      // translate to center of word
                      ctx.translate(startX + wordWidth/2, lineY);
                      ctx.rotate(-4 * Math.PI / 180); // slight tilt
                      ctx.scale(1.2, 1.2);
                      
                      // Draw stroke and fill
                      ctx.strokeText(word, -wordWidth/2, 0);
                      
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 0;
                      ctx.fillText(word, -wordWidth/2, 0);
                      ctx.restore();
                    } else {
                      ctx.fillStyle = '#FFFFFF';
                      
                      ctx.save();
                      ctx.translate(startX + wordWidth/2, lineY);
                      
                      ctx.strokeText(word, -wordWidth/2, 0);
                      
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 0;
                      ctx.fillText(word, -wordWidth/2, 0);
                      ctx.restore();
                    }
                    startX += wordWidth + spaceWidth;
                  });
                  ctx.textAlign = 'center'; // restore
                } else if (el.templateStyle === 'tiktok_karaoke') {
                  // Word by word highlighting
                  const words = line.split(' ');
                  const totalWords = words.length;
                  // For multi-line we simplify by distributing progress across all lines, 
                  // but here we just do it per line for simplicity or assume single line subtitle.
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  let currentX = 0;
                  // measure total width to center
                  const totalWidth = ctx.measureText(line).width;
                  let startX = -totalWidth / 2;
                  
                  ctx.textAlign = 'left';
                  words.forEach((word, wIdx) => {
                    const wordWidth = ctx.measureText(word).width;
                    const spaceWidth = ctx.measureText(' ').width;
                    
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    if (wIdx === activeWordIndex) {
                      ctx.fillStyle = el.color || '#00FF00'; // Highlight color
                      // pop the word
                      ctx.save();
                      ctx.translate(startX + wordWidth/2, lineY);
                      ctx.scale(1.1, 1.1);
                      ctx.fillText(word, -wordWidth/2, 0);
                      ctx.restore();
                    } else if (wIdx < activeWordIndex) {
                      ctx.fillStyle = el.color || '#00FF00'; // Already sung
                      ctx.fillText(word, startX, lineY);
                    } else {
                      ctx.fillStyle = '#FFFFFF'; // Upcoming
                      ctx.fillText(word, startX, lineY);
                    }
                    startX += wordWidth + spaceWidth;
                  });
                  ctx.textAlign = 'center'; // restore
                } else {
                  // Default
                  ctx.fillStyle = getStyle(el, -width/2, lineY, width/2, lineY);
                  ctx.fillText(line, 0, lineY);
                }
              });

              ctx.restore();
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              ctx.letterSpacing = '0px';
          }
          else if (el.type === 'waveform') {
             ctx.lineWidth = el.lineWidth;
             ctx.strokeStyle = getStyle(el, el.x - el.width / 2, el.y, el.x + el.width / 2, el.y);
             ctx.beginPath();
             
             const sliceWidth = el.width / waveLength;
             let x = el.x - el.width / 2;

             for (let i = 0; i < waveLength; i++) {
               const v = (waveData[i] || 128) / 128.0;
               const y = el.y + (v * el.height / 2) - (el.height / 2);

               if (i === 0) {
                 ctx.moveTo(x, y);
               } else {
                 ctx.lineTo(x, y);
               }
               x += sliceWidth;
             }
             ctx.stroke();
          }
          else if (el.type === 'particles') {
            const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
            const intensity = averageFreq / 255;
            const time = performance.now() * 0.001 * el.speed;
            
            ctx.fillStyle = getStyle(el, el.x - 300, el.y - 300, el.x + 300, el.y + 300);
            for (let i = 0; i < el.count; i++) {
              // Deterministic pseudo-random based on index
              const angle = (i * 137.5) * Math.PI / 180; 
              // Spread out over time and audio intensity
              const radius = ((i * 5 + time * 50) % 300) * (1 + intensity);
              const px = el.x + Math.cos(angle) * radius;
              const py = el.y + Math.sin(angle) * radius;
              
              // Map freq data to particle size
              const fIndex = i % freqLength;
              const size = ((freqData[fIndex] || 0) / 255) * 5 + 1;
              
              ctx.beginPath();
              ctx.arc(px, py, size, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
          else if (el.type === 'orbs') {
            for (let i = 0; i < el.count; i++) {
              const fIndex = Math.floor((i / el.count) * freqLength);
              const val = (freqData[fIndex] || 0) / 255;
              const angle = (i / el.count) * Math.PI * 2 + (performance.now() * 0.0005);
              const orbitRadius = el.radius + (val * 100);
              
              const ox = el.x + Math.cos(angle) * orbitRadius;
              const oy = el.y + Math.sin(angle) * orbitRadius;
              
              const orbSize = 5 + (val * 20);
              
              // Glow effect
              ctx.shadowColor = el.color;
              ctx.shadowBlur = 20 * val;
              
              ctx.beginPath();
              ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
              ctx.fillStyle = getStyle(el, el.x - orbitRadius, el.y - orbitRadius, el.x + orbitRadius, el.y + orbitRadius);
              ctx.fill();
              
              ctx.shadowBlur = 0;
            }
          }
          
          else if (el.type === 'digital_matrix_rain') {
             const fontSize = 16;
             const columns = Math.floor(canvas.width / fontSize);
             
             if (!(window as any).matrixRainDrops) {
                (window as any).matrixRainDrops = [];
                for(let x = 0; x < columns; x++) {
                   (window as any).matrixRainDrops[x] = 1;
                }
             }
             
             const drops = (window as any).matrixRainDrops;
             
             if (!(window as any).matrixCanvas) {
                const mCanvas = document.createElement('canvas');
                mCanvas.width = canvas.width;
                mCanvas.height = canvas.height;
                (window as any).matrixCanvas = mCanvas;
             }
             
             const mCanvas = (window as any).matrixCanvas;
             if (mCanvas.width !== canvas.width || mCanvas.height !== canvas.height) {
                mCanvas.width = canvas.width;
                mCanvas.height = canvas.height;
                for(let x = 0; x < columns; x++) {
                   drops[x] = Math.random() * -100;
                }
             }
             
             const mCtx = mCanvas.getContext('2d');
             if (mCtx) {
                 const audioPower = (freqData[2] || 0) / 255;
                 
                 mCtx.globalCompositeOperation = 'destination-out';
                 mCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                 mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
                 mCtx.globalCompositeOperation = 'source-over';
                 
                 mCtx.fillStyle = el.color || '#0F0';
                 mCtx.font = fontSize + 'px monospace';
                 
                 const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
                 
                 const speed = ((el as any).speed || 1) * (1 + audioPower);
                 const density = (el as any).density || 20;
                 
                 for (let i = 0; i < drops.length; i++) {
                    if (i % Math.max(1, Math.floor(50 / density)) !== 0) continue;
                    
                    const text = chars.charAt(Math.floor(Math.random() * chars.length));
                    
                    mCtx.shadowBlur = 10;
                    mCtx.shadowColor = el.color || '#0F0';
                    
                    mCtx.fillText(text, i * fontSize, drops[i] * fontSize);
                    mCtx.shadowBlur = 0;
                    
                    if (drops[i] * fontSize > mCanvas.height && Math.random() > 0.975) {
                       drops[i] = 0;
                    }
                    drops[i] += speed;
                 }
                 
                 ctx.save();
                 ctx.globalAlpha = el.opacity ?? 1;
                 // Draw relative to el.x and el.y so it centers on the element position
                 ctx.drawImage(mCanvas, el.x - mCanvas.width/2, el.y - mCanvas.height/2);
                 ctx.restore();
             }
          }
          else if (el.type === 'neon_grid') {
             const time = performance.now() * 0.001;
             ctx.strokeStyle = getStyle(el, el.x - el.width/2, el.y - el.height/2, el.x + el.width/2, el.y + el.height/2);
             ctx.lineWidth = 2;
             
             // Perspective grid
             const lines = 20;
             const spacing = el.width / lines;
             const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
             const intensity = averageFreq / 255;
             
             ctx.shadowColor = el.color;
             ctx.shadowBlur = 10 * intensity;
             
             // Vertical lines converging
             ctx.beginPath();
             for (let i = 0; i <= lines; i++) {
               const xTop = el.x - el.width/2 + (i * spacing);
               const xBot = el.x + (xTop - el.x) * el.perspective;
               ctx.moveTo(xTop, el.y - el.height/2);
               ctx.lineTo(xBot, el.y + el.height/2);
             }
             
             // Horizontal moving lines
             const hLines = 15;
             for (let i = 0; i < hLines; i++) {
                const yOffset = ((i * (el.height/hLines) + time * 50) % el.height);
                const yPos = el.y - el.height/2 + yOffset;
                // Scale width based on perspective and y
                const scale = 1 + ((yOffset / el.height) * (el.perspective - 1));
                const currentWidth = el.width * scale;
                ctx.moveTo(el.x - currentWidth/2, yPos);
                ctx.lineTo(el.x + currentWidth/2, yPos);
             }
             ctx.stroke();
             ctx.shadowBlur = 0;
          }
          else if (el.type === 'double_circle') {
            const bars = Math.min(90, freqLength);
            const step = (Math.PI * 2) / bars;
            
            // Outer ring (radiates outward)
            ctx.fillStyle = getStyle(el, el.x - el.radius, el.y - el.radius, el.x + el.radius, el.y + el.radius);
            for (let i = 0; i < bars; i++) {
              const value = freqData[i] || 0;
              const barHeight = (value / 255) * (el.radius * 0.4);
              const angle = i * step;
              
              ctx.save();
              ctx.translate(el.x, el.y);
              ctx.rotate(angle);
              ctx.fillRect(el.radius, -el.lineWidth/2, barHeight, el.lineWidth);
              ctx.restore();
            }

            // Inner ring (radiates inward, complementary/secondary colored)
            // If gradient is used, color2 is the secondary color, otherwise fallback to red or same color
            ctx.fillStyle = el.useGradient ? (el.color2 || '#e94560') : el.color; 
            const innerRadius = el.radius * 0.7;
            for (let i = 0; i < bars; i++) {
              const value = freqData[bars - 1 - i] || 0; // reverse or shift index for variety
              const barHeight = (value / 255) * (innerRadius * 0.4);
              const angle = i * step;
              
              ctx.save();
              ctx.translate(el.x, el.y);
              ctx.rotate(angle);
              // pointing inwards
              ctx.fillRect(innerRadius - barHeight, -el.lineWidth/2, barHeight, el.lineWidth);
              ctx.restore();
            }
          }
          else if (el.type === 'circular_spectrum') {
            const bars = Math.min(64, freqLength);
            const step = (Math.PI * 2) / bars;
            
            const r = el.radius + el.height;
            ctx.fillStyle = getStyle(el, el.x - r, el.y - r, el.x + r, el.y + r);
            for (let i = 0; i < bars; i++) {
              const value = freqData[i] || 0;
              const barHeight = (value / 255) * el.height;
              const angle = i * step;
              
              ctx.save();
              ctx.translate(el.x, el.y);
              ctx.rotate(angle);
              ctx.fillRect(el.radius, -2, barHeight, 4);
              ctx.restore();
            }
          }
          else if (el.type === 'smooth_curve') {
             ctx.lineWidth = el.lineWidth;
             ctx.strokeStyle = getStyle(el, el.x - el.width / 2, el.y - el.height / 2, el.x + el.width / 2, el.y + el.height / 2);
             ctx.beginPath();
             
             const pointsCount = Math.min(32, freqLength);
             const sliceWidth = el.width / (pointsCount - 1);
             let x = el.x - el.width / 2;

             for (let i = 0; i < pointsCount; i++) {
               const v = (freqData[i] || 0) / 255.0;
               const y = el.y + el.height / 2 - (v * el.height);

               if (i === 0) {
                 ctx.moveTo(x, y);
               } else {
                 // basic smooth curve approximation
                 ctx.lineTo(x, y);
               }
               x += sliceWidth;
             }
             ctx.stroke();
          }
          else if (el.type === 'symmetrical_mirror') {
             const barCount = Math.min(32, freqLength);
             const totalWidth = barCount * (el.barWidth + el.barSpacing) * 2;
             
             ctx.fillStyle = getStyle(el, el.x - totalWidth / 2, el.y, el.x + totalWidth / 2, el.y);
             for (let i = 0; i < barCount; i++) {
               const value = freqData[i] || 0;
               const barHeight = (value / 255) * el.height;
               const offset = i * (el.barWidth + el.barSpacing);
               
               // Right side
               ctx.fillRect(el.x + offset, el.y - barHeight / 2, el.barWidth, barHeight);
               // Left side
               ctx.fillRect(el.x - offset - el.barWidth, el.y - barHeight / 2, el.barWidth, barHeight);
             }
          }
          else if (el.type === 'bass_pulse') {
             const bass = freqData.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
             const scale = 1 + (bass / 255);
             
             const rOuter = el.radius * scale;
             ctx.beginPath();
             ctx.arc(el.x, el.y, rOuter, 0, 2 * Math.PI);
             ctx.fillStyle = getStyle(el, el.x - rOuter, el.y - rOuter, el.x + rOuter, el.y + rOuter);
             ctx.globalAlpha = el.opacity * 0.5 * (bass / 255);
             ctx.fill();
             
             ctx.beginPath();
             ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI);
             ctx.fillStyle = getStyle(el, el.x - el.radius, el.y - el.radius, el.x + el.radius, el.y + el.radius);
             ctx.globalAlpha = el.opacity;
             ctx.fill();
          }
          else if (el.type === 'multi_sine') {
             ctx.strokeStyle = getStyle(el, el.x - el.width / 2, el.y - el.height / 2, el.x + el.width / 2, el.y + el.height / 2);
             const time = performance.now() * 0.002;
             const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
             const amp = (averageFreq / 255) * el.height;
             
             for (let line = 0; line < el.lines; line++) {
               ctx.beginPath();
               let x = el.x - el.width / 2;
               ctx.lineWidth = 2 - (line * 0.5);
               ctx.globalAlpha = el.opacity * (1 - (line * 0.2));
               
               for (let i = 0; i <= el.width; i += 10) {
                 const phase = (i * 0.01) + time + (line * Math.PI / 4);
                 const y = el.y + Math.sin(phase) * (amp / (line + 1));
                 if (i === 0) ctx.moveTo(x, y);
                 else ctx.lineTo(x, y);
                 x += 10;
               }
               ctx.stroke();
             }
          }
          else if (el.type === 'line_glow') {
             const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
             const intensity = averageFreq / 255;
             
             const w = el.width || 600;
             const baseColor = el.color || '#ffffff';
             
             // create a gradient that fades out on both ends
             const grad = ctx.createLinearGradient(el.x - w/2, el.y, el.x + w/2, el.y);
             
             // helper for rgb
             const hexToRgb = (hex: string) => {
               const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
               return result ? `${intFromHex(result[1])}, ${intFromHex(result[2])}, ${intFromHex(result[3])}` : '255, 255, 255';
             };
             const intFromHex = (hex: string) => parseInt(hex, 16);
             
             const rgb1 = hexToRgb(baseColor);
             const color1_0 = `rgba(${rgb1}, 0)`;
             const color1_1 = `rgba(${rgb1}, 1)`;
             
             if (el.useGradient) {
               const color2 = el.color2 || '#00ffff';
               const rgb2 = hexToRgb(color2);
               const color2_0 = `rgba(${rgb2}, 0)`;
               const color2_1 = `rgba(${rgb2}, 1)`;
               
               grad.addColorStop(0, color1_0);
               grad.addColorStop(0.2, color1_1);
               grad.addColorStop(0.8, color2_1);
               grad.addColorStop(1, color2_0);
             } else {
               grad.addColorStop(0, color1_0);
               grad.addColorStop(0.5, color1_1);
               grad.addColorStop(1, color1_0);
             }
             
             ctx.save();
             ctx.globalAlpha = el.opacity ?? 1;
             
             // Glow
             ctx.shadowBlur = (el.radius || 20) * (1 + intensity * 0.8);
             ctx.shadowColor = baseColor;
             
             // Audio reactive thickness
             const baseWidth = el.lineWidth || 4;
             ctx.lineWidth = baseWidth + (intensity * 8);
             ctx.strokeStyle = grad;
             
             // Draw outer glow line
             ctx.beginPath();
             ctx.moveTo(el.x - w/2, el.y);
             ctx.lineTo(el.x + w/2, el.y);
             ctx.stroke();
             
             // Draw bright inner core
             ctx.lineWidth = Math.max(1, baseWidth / 2) + (intensity * 2);
             
             const coreGrad = ctx.createLinearGradient(el.x - w/2, el.y, el.x + w/2, el.y);
             coreGrad.addColorStop(0, 'rgba(255,255,255,0)');
             coreGrad.addColorStop(0.1, 'rgba(255,255,255,0.4)');
             coreGrad.addColorStop(0.5, 'rgba(255,255,255,1)');
             coreGrad.addColorStop(0.9, 'rgba(255,255,255,0.4)');
             coreGrad.addColorStop(1, 'rgba(255,255,255,0)');
             
             ctx.strokeStyle = coreGrad;
             ctx.stroke();
             
             ctx.restore();
          }
          else if (el.type === 'single_sine') {
             ctx.strokeStyle = getStyle(el, el.x - el.width / 2, el.y - el.height / 2, el.x + el.width / 2, el.y + el.height / 2);
             const time = performance.now() * 0.0015; // Slower movement
             
             ctx.beginPath();
             let x = el.x - el.width / 2;
             ctx.lineWidth = el.lineWidth || 2;
             ctx.globalAlpha = el.opacity;
             
             // Base amplitude if no audio
             const baseAmp = 2;
             
             const points = Math.floor(el.width / 5);
             const sliceWidth = el.width / points;
             
             for (let i = 0; i <= points; i++) {
               const phase = (i * 0.05) - time; // wave traveling
               
               // Map i to frequency data index
               let freqVal = 0;
               if (freqData.length > 0) {
                 const freqIdx = Math.floor((i / points) * (freqData.length / 2)); 
                 freqVal = freqData[freqIdx] || 0;
               }
               
               const amp = baseAmp + (freqVal / 255) * (el.height / 4); // Smaller amplitude
               
               const y = el.y + Math.sin(phase) * amp;
               if (i === 0) ctx.moveTo(x, y);
               else ctx.lineTo(x, y);
               x += sliceWidth;
             }
             ctx.stroke();
          }
          else if (el.type === 'spiral_galaxy') {
            const time = performance.now() * 0.0005;
            const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
            const intensity = averageFreq / 255;
            
            ctx.fillStyle = getStyle(el, el.x - el.radius, el.y - el.radius, el.x + el.radius, el.y + el.radius);
            for (let i = 0; i < el.count; i++) {
               const angle = i * 0.1 + time;
               const radius = (i / el.count) * el.radius + Math.sin(angle * 5) * 20 * intensity;
               const px = el.x + Math.cos(angle) * radius;
               const py = el.y + Math.sin(angle) * radius;
               
               const size = Math.max(0.5, (1 - (i / el.count)) * 3 * (1 + intensity));
               
               ctx.beginPath();
               ctx.arc(px, py, size, 0, 2 * Math.PI);
               ctx.fill();
            }
          }
          else if (el.type === 'flames') {
             const barCount = Math.min(32, freqLength);
             const barWidth = el.width / barCount;
             let startX = el.x - el.width / 2;
             
             ctx.fillStyle = getStyle(el, el.x - el.width / 2, el.y - el.height / 2, el.x + el.width / 2, el.y + el.height / 2);
             for (let i = 0; i < barCount; i++) {
               const value = freqData[i] || 0;
               const barHeight = (value / 255) * el.height;
               
               // Flame shape approximation
               ctx.beginPath();
               ctx.moveTo(startX, el.y + el.height/2);
               ctx.lineTo(startX + barWidth/2, el.y + el.height/2 - barHeight - (Math.random() * 20));
               ctx.lineTo(startX + barWidth, el.y + el.height/2);
               ctx.fill();
               
               startX += barWidth;
             }
          }
          else if (el.type === 'color_pixel') {
             const time = performance.now() * 0.001;
             const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
             const intensity = averageFreq / 255;
             
             if (!(window as any).colorPixels) {
                (window as any).colorPixels = [];
             }
             const pixels = (window as any).colorPixels;
             
             const blur = el.radius || 15;
             const amount = el.density || 70;
             const baseSize = el.lineWidth || 11;
             const speed = el.speed || 31;
             
             // Base color
             const baseColor = el.color || '#ff9900';
             const useGradient = el.useGradient;
             const color2 = el.color2 || '#00ffff';
             
             // Dynamic amount calculation based on audio intensity and the Amount slider
             // Higher amount slider = more pixels spawned per frame
             const spawnRate = (amount / 10) * (1 + intensity * 2);
             const numToSpawn = Math.floor(spawnRate) + (Math.random() < (spawnRate % 1) ? 1 : 0);
             
             for (let i = 0; i < numToSpawn; i++) {
                 const isGlow = Math.random() > 0.8;
                 pixels.push({
                     x: el.x - el.width/2 + Math.random() * el.width,
                     y: el.y - el.height/2 + Math.random() * el.height,
                     vx: (Math.random() - 0.5) * (speed / 15),
                     vy: (Math.random() - 0.5) * (speed / 15) - (intensity * (speed / 10)), 
                     life: 1.0 + Math.random(),
                     maxLife: 2.0,
                     size: baseSize * (0.5 + Math.random()),
                     isGlow: isGlow,
                     color: isGlow ? '#ffffff' : (useGradient && Math.random() > 0.5 ? color2 : baseColor)
                 });
             }
             
             ctx.save();
             // 'overlay' or 'color-dodge' blends the white/colored pixels nicely with the background image
             // giving that "picking up the color from underneath" feel if we use white with overlay.
             ctx.globalCompositeOperation = 'overlay'; 
             
             for (let i = pixels.length - 1; i >= 0; i--) {
                 const p = pixels[i];
                 p.x += p.vx;
                 p.y += p.vy;
                 p.life -= 0.02 * (speed / 15);
                 
                 if (p.life <= 0) {
                     pixels.splice(i, 1);
                     continue;
                 }
                 
                 const alpha = (p.life / p.maxLife) * (el.opacity ?? 1);
                 ctx.fillStyle = p.color;
                 ctx.globalAlpha = alpha;
                 
                 // Apply glow (blur) from settings
                 if (p.isGlow) {
                     ctx.shadowBlur = blur;
                     ctx.shadowColor = p.color;
                 } else {
                     ctx.shadowBlur = blur * 0.3;
                     ctx.shadowColor = p.color;
                 }
                 
                 // Pixelated appearance (drawing squares)
                 // We snap to a grid to make it look like a mosaic
                 const gridSnap = baseSize;
                 const snapX = Math.floor(p.x / gridSnap) * gridSnap;
                 const snapY = Math.floor(p.y / gridSnap) * gridSnap;
                 
                 ctx.fillRect(snapX, snapY, gridSnap - 1, gridSnap - 1);
                 
                 // Cross shape for bright pixels
                 if (p.isGlow && p.size > baseSize) {
                    const cx = snapX + gridSnap/2;
                    const cy = snapY + gridSnap/2;
                    ctx.globalCompositeOperation = 'screen'; // Make the cross even brighter
                    ctx.fillRect(Math.floor(cx - gridSnap), Math.floor(cy - gridSnap/4), gridSnap * 2, gridSnap/2);
                    ctx.fillRect(Math.floor(cx - gridSnap/4), Math.floor(cy - gridSnap), gridSnap/2, gridSnap * 2);
                    ctx.globalCompositeOperation = 'overlay'; // Restore
                 }
             }
             
             ctx.restore();
          }
          else if (el.type === 'rain') {
             const time = performance.now() * 0.05 * el.speed;
             const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
             const intensity = averageFreq / 255;
             
             ctx.fillStyle = getStyle(el, el.x - canvas.width/2, el.y - canvas.height/2, el.x + canvas.width/2, el.y + canvas.height/2);
             for (let i = 0; i < el.count; i++) {
                const px = el.x - canvas.width/2 + ((i * 137) % canvas.width);
                let py = el.y - canvas.height/2 + ((i * 53 + time * 10) % canvas.height);
                
                const dropLength = 10 + (intensity * 40) + ((i % 5) * 5);
                
                ctx.fillRect(px, py, 2, dropLength);
             }
          }
          else if (el.type === 'triangle_spectrum' || el.type === 'diamond_spectrum') {
            const bars = Math.min(60, freqLength);
            const step = (Math.PI * 2) / bars;
            const r = el.radius;
            
            ctx.fillStyle = getStyle(el, el.x - r, el.y - r, el.x + r, el.y + r);
            ctx.strokeStyle = getStyle(el, el.x - r, el.y - r, el.x + r, el.y + r);
            ctx.lineWidth = el.lineWidth;
            
            for (let i = 0; i < bars; i++) {
              const value = freqData[i] || 0;
              const barHeight = (value / 255) * (r * 0.8);
              const angle = i * step;
              
              // Calculate points for the shape (triangle or diamond)
              let px = 0, py = 0;
              
              if (el.type === 'triangle_spectrum') {
                // Approximate a triangle using polar coordinates
                // Radius varies by angle: r / (cos(theta) * ...) math is complex for exact triangle, 
                // simpler to just map angle to a 3-point polygon
                const sector = Math.floor(angle / (Math.PI * 2 / 3));
                const a1 = sector * (Math.PI * 2 / 3);
                const a2 = (sector + 1) * (Math.PI * 2 / 3);
                const t = (angle - a1) / (a2 - a1);
                
                const p1x = Math.cos(a1 - Math.PI/2) * r;
                const p1y = Math.sin(a1 - Math.PI/2) * r;
                const p2x = Math.cos(a2 - Math.PI/2) * r;
                const p2y = Math.sin(a2 - Math.PI/2) * r;
                
                px = p1x + (p2x - p1x) * t;
                py = p1y + (p2y - p1y) * t;
              } else {
                // Diamond
                const sector = Math.floor(angle / (Math.PI / 2));
                const a1 = sector * (Math.PI / 2);
                const a2 = (sector + 1) * (Math.PI / 2);
                const t = (angle - a1) / (a2 - a1);
                
                const p1x = Math.cos(a1) * r;
                const p1y = Math.sin(a1) * r;
                const p2x = Math.cos(a2) * r;
                const p2y = Math.sin(a2) * r;
                
                px = p1x + (p2x - p1x) * t;
                py = p1y + (p2y - p1y) * t;
              }

              // Draw outward bars normal to the shape is hard, so just radiate from center
              ctx.save();
              ctx.translate(el.x + px, el.y + py);
              ctx.rotate(angle);
              ctx.fillRect(0, -el.lineWidth/2, barHeight, el.lineWidth);
              ctx.restore();
            }
            
            // Draw the base shape outline
            ctx.beginPath();
            if (el.type === 'triangle_spectrum') {
              for (let i = 0; i < 3; i++) {
                const a = i * (Math.PI * 2 / 3) - Math.PI/2;
                if (i === 0) ctx.moveTo(el.x + Math.cos(a)*r, el.y + Math.sin(a)*r);
                else ctx.lineTo(el.x + Math.cos(a)*r, el.y + Math.sin(a)*r);
              }
            } else {
              for (let i = 0; i < 4; i++) {
                const a = i * (Math.PI / 2);
                if (i === 0) ctx.moveTo(el.x + Math.cos(a)*r, el.y + Math.sin(a)*r);
                else ctx.lineTo(el.x + Math.cos(a)*r, el.y + Math.sin(a)*r);
              }
            }
            ctx.closePath();
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = el.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
          else if (el.type === 'glowing_ring') {
            const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
            const intensity = averageFreq / 255;
            const radiusPulse = el.radius + intensity * 30;
            
            ctx.strokeStyle = getStyle(el, el.x - radiusPulse, el.y - radiusPulse, el.x + radiusPulse, el.y + radiusPulse);
            ctx.lineWidth = el.lineWidth;
            
            ctx.beginPath();
            ctx.arc(el.x, el.y, radiusPulse, 0, 2 * Math.PI);
            
            ctx.shadowBlur = 20 + intensity * 40;
            ctx.shadowColor = el.color;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw some inner/outer particles for the ring
            ctx.fillStyle = getStyle(el, el.x - radiusPulse, el.y - radiusPulse, el.x + radiusPulse, el.y + radiusPulse);
            for (let i = 0; i < 20; i++) {
               const angle = (i / 20) * Math.PI * 2 + (performance.now() * 0.001);
               const pR = radiusPulse + (Math.sin(i * 5 + performance.now() * 0.005) * 20 * intensity);
               ctx.beginPath();
               ctx.arc(el.x + Math.cos(angle) * pR, el.y + Math.sin(angle) * pR, 2, 0, 2 * Math.PI);
               ctx.fill();
            }
          }
          else if (el.type === 'mirrored_bars') {
             const barCount = Math.min(64, freqLength);
             const totalWidth = barCount * (el.barWidth + el.barSpacing);
             let startX = el.x - totalWidth / 2;
             
             ctx.fillStyle = getStyle(el, el.x - totalWidth / 2, el.y, el.x + totalWidth / 2, el.y);
             ctx.shadowBlur = 10;
             ctx.shadowColor = el.color;

             for (let i = 0; i < barCount; i++) {
               const value = freqData[i] || 0;
               const barHeight = (value / 255) * (el.height / 2);
               
               // Top bar (going up)
               ctx.fillRect(startX, el.y, el.barWidth, -barHeight);
               
               // Bottom bar (going down)
               ctx.fillRect(startX, el.y + 2, el.barWidth, barHeight);
               
               startX += el.barWidth + el.barSpacing;
             }
             ctx.shadowBlur = 0;
          }
          
          ctx.restore();
        }
      }

      // POST-PROCESSING EFFECTS
      const pp = project?.postProcessing;
      if (pp && (pp.bloom || pp.chromaticAberration || pp.filmGrain || pp.lensFlare || (pp.lut && pp.lut !== 'none'))) {
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offscreen = offscreenCanvasRef.current;
        if (offscreen.width !== canvas.width || offscreen.height !== canvas.height) {
          offscreen.width = canvas.width;
          offscreen.height = canvas.height;
        }
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          // Copy current canvas to offscreen
          offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
          offCtx.drawImage(canvas, 0, 0);
          
          let combinedFilter = '';
          if (pp.chromaticAberration) combinedFilter += 'url(#pp-chromatic) ';
          if (pp.bloom) combinedFilter += 'url(#pp-bloom) ';
          if (pp.lut && pp.lut !== 'none') combinedFilter += `url(#pp-lut-${pp.lut}) `;
          
          if (combinedFilter) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = combinedFilter.trim();
            ctx.drawImage(offscreen, 0, 0);
            ctx.restore();
          }

          // Grain and Lens Flare can be drawn over top
          if (pp.filmGrain) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.08;
            
            // Optimized grain: Generate once, render fast
            // Store it on the window/canvas object to reuse across frames
            if (!(window as any).grainCanvas) {
              const gCanvas = document.createElement('canvas');
              gCanvas.width = 512;
              gCanvas.height = 512;
              const gCtx = gCanvas.getContext('2d', { alpha: false });
              if (gCtx) {
                const imgData = gCtx.createImageData(512, 512);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                  const val = Math.random() * 255;
                  data[i] = val;
                  data[i+1] = val;
                  data[i+2] = val;
                  data[i+3] = 255;
                }
                gCtx.putImageData(imgData, 0, 0);
              }
              (window as any).grainCanvas = gCanvas;
            }
            
            const gCanvas = (window as any).grainCanvas;
            const w = canvas.width;
            const h = canvas.height;
            
            ctx.fillStyle = ctx.createPattern(gCanvas, 'repeat') as CanvasPattern;
            
            // Randomize pattern offset to animate grain
            ctx.translate(Math.random() * 512, Math.random() * 512);
            ctx.fillRect(-512, -512, w + 1024, h + 1024);
            
            ctx.restore();
          }

          if (pp.lensFlare) {
             // Fake a lens flare
             ctx.save();
             ctx.setTransform(1, 0, 0, 1, 0, 0);
             ctx.globalCompositeOperation = 'screen';
             const cx = canvas.width * 0.5;
             const cy = canvas.height * 0.5;
             
             // Draw a horizontal anamorphic flare
             const flareGrad = ctx.createLinearGradient(0, cy - 5, 0, cy + 5);
             flareGrad.addColorStop(0, 'rgba(100, 150, 255, 0)');
             flareGrad.addColorStop(0.5, 'rgba(100, 150, 255, 0.5)');
             flareGrad.addColorStop(1, 'rgba(100, 150, 255, 0)');
             ctx.fillStyle = flareGrad;
             ctx.fillRect(0, cy - 5, canvas.width, 10);
             ctx.restore();
          }
        }
      }

    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [project, getAudioData, getWaveformData]);

  const aspectRatio = project?.resolution ? `${project.resolution.width} / ${project.resolution.height}` : '16 / 9';

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
      className={`bg-black rounded-lg overflow-hidden shadow-2xl block object-contain mx-auto ${draggingId ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        aspectRatio,
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
});
