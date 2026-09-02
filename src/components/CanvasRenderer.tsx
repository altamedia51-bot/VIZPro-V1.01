import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Project, VizElement } from '../types';

interface CanvasRendererProps {
  project: Project | null;
  getAudioData: () => { dataArray: Uint8Array; bufferLength: number };
  getWaveformData: () => { dataArray: Uint8Array; bufferLength: number };
  isPlaying: boolean;
  isRecording?: boolean;
  currentTime?: number;
  duration?: number;
  selectedElementId?: string | null;
  onUpdateElement?: (id: string, updates: Partial<VizElement>) => void;
  onSelectElement?: (id: string | null) => void;
}

export interface CanvasRendererRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const CanvasRenderer = forwardRef<CanvasRendererRef, CanvasRendererProps>(({ project, getAudioData, getWaveformData, isPlaying, isRecording = false, currentTime = 0, duration = 0, selectedElementId, onUpdateElement, onSelectElement }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const tintCacheRef = useRef<Record<string, HTMLCanvasElement>>({});
  const snapLinesRef = useRef<{ axis: 'x' | 'y', pos: number }[]>([]);

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
      
      if (el.type === 'circle' || el.type === 'double_circle' || el.type === 'circular_spectrum' || el.type === 'bass_pulse' || el.type === 'triangle_spectrum' || el.type === 'diamond_spectrum' || el.type === 'glowing_ring' || el.type === 'radial_dots' || el.type === 'perspective_ring') {
        const dx = x - el.x;
        const dy = y - el.y;
        hit = Math.sqrt(dx * dx + dy * dy) <= el.radius * elScale;
      } else if (el.type === 'progress_bar' || el.type === 'progress_visualizer') {
        const e = el as any;
        const totalW = e.width || 640;
        const totalH = (e.barHeight ? e.barHeight * 2 : 50) + (e.showTime !== false ? (e.fontSize || 24) * 2 : 20);
        hit = Math.abs(x - el.x) <= (totalW * elScale) / 2 && Math.abs(y - el.y) <= (totalH * elScale) / 2;
      } else if (el.type === 'water_splash') {
        const e = el as any;
        hit = Math.abs(x - el.x) <= (e.splashRadius * elScale) && y >= el.y - (300 * elScale) && y <= el.y;
      } else if (el.type === 'image') {
        const imgEl = el as any;
        const w = (imgEl.width || 48) * elScale;
        const h = (imgEl.height || 48) * elScale;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
      } else if (el.type === 'glowing_blocks') {
        const e = el as any;
        const totalW = e.columns * e.blockWidth + Math.max(0, e.columns - 1) * e.spacing;
        const totalH = e.rows * e.blockHeight + Math.max(0, e.rows - 1) * e.spacing;
        hit = Math.abs(x - el.x) <= (totalW * elScale) / 2 && Math.abs(y - el.y) <= (totalH * elScale) / 2;
      } else if (el.type === 'banner' || el.type === 'bracket_banner') {
        const w = (el as any).width * elScale;
        const h = (el as any).height * elScale;
        hit = x >= el.x - w / 2 && x <= el.x + w / 2 && y >= el.y - h / 2 && y <= el.y + h / 2;
      } else if ((el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') && ctx) {
        ctx.font = `${el.fontSize}px ${el.fontFamily}`;
        const textToMeasure = el.text || 'Subtitle Text';
        if (el.type === 'sticker_text') {
            console.log("Sticker Text hit check", textToMeasure);
        }
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
    if (draggingId && onUpdateElement && project) {
      // Prevent default to stop pull-to-refresh on mobile if dragging
      // e.preventDefault(); 
      const { x, y } = getMousePos(e);
      let newX = Math.round(x - dragOffset.current.x);
      let newY = Math.round(y - dragOffset.current.y);

      const snapLines: { axis: 'x' | 'y', pos: number }[] = [];
      const SNAP_TOLERANCE = 10;
      
      const res = project.resolution || { width: 1280, height: 720 };
      const centerX = res.width / 2;
      const centerY = res.height / 2;

      if (Math.abs(newX - centerX) < SNAP_TOLERANCE) {
        newX = centerX;
        snapLines.push({ axis: 'x', pos: centerX });
      }
      if (Math.abs(newY - centerY) < SNAP_TOLERANCE) {
        newY = centerY;
        snapLines.push({ axis: 'y', pos: centerY });
      }

      project.elements.forEach(el => {
        const draggedElement = project.elements.find(e => e.id === draggingId);
        if (el.id === draggingId || (draggedElement && el.groupId === draggedElement.groupId && el.groupId !== undefined)) return;
        
        if (Math.abs(newX - el.x) < SNAP_TOLERANCE) {
          newX = el.x;
          snapLines.push({ axis: 'x', pos: el.x });
        }
        if (Math.abs(newY - el.y) < SNAP_TOLERANCE) {
          newY = el.y;
          snapLines.push({ axis: 'y', pos: el.y });
        }
      });

      snapLinesRef.current = snapLines;

      onUpdateElement(draggingId, {
        x: newX,
        y: newY
      });
    }
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    snapLinesRef.current = [];
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

      const { dataArray: freqData, bufferLength: freqLength } = getAudioData();
      const { dataArray: waveData, bufferLength: waveLength } = getWaveformData();

      // Audio Energy & Bass calculations for reactive motion presets
      let bassSum = 0;
      const bassCount = Math.min(16, freqLength);
      for (let i = 0; i < bassCount; i++) {
        bassSum += freqData[i] || 0;
      }
      const bassAvg = bassCount > 0 ? (bassSum / bassCount) / 255 : 0;

      let totalEnergy = 0;
      const energyCount = Math.min(64, freqLength);
      for (let i = 0; i < energyCount; i++) {
        totalEnergy += freqData[i] || 0;
      }
      const audioEnergy = energyCount > 0 ? (totalEnergy / energyCount) / 255 : 0;

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

      // Background Motion Presets Transformation
      const bgPreset = bgConf?.motionPreset || 'none';
      const bgIntensity = (bgConf?.motionIntensity ?? 50) / 50;
      const bgSpeed = bgConf?.motionSpeed ?? 1.0;
      const bgTime = performance.now() * 0.001 * bgSpeed;

      let bgScale = 1.0;
      let bgOffsetX = 0;
      let bgOffsetY = 0;
      let bgAlpha = 1.0;

      if (bgPreset === 'pulse') {
        // Bass beat pulse: smoothly expands on bass beats
        bgScale = 1.0 + (bassAvg * 0.12 + Math.sin(bgTime * 2) * 0.01) * bgIntensity;
      } else if (bgPreset === 'drift') {
        // Cinematic Parallax / Ken Burns slow pan & zoom
        bgScale = 1.08 + Math.sin(bgTime * 0.5) * 0.04 * bgIntensity;
        bgOffsetX = Math.sin(bgTime * 0.7) * (20 * bgIntensity);
        bgOffsetY = Math.cos(bgTime * 0.5) * (15 * bgIntensity);
      } else if (bgPreset === 'slide') {
        // Smooth slide & pan transition back and forth
        bgScale = 1.06;
        bgOffsetX = Math.sin(bgTime * 1.2) * (35 * bgIntensity);
        bgOffsetY = Math.cos(bgTime * 0.8) * (10 * bgIntensity);
      } else if (bgPreset === 'fade') {
        // Ambient breathing glow / dissolve
        bgAlpha = 0.75 + (Math.sin(bgTime * 2) * 0.15 + bassAvg * 0.1) * bgIntensity;
        bgAlpha = Math.max(0.2, Math.min(1.0, bgAlpha));
      } else if (bgPreset === 'zoom_burst') {
        // Audio drop / beat zoom burst
        const burst = Math.pow(bassAvg, 2) * 0.25 * bgIntensity;
        bgScale = 1.0 + burst;
      } else if (bgPreset === 'shake') {
        // Sub-bass camera shake on heavy beats
        if (bassAvg > 0.35) {
          const shakeMag = (bassAvg - 0.35) * 18 * bgIntensity;
          bgOffsetX = (Math.random() - 0.5) * shakeMag;
          bgOffsetY = (Math.random() - 0.5) * shakeMag;
        }
      }

      const bgCx = canvas.width / 2;
      const bgCy = canvas.height / 2;
      ctx.translate(bgCx + bgOffsetX, bgCy + bgOffsetY);
      if (bgScale !== 1.0) {
        ctx.scale(bgScale, bgScale);
      }
      ctx.translate(-bgCx, -bgCy);
      ctx.globalAlpha = bgAlpha;

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

          // Element Motion Presets Calculation
          let animScale = 1.0;
          let animOffsetX = 0;
          let animOffsetY = 0;
          let animAlpha = 1.0;

          if (el.motionPreset && el.motionPreset !== 'none') {
            const mIntensity = (el.motionIntensity ?? 50) / 50;
            const mSpeed = el.motionSpeed ?? 1.0;
            const elTime = performance.now() * 0.001 * mSpeed;

            if (el.motionPreset === 'pulse') {
              // Bass beat pulse
              animScale = 1.0 + (bassAvg * 0.22) * mIntensity;
            } else if (el.motionPreset === 'floating_sine') {
              // Floating sine wave
              animOffsetY = Math.sin(elTime * 2.5) * (14 * mIntensity);
            } else if (el.motionPreset === 'slide') {
              // Smooth sliding oscillation
              animOffsetX = Math.sin(elTime * 1.8) * (22 * mIntensity);
            } else if (el.motionPreset === 'fade') {
              // Breathing fade transition
              animAlpha = 0.45 + (0.55 * (0.5 + 0.5 * Math.sin(elTime * 2.5))) * mIntensity + (audioEnergy * 0.2);
              animAlpha = Math.max(0.15, Math.min(1.0, animAlpha));
            } else if (el.motionPreset === 'glow_pulse') {
              // Glow scale pulse
              animScale = 1.0 + (bassAvg * 0.12) * mIntensity;
            } else if (el.motionPreset === 'bounce') {
              // Snappy bounce on beat
              const bouncePhase = (elTime * 4.5) % Math.PI;
              animOffsetY = -Math.abs(Math.sin(bouncePhase)) * (14 + bassAvg * 20) * mIntensity;
            }
          }

          ctx.globalAlpha = el.opacity * animAlpha;
          
          ctx.translate(el.x + animOffsetX, el.y + animOffsetY);
          if (el.rotation) {
            ctx.rotate(el.rotation * Math.PI / 180);
          }
          const totalScale = (el.scale || 1) * animScale;
          if (totalScale !== 1) {
            ctx.scale(totalScale, totalScale);
          }
          ctx.translate(-(el.x + animOffsetX), -(el.y + animOffsetY));
          
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
                
                if (imgEl.useColorTint) {
                    const tintKey = imgEl.src + '_' + (imgEl.color || '#ffffff') + '_' + imgEl.width + '_' + imgEl.height;
                    let tintedCanvas = tintCacheRef.current[tintKey];
                    if (!tintedCanvas) {
                        tintedCanvas = document.createElement('canvas');
                        tintedCanvas.width = imgEl.width;
                        tintedCanvas.height = imgEl.height;
                        const offCtx = tintedCanvas.getContext('2d');
                        if (offCtx) {
                            offCtx.drawImage(img, 0, 0, imgEl.width, imgEl.height);
                            offCtx.globalCompositeOperation = 'source-in';
                            offCtx.fillStyle = imgEl.color || '#ffffff';
                            offCtx.fillRect(0, 0, imgEl.width, imgEl.height);
                        }
                        tintCacheRef.current[tintKey] = tintedCanvas;
                    }
                    ctx.drawImage(tintedCanvas, -imgEl.width / 2, -imgEl.height / 2);
                } else {
                    ctx.drawImage(img, -imgEl.width / 2, -imgEl.height / 2, imgEl.width, imgEl.height);
                }
                
                if (!isRecording && selectedElementId === el.id) {
                   ctx.strokeStyle = '#3b82f6';
                   ctx.lineWidth = 2 / el.scale;
                   ctx.strokeRect(-imgEl.width / 2 - 2, -imgEl.height / 2 - 2, imgEl.width + 4, imgEl.height + 4);
                }
                
                ctx.restore();
              }
          }
          else if (el.type === 'text' || el.type === 'subtitle' || el.type === 'sticker_text') {
            const time = performance.now();
            let finalY = el.y;
            let finalScale = 1;
            let alpha = 1;
            
            let textToRender = '';
            let activeSub: any = null;
            const currentT = currentTimeRef.current;
            if (el.type === 'text' || el.type === 'sticker_text') {
              textToRender = el.text || '';
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
                   ctx.restore();
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
              if ((el as any).isHanging) {
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
              
              if (el.type === 'sticker_text') {
                 // console.log("Drawing sticker text", textToRender);
                 ctx.lineJoin = 'round';
                 ctx.miterLimit = 2;
                 ctx.strokeStyle = el.strokeColor1 || '#ffffff';
                 ctx.lineWidth = el.lineWidth || 15;
                 
                 // Add 3D Drop Shadow effect for sticker
                 ctx.shadowColor = 'rgba(0,0,0,0.4)';
                 ctx.shadowBlur = 10;
                 ctx.shadowOffsetX = 4;
                 ctx.shadowOffsetY = 6;
                 
                 lines.forEach((line, index) => {
                    const y = startY + index * lineHeight;
                    ctx.strokeText(line, 0, y);
                 });
                 
                 // Remove shadow for fill
                 ctx.shadowColor = 'transparent';
                 ctx.shadowBlur = 0;
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 0;
              }
               
               
              const paddingX = 20;
              const paddingY = 10;
              
              // Draw hanging string if templateStyle is hanging
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
              }

              // Pre-render Backgrounds
              if (el.templateStyle === 'bubble_yellow' || el.templateStyle === 'bubble_black' || el.templateStyle === 'background_box' || el.templateStyle === 'background_box') {
                 lines.forEach((line, i) => {
                   const lineWidth = ctx.measureText(line).width;
                   if (el.templateStyle === 'background_box') {
                     // Set opacity and color
                     const bgOpacity = (el as any).backgroundOpacity !== undefined ? (el as any).backgroundOpacity : 0.8;
                     ctx.globalAlpha = bgOpacity * el.opacity * alpha;
                     ctx.fillStyle = (el as any).backgroundColor || '#000000';
                   } else {
                     ctx.fillStyle = el.templateStyle === 'bubble_yellow' ? '#FFD700' : 'rgba(0, 0, 0, 0.7)';
                   }
                   ctx.beginPath();
                   const borderRadius = el.templateStyle === 'bubble_yellow' ? 12 : (el.templateStyle === 'background_box' ? 16 : 8);
                   ctx.roundRect(-lineWidth/2 - paddingX, startY + i * lineHeight - el.fontSize/2 - paddingY, lineWidth + paddingX*2, el.fontSize + paddingY*2, borderRadius);
                   ctx.fill();
                   
                   // Reset global alpha after drawing background
                   ctx.globalAlpha = el.opacity * alpha;
                   
                   if (el.templateStyle === 'bubble_black' || el.templateStyle === 'background_box') {
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
                } else if (el.templateStyle === 'bubble_black' || el.templateStyle === 'background_box') {
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'retro') {
                  const shadowColor = el.color || '#E87D2A';
                  const offset = el.fontSize * 0.08;
                  
                  ctx.lineWidth = el.fontSize * 0.04;
                  ctx.lineJoin = 'miter';
                  
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, offset, lineY + offset);
                  ctx.fillStyle = shadowColor;
                  ctx.fillText(line, offset, lineY + offset);
                  
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'neon') {
                  ctx.shadowBlur = 15;
                  ctx.shadowColor = el.color || '#00FFFF';
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  ctx.fillText(line, 0, lineY); // double fill for stronger neon
                } else if (el.templateStyle === 'calli') {
                  const strokeWidth = Math.max(2, el.fontSize * 0.05); // Thin white stroke
                  const offset = el.fontSize * 0.08;
                  const fillColor = el.color || '#015B28'; // Pakistan Green
                  const shadowColor = '#013B18'; // Darker green shadow
                  
                  ctx.lineJoin = 'round';
                  ctx.miterLimit = 2;
                  
                  // Bottom Shadow Layer (Solid block, slightly offset)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = shadowColor;
                  ctx.strokeText(line, offset, lineY + offset);
                  ctx.fillStyle = shadowColor;
                  ctx.fillText(line, offset, lineY + offset);
                  
                  // Top Layer (Green Fill with White Stroke)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = '#FFFFFF';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillStyle = fillColor;
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'layered_outline') {
                  const strokeWidth = el.fontSize * 0.12;
                  const offset = el.fontSize * 0.08;
                  const color = el.color || '#E87D2A';
                  
                  ctx.lineJoin = 'round';
                  ctx.miterLimit = 2;
                  
                  // Bottom Layer (Shadow with Stroke)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, offset, lineY + offset);
                  ctx.fillStyle = color;
                  ctx.fillText(line, offset, lineY + offset);
                  
                  // Top Layer (White with Stroke)
                  ctx.lineWidth = strokeWidth;
                  ctx.strokeStyle = '#000000';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'glow_border') {
                  ctx.strokeStyle = el.color || '#FF00FF';
                  ctx.lineWidth = 2;
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = el.color || '#FF00FF';
                  ctx.strokeText(line, 0, lineY);
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'brush_stroke') {
                  // A slight textured shadow for brush stroke text
                  ctx.shadowColor = 'rgba(0,0,0,0.4)';
                  ctx.shadowBlur = 10;
                  ctx.shadowOffsetX = 2;
                  ctx.shadowOffsetY = 4;
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  // Reset shadow
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                } else if (el.templateStyle === 'architect') {
                  ctx.fillStyle = el.color || '#000000';
                  // Adding a very slight stroke to give it a bit more weight like a marker
                  ctx.lineWidth = 1;
                  ctx.strokeStyle = el.color || '#000000';
                  ctx.strokeText(line, 0, lineY);
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'jhun_brush') {
                  // Rough brush style with some drop shadow
                  ctx.shadowColor = 'rgba(0,0,0,0.8)';
                  ctx.shadowBlur = 4;
                  ctx.shadowOffsetX = 3;
                  ctx.shadowOffsetY = 3;
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  // Reset shadow
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  // Optional: add a slight stroke to emphasize the brush texture
                  ctx.lineWidth = 1.5;
                  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                  ctx.strokeText(line, 0, lineY);
                } else if (el.templateStyle === 'pen_story') {
                  ctx.fillStyle = el.color || '#000000';
                  ctx.fillText(line, 0, lineY);
                } else if (el.templateStyle === 'vintage_brush') {
                  ctx.shadowColor = 'rgba(0,0,0,0.6)';
                  ctx.shadowBlur = 8;
                  ctx.shadowOffsetX = 3;
                  ctx.shadowOffsetY = 3;
                  ctx.fillStyle = el.color || '#FFFFFF';
                  ctx.fillText(line, 0, lineY);
                  // Second layer for rough edge look
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  ctx.fillStyle = 'rgba(255,255,255,0.1)';
                  ctx.fillText(line, 1, lineY + 1);
                } else if (el.templateStyle === 'black_fire') {
                  // Fire-like text effect
                  // Draw outer glow (Fire aura)
                  ctx.shadowColor = el.useGradient ? (el.color2 || '#ff0000') : '#ff0000';
                  ctx.shadowBlur = 25;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = -8;
                  
                  // Fill with gradient or solid color
                  if (el.useGradient) {
                    const lineGrad = ctx.createLinearGradient(0, lineY - el.fontSize, 0, lineY);
                    lineGrad.addColorStop(0, '#ffeb3b'); // top (yellow)
                    lineGrad.addColorStop(0.3, '#ff9800'); // mid-top (orange)
                    lineGrad.addColorStop(0.7, '#f44336'); // mid-bottom (red)
                    lineGrad.addColorStop(1, '#b71c1c'); // bottom (dark red)
                    ctx.fillStyle = lineGrad;
                  } else {
                    ctx.fillStyle = el.color || '#ff6600';
                  }
                  ctx.fillText(line, 0, lineY);
                  
                  // Add subtle dark stroke to make it pop like the image
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  ctx.lineWidth = Math.max(1, el.fontSize / 30);
                  ctx.strokeStyle = 'rgba(20, 0, 0, 0.8)';
                  ctx.strokeText(line, 0, lineY);
                } else if (el.templateStyle === 'street_dripping') {
                  // Street Dripping effect with harsh drop shadow/3D effect like the ANTINK image
                  ctx.shadowColor = el.color2 || '#ff0000'; // Default red blood shadow
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = Math.max(2, el.fontSize / 20);
                  ctx.shadowOffsetY = Math.max(2, el.fontSize / 20);
                  
                  ctx.fillStyle = el.color || '#ffffff';
                  ctx.fillText(line, 0, lineY);
                  
                  // Reset shadow for outline
                  ctx.shadowColor = 'transparent';
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  // Dark grungy outline
                  ctx.lineWidth = Math.max(1, el.fontSize / 40);
                  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                  ctx.strokeText(line, 0, lineY);
                } else if (el.templateStyle === 'sports_split') {
                  // The font needs to be italic and bold
                  ctx.font = `italic bold ${el.fontSize}px ${el.fontFamily}`;
                  
                  // Split the line into two parts using explicit properties, fallback to line splitting
                  let firstWord = el.textLeft;
                  let secondWord = el.textRight;
                  
                  // If explicit properties don't exist yet, fallback to splitting the line
                  if (firstWord === undefined) {
                    const words = line.split(' ');
                    firstWord = words[0] || '';
                    secondWord = words.slice(1).join(' ') || '';
                  }
                  
                  // Apply textCase manually since we bypass normal textToRender for these two words
                  if (el.textCase === 'uppercase') {
                    firstWord = firstWord?.toUpperCase() || '';
                    secondWord = secondWord?.toUpperCase() || '';
                  } else if (el.textCase === 'lowercase') {
                    firstWord = firstWord?.toLowerCase() || '';
                    secondWord = secondWord?.toLowerCase() || '';
                  }
                  
                  // Measure text to calculate bounding boxes
                  const firstWordWidth = ctx.measureText(firstWord || '').width;
                  const spaceWidth = ctx.measureText(' ').width;
                  const secondWordWidth = ctx.measureText(secondWord || '').width;
                  
                  const paddingX = el.fontSize * 0.4;
                  
                  // Slant amount for the parallelogram
                  const slant = el.fontSize * 0.25;
                  
                  const totalWidth = firstWordWidth + (secondWord ? spaceWidth + secondWordWidth : 0);
                  const startX = -totalWidth / 2;
                  
                  // Height calculations
                  const boxTop = lineY - el.fontSize * 0.9;
                  const boxBottom = lineY + el.fontSize * 0.15;
                  
                  // Calculate exact cutoff point between left box and right box
                  // Since the font is italic, the text inherently leans right.
                  // We need to shift the cutoff point to the right so it doesn't clip the first word.
                  const italicOffset = el.fontSize * 0.15; 
                  
                  // Shift the entire text rendering block RIGHT slightly so it doesn't hit the left slant
                  const textStartX = startX + paddingX * 0.5;
                  
                  const boxSplitX_bottom = textStartX + firstWordWidth + (secondWord ? spaceWidth * 0.8 : paddingX) + italicOffset;
                  const boxSplitX_top = boxSplitX_bottom + slant;

                  // Make the left box slightly wider to accommodate the right shift
                  const black_bl_x = startX - paddingX * 1.2;
                  const black_bl_y = boxBottom;
                  const black_tl_x = black_bl_x + slant;
                  const black_tl_y = boxTop;
                  const black_br_x = boxSplitX_bottom;
                  const black_br_y = boxBottom;
                  const black_tr_x = boxSplitX_top;
                  const black_tr_y = boxTop;

                  const blue_bl_x = boxSplitX_bottom;
                  const blue_bl_y = boxBottom;
                  const blue_tl_x = boxSplitX_top;
                  const blue_tl_y = boxTop;
                  const blue_br_x = startX + totalWidth + paddingX;
                  const blue_br_y = boxBottom;
                  const blue_tr_x = blue_br_x + slant;
                  const blue_tr_y = boxTop;
                  
                  // Apply shadow to entire banner boxes
                  ctx.shadowColor = 'rgba(0,0,0,0.6)';
                  ctx.shadowBlur = 10;
                  ctx.shadowOffsetX = 8;
                  ctx.shadowOffsetY = 8;
                  
                  if (secondWord) {
                    // Draw Right Box (Blue)
                    ctx.beginPath();
                    ctx.moveTo(blue_tl_x, blue_tl_y);
                    ctx.lineTo(blue_tr_x, blue_tr_y);
                    ctx.lineTo(blue_br_x, blue_br_y);
                    ctx.lineTo(blue_bl_x, blue_bl_y);
                    ctx.closePath();
                    
                    const blueGrad = ctx.createLinearGradient(0, boxTop, 0, boxBottom);
                    // Lighten the user's base color slightly for the top gradient stop
                    blueGrad.addColorStop(0, el.boxColor2 || '#247abf');
                    blueGrad.addColorStop(1, el.boxColor2 || '#247abf'); 
                    ctx.fillStyle = blueGrad;
                    ctx.fill();
                  }

                  // Draw Left Box (Black)
                  ctx.beginPath();
                  ctx.moveTo(black_tl_x, black_tl_y);
                  ctx.lineTo(black_tr_x, black_tr_y);
                  ctx.lineTo(black_br_x, black_br_y);
                  ctx.lineTo(black_bl_x, black_bl_y);
                  ctx.closePath();
                  ctx.fillStyle = el.boxColor1 || '#171717';
                  ctx.fill();
                  
                  // Reset shadow before stroking borders
                  ctx.shadowColor = 'transparent';
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  
                  if (secondWord) {
                    // Right Box Dark Border (Top, Right, Bottom)
                    ctx.beginPath();
                    ctx.moveTo(blue_tl_x, blue_tl_y);
                    ctx.lineTo(blue_tr_x, blue_tr_y);
                    ctx.lineTo(blue_br_x, blue_br_y);
                    ctx.lineTo(blue_bl_x, blue_bl_y);
                    ctx.strokeStyle = el.strokeColor2 || '#135185';
                    ctx.lineWidth = Math.max(2, el.fontSize * 0.06);
                    ctx.lineJoin = 'miter';
                    ctx.stroke();
                  }
                  
                  // Left Box Accent Border (Top, Left, Bottom)
                  ctx.beginPath();
                  ctx.moveTo(black_tr_x, black_tr_y);
                  ctx.lineTo(black_tl_x, black_tl_y);
                  ctx.lineTo(black_bl_x, black_bl_y);
                  ctx.lineTo(black_br_x, black_br_y);
                  ctx.strokeStyle = el.strokeColor1 || '#2bc299';
                  ctx.lineWidth = Math.max(2, el.fontSize * 0.08);
                  ctx.lineJoin = 'miter';
                  ctx.stroke();

                  // Setup Text Drawing
                  ctx.textAlign = 'left';
                  
                  // Sharp, short drop shadow for the letters
                  ctx.shadowColor = 'rgba(0,0,0,0.8)';
                  ctx.shadowBlur = 0; 
                  ctx.shadowOffsetX = Math.max(1, el.fontSize * 0.04);
                  ctx.shadowOffsetY = Math.max(1, el.fontSize * 0.04);
                  
                  // First Word (White)
                  ctx.fillStyle = el.color || '#ffffff';
                  ctx.fillText(firstWord || '', textStartX, lineY);
                  
                  // Second Word (Yellow)
                  if (secondWord) {
                    ctx.fillStyle = el.color2 || '#fdf646';
                    // We also shift the second word slightly to the right to clear the slant
                    ctx.fillText(secondWord, textStartX + firstWordWidth + spaceWidth * 1.5, lineY);
                  }
                  
                  // Reset alignment to prevent messing up other elements
                  ctx.textAlign = 'center';
                  ctx.shadowColor = 'transparent';
                } else if (el.templateStyle === 'colorful_words') {
                  const palette = ['#FFB3C6', '#FFD166', '#A0C4FF', '#FF9F1C'];
                  
                  ctx.textAlign = 'left';
                  const words = line.split(' ');
                  
                  // Calculate total line width by simulating with spaces
                  let totalWidth = 0;
                  words.forEach((word, idx) => {
                     totalWidth += ctx.measureText(word).width;
                     if (idx < words.length - 1) {
                         totalWidth += ctx.measureText(' ').width;
                     }
                  });
                  
                  let currentX = -totalWidth / 2;
                  
                  words.forEach((word, wordIdx) => {
                     // Determine global word index based on all previous lines? 
                     // The problem is we don't have global word index easily here.
                     // But we can just use wordIdx per line, or maybe compute a rough global index
                     // For simplicity, we just use wordIdx % palette.length
                     // To make it continuous, let's calculate a global offset up to this line
                     let wordsBeforeThisLine = 0;
                     for (let pastLine = 0; pastLine < i; pastLine++) {
                         wordsBeforeThisLine += lines[pastLine].split(' ').length;
                     }
                     const globalIdx = wordsBeforeThisLine + wordIdx;
                     
                     ctx.fillStyle = palette[globalIdx % palette.length];
                     ctx.fillText(word, currentX, lineY);
                     currentX += ctx.measureText(word).width;
                     if (wordIdx < words.length - 1) {
                         currentX += ctx.measureText(' ').width;
                     }
                  });
                  ctx.textAlign = 'center'; // Restore
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
                } else if ((el as any).isHanging && (!el.templateStyle || el.templateStyle === 'default')) {
                  const textColor = el.color || '#FFFFFF';
                  const extrudeDepth = Math.max(4, Math.floor(el.fontSize * 0.12));
                  let r = 200, g = 200, b = 200;
                  if (textColor.startsWith('#') && textColor.length === 7) {
                    r = parseInt(textColor.slice(1,3), 16);
                    g = parseInt(textColor.slice(3,5), 16);
                    b = parseInt(textColor.slice(5,7), 16);
                  }
                  const extrudeColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;
                  ctx.save();
                  for(let j = extrudeDepth; j >= 1; j--) {
                      ctx.fillStyle = extrudeColor;
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
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                  const lineWidth = ctx.measureText(line).width;
                  ctx.fillStyle = el.useGradient ? getStyle(el, -lineWidth/2, lineY, lineWidth/2, lineY) : textColor;
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
                } else if (el.templateStyle === 'popup_words') {
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
                } else if (el.templateStyle === 'scattered') {
                  const words = line.split(' ');
                  const totalWords = words.length;
                  
                  const isArabic = /[\u0600-\u06FF\u0750-\u077F]/.test(line);
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
                } else if (el.templateStyle === 'arabic_cascade') {
                  const words = line.split(' ').filter(w => w.trim() !== '');
                  const totalWords = words.length;
                  
                  const allWords = textToRender.split(/\s+/).filter(w => w.trim() !== '');
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
                } else if (el.type === 'sticker_text') {
                  if (el.useGradient && el.color2) {
                     // Create vertical gradient matching the text bounds
                     const grad = ctx.createLinearGradient(0, lineY - el.fontSize/2, 0, lineY + el.fontSize/2);
                     grad.addColorStop(0, el.color || '#ff0000');
                     grad.addColorStop(1, el.color2 || '#ff8888');
                     ctx.fillStyle = grad;
                  } else {
                     ctx.fillStyle = el.color || '#FFFFFF';
                  }
                  ctx.fillText(line, 0, lineY);
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
          else if (el.type === 'banner') {
              ctx.save();
              ctx.translate(el.x, el.y);
              ctx.globalAlpha = el.opacity ?? 1;

              const slant = el.slant ?? 25;
              const w = el.width || 600;
              const h = el.height || 100;
              
              const startX = -w / 2;
              const boxTop = -h / 2;
              const boxBottom = h / 2;

              // Apply shadow to entire banner boxes
              ctx.shadowColor = 'rgba(0,0,0,0.6)';
              ctx.shadowBlur = 10;
              ctx.shadowOffsetX = 8;
              ctx.shadowOffsetY = 8;

              // Calculate bounding boxes for left and right parts
              // Let's divide it roughly equally, but the user can use spaces to move things around, or we can center it.
              // We'll just split it down the middle exactly at `x = 0`.
              const splitX_bottom = slant / 2;
              const splitX_top = splitX_bottom + slant;
              
              const black_bl_x = startX;
              const black_bl_y = boxBottom;
              const black_tl_x = startX + slant;
              const black_tl_y = boxTop;
              const black_br_x = splitX_bottom;
              const black_br_y = boxBottom;
              const black_tr_x = splitX_top;
              const black_tr_y = boxTop;
              
              const blue_bl_x = splitX_bottom;
              const blue_bl_y = boxBottom;
              const blue_tl_x = splitX_top;
              const blue_tl_y = boxTop;
              const blue_br_x = startX + w;
              const blue_br_y = boxBottom;
              const blue_tr_x = blue_br_x + slant;
              const blue_tr_y = boxTop;

              // Draw Right Box
              ctx.beginPath();
              ctx.moveTo(blue_tl_x, blue_tl_y);
              ctx.lineTo(blue_tr_x, blue_tr_y);
              ctx.lineTo(blue_br_x, blue_br_y);
              ctx.lineTo(blue_bl_x, blue_bl_y);
              ctx.closePath();
              
              const blueGrad = ctx.createLinearGradient(0, boxTop, 0, boxBottom);
              blueGrad.addColorStop(0, el.boxColor2 || '#247abf');
              blueGrad.addColorStop(1, el.boxColor2 || '#247abf');
              ctx.fillStyle = blueGrad;
              ctx.globalAlpha = (el.opacity ?? 1) * (el.boxOpacity2 ?? el.boxOpacity ?? 1);
              ctx.fill();

              // Draw Left Box
              ctx.beginPath();
              ctx.moveTo(black_tl_x, black_tl_y);
              ctx.lineTo(black_tr_x, black_tr_y);
              ctx.lineTo(black_br_x, black_br_y);
              ctx.lineTo(black_bl_x, black_bl_y);
              ctx.closePath();
              ctx.fillStyle = el.boxColor1 || '#171717';
              ctx.globalAlpha = (el.opacity ?? 1) * (el.boxOpacity1 ?? el.boxOpacity ?? 1);
              ctx.fill();
              
              // Reset alpha for borders and text
              ctx.globalAlpha = el.opacity ?? 1;

              // Reset shadow before stroking borders
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Right Box Dark Border (Top, Right, Bottom)
              ctx.beginPath();
              ctx.moveTo(blue_tl_x, blue_tl_y);
              ctx.lineTo(blue_tr_x, blue_tr_y);
              ctx.lineTo(blue_br_x, blue_br_y);
              ctx.lineTo(blue_bl_x, blue_bl_y);
              ctx.strokeStyle = el.strokeColor2 || '#135185';
              ctx.lineWidth = Math.max(2, h * 0.06);
              ctx.lineJoin = 'miter';
              ctx.stroke();

              // Left Box Accent Border (Top, Left, Bottom)
              ctx.beginPath();
              ctx.moveTo(black_tr_x, black_tr_y);
              ctx.lineTo(black_tl_x, black_tl_y);
              ctx.lineTo(black_bl_x, black_bl_y);
              ctx.lineTo(black_br_x, black_br_y);
              ctx.strokeStyle = el.strokeColor1 || '#2bc299';
              ctx.lineWidth = Math.max(2, h * 0.08);
              ctx.lineJoin = 'miter';
              ctx.stroke();

              // Render Texts
              let firstWord = el.textLeft || '';
              let secondWord = el.textRight || '';
              
              if (el.textCase === 'uppercase') {
                firstWord = firstWord.toUpperCase();
                secondWord = secondWord.toUpperCase();
              } else if (el.textCase === 'lowercase') {
                firstWord = firstWord.toLowerCase();
                secondWord = secondWord.toLowerCase();
              }

              // Font size auto-scales with height
              const fontSize = h * 0.6;
              ctx.font = `italic bold ${fontSize}px ${el.fontFamily || 'Oswald'}`;
              ctx.textBaseline = 'middle';
              
              ctx.shadowColor = 'rgba(0,0,0,0.8)';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = Math.max(1, fontSize * 0.04);
              ctx.shadowOffsetY = Math.max(1, fontSize * 0.04);
              
              // Center in left box
              // Left box center X is roughly (black_bl_x + black_tr_x) / 2
              const leftCenterX = (black_bl_x + black_tr_x) / 2;
              ctx.fillStyle = el.color || '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText(firstWord, leftCenterX, 0);

              // Center in right box
              const rightCenterX = (blue_bl_x + blue_tr_x) / 2;
              ctx.fillStyle = el.color2 || '#fdf646';
              ctx.textAlign = 'center';
              ctx.fillText(secondWord, rightCenterX, 0);
              
              ctx.restore();
          }
          else if (el.type === 'bracket_banner') {
             ctx.save();
             ctx.translate(el.x, el.y);
             ctx.scale(el.scale, el.scale);
             ctx.rotate(el.rotation * Math.PI / 180);

             const w = el.width || 600;
             const h = el.height || 100;
             const radius = h / 2;
             
             // Shadow for the entire element
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 15;
             ctx.shadowOffsetX = 0;
             ctx.shadowOffsetY = 8;

             // Main Pill shape
             ctx.beginPath();
             ctx.moveTo(-w/2 + radius, -radius);
             ctx.lineTo(w/2 - radius, -radius);
             ctx.arc(w/2 - radius, 0, radius, -Math.PI/2, Math.PI/2);
             ctx.lineTo(-w/2 + radius, radius);
             ctx.arc(-w/2 + radius, 0, radius, Math.PI/2, -Math.PI/2);
             ctx.closePath();

             // Gradient fill
             const grad = ctx.createLinearGradient(0, -radius, 0, radius);
             grad.addColorStop(0, el.boxColor1 || '#df001c');
             grad.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = grad;
             ctx.globalAlpha = (el.opacity ?? 1) * (el.boxOpacity ?? 1);
             ctx.fill();
             
             ctx.globalAlpha = el.opacity ?? 1;

             // Remove shadow for borders
             ctx.shadowColor = 'transparent';
             ctx.shadowBlur = 0;
             ctx.shadowOffsetX = 0;
             ctx.shadowOffsetY = 0;

             // Border
             ctx.strokeStyle = el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(2, h * 0.04);
             ctx.stroke();

             // Brackets
             const gap = h * 0.08;
             const bracketWidth = h * 0.15;
             const angle = Math.PI * 0.3;
             const radiusInner = radius + gap;

             // Right Bracket
             let cx = w/2 - radius;
             let startX = cx + radiusInner * Math.cos(-angle);
             let startY = radiusInner * Math.sin(-angle);
             let endX = cx + radiusInner * Math.cos(angle);
             let endY = radiusInner * Math.sin(angle);
             let midX = cx + radiusInner + bracketWidth;
             let cpX = 2 * midX - (startX + endX) / 2;

             ctx.beginPath();
             ctx.arc(cx, 0, radiusInner, -angle, angle, false);
             ctx.quadraticCurveTo(cpX, 0, startX, startY);
             ctx.closePath();

             const bracketGrad1 = ctx.createLinearGradient(0, -h/2, 0, h/2);
             bracketGrad1.addColorStop(0, el.boxColor1 || '#df001c');
             bracketGrad1.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = bracketGrad1;
             ctx.fill();
             
             ctx.strokeStyle = el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(1, h * 0.02);
             ctx.stroke();

             // Left Bracket
             cx = -w/2 + radius;
             startX = cx + radiusInner * Math.cos(Math.PI + angle);
             startY = radiusInner * Math.sin(Math.PI + angle);
             endX = cx + radiusInner * Math.cos(Math.PI - angle);
             endY = radiusInner * Math.sin(Math.PI - angle);
             midX = cx - radiusInner - bracketWidth;
             cpX = 2 * midX - (startX + endX) / 2;

             ctx.beginPath();
             ctx.arc(cx, 0, radiusInner, Math.PI + angle, Math.PI - angle, true);
             ctx.quadraticCurveTo(cpX, 0, startX, startY);
             ctx.closePath();

             const bracketGrad2 = ctx.createLinearGradient(0, -h/2, 0, h/2);
             bracketGrad2.addColorStop(0, el.boxColor1 || '#df001c');
             bracketGrad2.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = bracketGrad2;
             ctx.fill();
             
             ctx.strokeStyle = el.strokeColor2 || el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(1, h * 0.02);
             ctx.stroke();

             // Text
             ctx.shadowColor = 'rgba(0,0,0,0.5)';
             ctx.shadowBlur = 4;
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;

             let textStr = (el as any).text || '';
             if (el.textCase === 'uppercase') textStr = textStr.toUpperCase();
             else if (el.textCase === 'lowercase') textStr = textStr.toLowerCase();
             
             const fontSize = h * 0.5;
             ctx.font = `bold ${fontSize}px ${el.fontFamily || 'Arial'}`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillStyle = el.color || '#ffffff';
             ctx.fillText(textStr, 0, 0);

             ctx.restore();
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
          else if (el.type === 'radial_dots') {
            const count = (el as any).count || 60;
            const layers = (el as any).layers || 5;
            const dotSize = (el as any).dotSize || 5;
            const step = (Math.PI * 2) / count;
            
            const rMax = el.radius + layers * dotSize * 3;
            ctx.fillStyle = getStyle(el, el.x - rMax, el.y - rMax, el.x + rMax, el.y + rMax);
            
            for (let i = 0; i < count; i++) {
              const halfCount = count / 2;
              let mirrorIndex = i;
              if (i > halfCount) {
                  mirrorIndex = count - i;
              }
              const freqIndex = Math.floor((mirrorIndex / halfCount) * (freqLength * 0.4));
              const value = freqData[freqIndex] || 0;
              const normalized = value / 255;
              
              const activeLayers = (normalized * layers * 1.5) + 0.2; // slight base visibility
              
              const angle = i * step - Math.PI / 2;
              const cosA = Math.cos(angle);
              const sinA = Math.sin(angle);
              
              for (let j = 0; j < layers; j++) {
                  const distance = el.radius + j * (dotSize * 3);
                  
                  let dotAlpha = 0;
                  if (j < activeLayers) {
                      dotAlpha = 1;
                  } else if (j - activeLayers < 1) {
                      dotAlpha = 1 - (j - activeLayers);
                  }
                  
                  if (dotAlpha > 0.01) {
                      ctx.globalAlpha = el.opacity * dotAlpha;
                      const currentDotSize = dotSize * (0.6 + 0.4 * dotAlpha);
                      
                      const px = el.x + cosA * distance;
                      const py = el.y + sinA * distance;
                      
                      ctx.beginPath();
                      ctx.arc(px, py, currentDotSize, 0, Math.PI * 2);
                      ctx.fill();
                  }
              }
            }
          }
          else if (el.type === 'glowing_blocks') {
            const e = el as any;
            const cols = e.columns || 8;
            const rows = e.rows || 6;
            const blockW = e.blockWidth || 20;
            const maxBlockH = e.blockHeight || 40;
            const spacing = e.spacing || 10;
            const glowIntensity = e.glowIntensity || 20;
            
            const totalW = cols * blockW + Math.max(0, cols - 1) * spacing;
            const totalH = rows * maxBlockH + Math.max(0, rows - 1) * spacing;
            
            const startX = el.x - totalW / 2;
            const startY = el.y - totalH / 2;
            
            ctx.fillStyle = getStyle(el, el.x - totalW/2, el.y - totalH/2, el.x + totalW/2, el.y + totalH/2);
            
            for (let c = 0; c < cols; c++) {
               const distFromCenter = Math.abs(c - (cols - 1) / 2);
               const freqIndex = Math.floor((distFromCenter / (cols/2)) * (freqLength * 0.4));
               const value = freqData[freqIndex] || 0;
               const normalized = value / 255;
               
               const litRowsHalf = normalized * (rows / 2);
               
               for (let r = 0; r < rows; r++) {
                  const rowDistFromCenter = Math.abs(r - (rows - 1) / 2);
                  
                  const litThreshold = litRowsHalf + 0.2; 
                  
                  let litAlpha = 0;
                  if (rowDistFromCenter < litThreshold) {
                      litAlpha = 1;
                  } else if (rowDistFromCenter - litThreshold < 1) {
                      litAlpha = 1 - (rowDistFromCenter - litThreshold);
                  }
                  
                  const alpha = 0.05 + litAlpha * 0.95;
                  
                  ctx.globalAlpha = el.opacity * alpha;
                  
                  if (litAlpha > 0.1) {
                      ctx.shadowBlur = glowIntensity * litAlpha;
                      ctx.shadowColor = el.color;
                  } else {
                      ctx.shadowBlur = 0;
                  }
                  
                  const bx = startX + c * (blockW + spacing);
                  const by = startY + r * (maxBlockH + spacing);
                  
                  const currentH = maxBlockH * (0.8 + 0.2 * litAlpha);
                  const yOffset = (maxBlockH - currentH) / 2;
                  
                  ctx.fillRect(bx, by + yOffset, blockW, currentH);
               }
            }
            ctx.shadowBlur = 0;
          }
          else if (el.type === 'perspective_ring') {
            const averageFreq = freqData.length ? freqData.reduce((a,b)=>a+b,0) / freqData.length : 0;
            const intensity = averageFreq / 255;
            
            const pRing = el as any;
            const r = pRing.radius || 200;
            const perspective = pRing.perspective || 0.3;
            const thickness = pRing.thickness || 15;
            const segments = pRing.segments || 60;
            const step = (Math.PI * 2) / segments;
            
            ctx.save();
            ctx.translate(el.x, el.y);
            // apply perspective squash
            ctx.scale(1, perspective);
            
            // Draw background glowing ring
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.lineWidth = thickness * 0.2;
            ctx.strokeStyle = pRing.useGradient ? (pRing.color2 || '#e94560') : (pRing.color || '#fff');
            ctx.shadowBlur = 10 + intensity * 30;
            ctx.shadowColor = ctx.strokeStyle as string;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Draw segment dashes based on audio frequency
            for (let i = 0; i < segments; i++) {
                const freqIndex = Math.floor((i / segments) * (freqLength * 0.6));
                const value = freqData[freqIndex] || 0;
                const normalized = value / 255;
                
                const angle = i * step;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                
                const px1 = cosA * (r - thickness / 2);
                const py1 = sinA * (r - thickness / 2);
                const px2 = cosA * (r + thickness / 2 + normalized * thickness * 2);
                const py2 = sinA * (r + thickness / 2 + normalized * thickness * 2);
                
                ctx.beginPath();
                ctx.moveTo(px1, py1);
                ctx.lineTo(px2, py2);
                
                ctx.lineWidth = (Math.PI * r * 2) / segments * 0.5;
                ctx.strokeStyle = getStyle(el, -r, -r, r, r);
                
                if (normalized > 0.2) {
                    ctx.shadowBlur = normalized * 20;
                    ctx.shadowColor = el.color || '#fff';
                } else {
                    ctx.shadowBlur = 0;
                }
                
                ctx.stroke();
            }
            ctx.restore();
          }
          else if (el.type === 'progress_bar') {
             const pBar = el as any;
             const width = pBar.width || 600;
             const height = pBar.height || 4;
             
             let prog = 0;
             if (duration && duration > 0 && currentTimeRef.current) {
                 prog = currentTimeRef.current / duration;
             }
             
             ctx.save();
             ctx.translate(el.x, el.y);
             
             // draw background track
             ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
             ctx.beginPath();
             ctx.roundRect(-width/2, -height/2, width, height, height/2);
             ctx.fill();
             
             // draw progress fill and knob
             if (prog > 0) {
                 ctx.fillStyle = getStyle(el, -width/2, 0, width/2, 0);
                 ctx.shadowBlur = 15;
                 ctx.shadowColor = el.color || '#fff';
                 
                 ctx.beginPath();
                 ctx.roundRect(-width/2, -height/2, width * prog, height, height/2);
                 ctx.fill();
                 
                 // draw knob
                 ctx.beginPath();
                 const knobX = -width/2 + width * prog;
                 ctx.arc(knobX, 0, height * 2.5, 0, Math.PI * 2);
                 ctx.fill();
             }
             ctx.shadowBlur = 0;
             
             if (pBar.showTime !== false) {
                 ctx.fillStyle = '#ffffff';
                 ctx.font = `${pBar.fontSize || 24}px ${pBar.fontFamily || 'Inter'}`;
                 ctx.textAlign = 'right';
                 ctx.textBaseline = 'middle';
                 
                 const currentSec = Math.floor(currentTimeRef.current || 0);
                 const m = Math.floor(currentSec / 60);
                 const s = currentSec % 60;
                 const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
                 
                 ctx.fillText(timeStr, width/2, height/2 + 20 + (pBar.fontSize || 24)/2);
             }
             
             ctx.restore();
          }
          else if (el.type === 'progress_visualizer') {
             const pViz = el as any;
             const width = pViz.width || 640;
             const trackHeight = pViz.height || 4;
             const maxBarHeight = pViz.barHeight || 40;
             const barWidth = pViz.barWidth || 4;
             const barSpacing = pViz.barSpacing || 3;
             const style = pViz.waveformStyle || 'bars';
             const showKnob = pViz.showKnob !== false;
             const knobRadius = pViz.knobSize || 7;
             const glow = pViz.glowIntensity !== undefined ? pViz.glowIntensity : 15;
             const trackColor = pViz.trackColor || 'rgba(255, 255, 255, 0.2)';
             const wOffset = pViz.waveformOffset || 0;
             
             let prog = 0;
             if (duration && duration > 0 && currentTimeRef.current) {
                 prog = Math.min(1, Math.max(0, currentTimeRef.current / duration));
             }
             
             const barStep = barWidth + barSpacing;
             const barCount = Math.max(10, Math.floor((width - barSpacing) / barStep));
             const effectiveWidth = (barCount - 1) * barStep + barWidth;
             const startX = -effectiveWidth / 2;

             ctx.save();
             ctx.translate(el.x, el.y);

             // Calculate bass boost for subtle dynamic responsiveness
             const bassAvg = freqData.length ? (freqData.slice(0, 8).reduce((a, b) => a + b, 0) / (8 * 255)) : 0;
             
             // 1. Draw Waveform / Visualizer Bars / Waves
             if (style === 'bars') {
                 for (let i = 0; i < barCount; i++) {
                     const barProg = barCount > 1 ? i / (barCount - 1) : 0;
                     const isPast = barProg <= prog;
                     
                     const freqIdx = Math.floor((i / barCount) * Math.min(freqLength, 96));
                     const val = freqData[freqIdx] || 0;
                     const amp = val / 255;
                     const bh = Math.max(4, amp * maxBarHeight + (bassAvg * 4));
                     const bx = startX + i * barStep;
                     const by = -trackHeight / 2 - wOffset;

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
                     ctx.roundRect(bx, by - bh, barWidth, bh, [barWidth/2, barWidth/2, 1, 1]);
                     ctx.fill();
                 }
                 ctx.shadowBlur = 0;
             } else if (style === 'mirrored') {
                 for (let i = 0; i < barCount; i++) {
                     const barProg = barCount > 1 ? i / (barCount - 1) : 0;
                     const isPast = barProg <= prog;
                     
                     const freqIdx = Math.floor((i / barCount) * Math.min(freqLength, 96));
                     const val = freqData[freqIdx] || 0;
                     const amp = val / 255;
                     const bh = Math.max(4, amp * maxBarHeight);
                     const bx = startX + i * barStep;

                     if (isPast) {
                         ctx.fillStyle = getStyle(el, -width/2, 0, width/2, 0);
                         if (glow > 0) {
                             ctx.shadowBlur = glow;
                             ctx.shadowColor = el.color || '#3b82f6';
                         }
                     } else {
                         ctx.fillStyle = trackColor;
                         ctx.shadowBlur = 0;
                     }

                     ctx.beginPath();
                     ctx.roundRect(bx, -bh / 2 - wOffset, barWidth, bh, barWidth / 2);
                     ctx.fill();
                 }
                 ctx.shadowBlur = 0;
             } else if (style === 'spectrum') {
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
             } else if (style === 'segmented') {
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
                         const by = -trackHeight / 2 - 2 - wOffset - (s * stepHeight) - segmentHeight;
                         
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
             } else if (style === 'dots') {
                 const dotLayers = 6;
                 const dotSize = Math.max(2, Math.min(barWidth, 6));
                 for (let i = 0; i < barCount; i++) {
                     const barProg = barCount > 1 ? i / (barCount - 1) : 0;
                     const isPast = barProg <= prog;
                     const freqIdx = Math.floor((i / barCount) * Math.min(freqLength, 96));
                     const val = freqData[freqIdx] || 0;
                     const amp = val / 255;
                     const activeLayers = Math.ceil(amp * dotLayers);
                     const bx = startX + i * barStep + barWidth / 2;

                     for (let l = 0; l < dotLayers; l++) {
                         const dy = -trackHeight / 2 - 4 - wOffset - l * (dotSize * 1.6);
                         const isLit = l < activeLayers;
                         if (isPast && isLit) {
                             ctx.fillStyle = getStyle(el, -width/2, 0, width/2, 0);
                             ctx.shadowBlur = glow;
                             ctx.shadowColor = el.color || '#3b82f6';
                         } else if (isLit) {
                             ctx.fillStyle = trackColor;
                             ctx.shadowBlur = 0;
                         } else {
                             ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                             ctx.shadowBlur = 0;
                         }
                         ctx.beginPath();
                         ctx.arc(bx, dy, dotSize / 2, 0, Math.PI * 2);
                         ctx.fill();
                     }
                 }
                 ctx.shadowBlur = 0;
             } else if (style === 'wave') {
                 const points: { x: number; y: number }[] = [];
                 for (let i = 0; i < barCount; i++) {
                     const freqIdx = Math.floor((i / barCount) * Math.min(freqLength, 96));
                     const val = freqData[freqIdx] || 0;
                     const amp = val / 255;
                     const bh = amp * maxBarHeight;
                     const bx = startX + i * barStep + barWidth / 2;
                     points.push({ x: bx, y: -trackHeight / 2 - 4 - wOffset - bh });
                 }

                 if (points.length > 1) {
                     // Draw inactive wave first
                     ctx.strokeStyle = trackColor;
                     ctx.lineWidth = 2.5;
                     ctx.beginPath();
                     ctx.moveTo(points[0].x, points[0].y);
                     for (let i = 1; i < points.length; i++) {
                         const xc = (points[i].x + points[i-1].x) / 2;
                         const yc = (points[i].y + points[i-1].y) / 2;
                         ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
                     }
                     ctx.stroke();

                     // Draw active filled wave with clip
                     if (prog > 0) {
                         ctx.save();
                         ctx.beginPath();
                         ctx.rect(-width/2 - 10, -maxBarHeight - 50 - wOffset, width * prog + 10, maxBarHeight + 100 + wOffset);
                         ctx.clip();

                         ctx.strokeStyle = getStyle(el, -width/2, 0, width/2, 0);
                         ctx.lineWidth = 3;
                         if (glow > 0) {
                             ctx.shadowBlur = glow;
                             ctx.shadowColor = el.color || '#3b82f6';
                         }
                         ctx.beginPath();
                         ctx.moveTo(points[0].x, points[0].y);
                         for (let i = 1; i < points.length; i++) {
                             const xc = (points[i].x + points[i-1].x) / 2;
                             const yc = (points[i].y + points[i-1].y) / 2;
                             ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
                         }
                         ctx.stroke();
                         ctx.restore();
                     }
                 }
             }

             // 2. Draw Main Progress Track Bar
             ctx.fillStyle = trackColor;
             ctx.beginPath();
             ctx.roundRect(-width/2, -trackHeight/2, width, trackHeight, trackHeight/2);
             ctx.fill();

             // 3. Draw Active Progress Fill
             if (prog > 0) {
                 ctx.fillStyle = getStyle(el, -width/2, 0, width/2, 0);
                 if (glow > 0) {
                     ctx.shadowBlur = glow;
                     ctx.shadowColor = el.color || '#3b82f6';
                 }
                 ctx.beginPath();
                 ctx.roundRect(-width/2, -trackHeight/2, Math.max(trackHeight, width * prog), trackHeight, trackHeight/2);
                 ctx.fill();
                 ctx.shadowBlur = 0;
             }

             // 4. Draw Playhead Knob
             const knobX = -width/2 + width * prog;
             if (showKnob) {
                 const reactivePulse = bassAvg * 3;
                 // Outer soft halo
                 ctx.fillStyle = el.color ? `${el.color}33` : 'rgba(59, 130, 246, 0.25)';
                 ctx.beginPath();
                 ctx.arc(knobX, 0, knobRadius + 4 + reactivePulse, 0, Math.PI * 2);
                 ctx.fill();

                 // Main Knob
                 ctx.fillStyle = '#ffffff';
                 if (glow > 0) {
                     ctx.shadowBlur = glow + 5;
                     ctx.shadowColor = el.color || '#3b82f6';
                 }
                 ctx.beginPath();
                 ctx.arc(knobX, 0, knobRadius + reactivePulse * 0.5, 0, Math.PI * 2);
                 ctx.fill();
                 ctx.shadowBlur = 0;

                 // Inner core
                 ctx.fillStyle = el.color || '#3b82f6';
                 ctx.beginPath();
                 ctx.arc(knobX, 0, Math.max(2, knobRadius * 0.45), 0, Math.PI * 2);
                 ctx.fill();
             }

             // 5. Draw Timestamps (Current Time on Left, Duration on Right)
             if (pViz.showTime !== false) {
                 const currentSec = Math.floor(currentTimeRef.current || 0);
                 const curM = Math.floor(currentSec / 60);
                 const curS = currentSec % 60;
                 const curTimeStr = `${curM}:${curS.toString().padStart(2, '0')}`;

                 const durSec = Math.floor(duration || 0);
                 const durM = Math.floor(durSec / 60);
                 const durS = durSec % 60;
                 const durTimeStr = `${durM}:${durS.toString().padStart(2, '0')}`;

                 const fSize = pViz.fontSize || 16;
                 ctx.font = `600 ${fSize}px ${pViz.fontFamily || 'Inter'}`;
                 ctx.fillStyle = '#ffffff';
                 ctx.textBaseline = 'top';
                 const textY = trackHeight/2 + 10;

                 // Left: Current time
                 ctx.textAlign = 'left';
                 ctx.fillText(curTimeStr, -width/2, textY);

                 // Right: Total duration
                 ctx.textAlign = 'right';
                 ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                 ctx.fillText(durTimeStr, width/2, textY);
             }

             ctx.restore();
          }
          else if (el.type === 'water_splash') {
            const wSplash = el as any;
            const pCount = wSplash.particleCount || 150;
            const splashRadius = wSplash.splashRadius || 250;
            const dropSize = wSplash.dropSize || 5;
            const speed = wSplash.speed || 1;
            
            const bassSum = freqData.slice(0, 10).reduce((a, b) => a + b, 0);
            const bassIntensity = (bassSum / (10 * 255));
            const time = performance.now() * 0.001 * speed;
            
            ctx.fillStyle = wSplash.useGradient ? (wSplash.color2 || '#00ffff') : (wSplash.color || '#00ffff');
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            
            for (let i = 0; i < pCount; i++) {
                const randX = Math.sin(i * 1234.5); 
                const randY = Math.cos(i * 5432.1); 
                const randSpeed = 1 + (Math.sin(i * 314.15) + 1) * 0.5; 
                
                const period = 1.5; 
                const t = (time * randSpeed + (i * 0.123)) % period; 
                
                const startX = el.x + randX * splashRadius * 0.8;
                const startY = el.y;
                
                const vx = randX * 150; 
                const vy = -300 - (randY + 1.2) * 200 * bassIntensity; 
                const gravity = 1000;
                
                const px = startX + vx * t;
                const py = startY + vy * t + 0.5 * gravity * t * t;
                
                if (py <= startY + 20 && t > 0.05) {
                    let size = dropSize * (0.5 + bassIntensity * 0.8) * randSpeed;
                    
                    if (t > period * 0.7) {
                       size *= Math.max(0, 1 - (t - period * 0.7) / (period * 0.3));
                    }
                    
                    const alpha = Math.max(0, 1 - (t / period));
                    ctx.globalAlpha = el.opacity * alpha * (0.2 + bassIntensity * 0.8);
                    
                    ctx.beginPath();
                    const vy_current = vy + gravity * t;
                    if (vy_current > 50) { 
                        ctx.ellipse(px, py, Math.max(0.1, size * 0.8), Math.max(0.1, size * 1.5), Math.atan2(vy_current, vx), 0, Math.PI * 2);
                    } else { 
                        ctx.arc(px, py, Math.max(0.1, size), 0, Math.PI * 2);
                    }
                    ctx.fill();
                }
            }
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
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

      if (!isRecording && snapLinesRef.current && snapLinesRef.current.length > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        snapLinesRef.current.forEach(line => {
          if (line.axis === 'x') {
            ctx.moveTo(line.pos, 0);
            ctx.lineTo(line.pos, canvas.height);
          } else if (line.axis === 'y') {
            ctx.moveTo(0, line.pos);
            ctx.lineTo(canvas.width, line.pos);
          }
        });
        ctx.stroke();
        ctx.restore();
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
