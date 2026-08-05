import React, { useEffect, useRef } from 'react';

interface AnalyticsDashboardProps {
  getAudioData: () => { dataArray: Uint8Array; bufferLength: number };
  getWaveformData: () => { dataArray: Uint8Array; bufferLength: number };
  isPlaying: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ getAudioData, getWaveformData, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const { dataArray: freqData, bufferLength: freqLength } = getAudioData();
      const { dataArray: waveData, bufferLength: waveLength } = getWaveformData();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Waveform (Top)
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981'; // Tailwind emerald-500
      ctx.beginPath();
      
      const sliceWidth = canvas.width / waveLength;
      let x = 0;

      for (let i = 0; i < waveLength; i++) {
        const v = waveData[i] / 128.0;
        const y = (v * canvas.height) / 4; // Top quarter for waveform

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 4);
      ctx.stroke();

      // Draw Frequency Spectrum (Bottom)
      const barWidth = (canvas.width / freqLength) * 2.5;
      let barX = 0;

      // Calculate simple metrics for text
      let bass = 0, mid = 0, treble = 0;
      
      for (let i = 0; i < freqLength; i++) {
        const barHeight = (freqData[i] / 255) * (canvas.height * 0.7);
        
        // Metrics grouping
        if (i < freqLength * 0.1) bass += freqData[i];
        else if (i < freqLength * 0.5) mid += freqData[i];
        else treble += freqData[i];

        const r = barHeight + 25 * (i / freqLength);
        const g = 250 * (i / freqLength);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(barX, canvas.height - barHeight, barWidth, barHeight);

        barX += barWidth + 1;
      }

      // Draw Metrics Text
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`BASS: ${Math.round(bass / (freqLength * 0.1))}`, 10, canvas.height / 2 + 10);
      ctx.fillText(`MID:  ${Math.round(mid / (freqLength * 0.4))}`, 10, canvas.height / 2 + 25);
      ctx.fillText(`TREB: ${Math.round(treble / (freqLength * 0.5))}`, 10, canvas.height / 2 + 40);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [getAudioData, getWaveformData, isPlaying]);

  return (
    <div className="bg-[#121216] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Real-Time Analytics</h3>
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/5">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={150} 
          className="w-full h-full block"
        />
      </div>
      <p className="text-[10px] text-gray-500 font-medium">Live frequency & waveform rendering</p>
    </div>
  );
};
