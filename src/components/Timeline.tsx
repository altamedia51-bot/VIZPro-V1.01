import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Scissors, Bookmark, ZoomIn, ZoomOut, Volume2, VolumeX, Eye, EyeOff, Camera } from 'lucide-react';
import { Project } from '../types';

interface TimelineProps {
  project: Project;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  audioUrl: string | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: any) => void;
  onTakeSnapshot?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onTogglePlay,
  audioUrl,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onTakeSnapshot
}) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<{ id: string, type: 'start' | 'end' | 'move', startX: number, initialStart: number, initialEnd: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingHandle || !onUpdateElement) return;
      
      const deltaX = e.clientX - draggingHandle.startX;
      const deltaTime = deltaX / (20 * zoom);
      
      if (draggingHandle.type === 'start') {
        const newStart = Math.max(0, Math.min(draggingHandle.initialStart + deltaTime, draggingHandle.initialEnd - 0.1));
        onUpdateElement(draggingHandle.id, { startTime: newStart });
      } else if (draggingHandle.type === 'end') {
        const newEnd = Math.max(draggingHandle.initialStart + 0.1, Math.min(draggingHandle.initialEnd + deltaTime, duration || 60));
        onUpdateElement(draggingHandle.id, { endTime: newEnd });
      } else if (draggingHandle.type === 'move') {
        const clipDuration = draggingHandle.initialEnd - draggingHandle.initialStart;
        const newStart = Math.max(0, Math.min(draggingHandle.initialStart + deltaTime, (duration || 60) - clipDuration));
        onUpdateElement(draggingHandle.id, { startTime: newStart, endTime: newStart + clipDuration });
      }
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
    };

    if (draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, zoom, duration, onUpdateElement]);
  
  // Format time function
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tracks = [
    { id: 'audio', name: 'Master Audio Track', type: 'audio' },
    { id: 'bg', name: 'Background Track', type: 'bg' },
    { id: 'viz', name: 'Visualizer Track', type: 'viz' },
    { id: 'text', name: 'Text & Titles Track', type: 'text' },
  ];

  return (
    <div className="bg-[#121216] border border-white/10 rounded-xl overflow-hidden flex flex-col mt-4 shrink-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-1.5 border-b border-white/10 bg-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-white bg-transparent hover:bg-white/5 rounded transition-colors">
            <Scissors size={14} className="text-blue-500" />
            SPLIT CLIP
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-white bg-transparent border border-white/10 hover:bg-white/5 rounded transition-colors">
            <Bookmark size={14} className="text-pink-500" />
            TAMBAH MARKER
          </button>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Player Controls (Moved here from old simple timeline) */}
           <div className="flex items-center gap-2">
             <span className="text-[#3b82f6] font-mono text-xs">{formatTime(currentTime)}</span>
             <span className="text-gray-600 text-xs">/</span>
             <span className="text-gray-400 font-mono text-xs">{formatTime(duration)}</span>
           </div>
           
           <div className="flex items-center gap-1">
             <button onClick={() => onSeek(0)} disabled={!audioUrl} className="p-1 text-gray-400 hover:text-white disabled:opacity-50" title="Rewind to Start">
               <SkipBack size={16} />
             </button>
             <button onClick={onTogglePlay} disabled={!audioUrl} className="p-1 text-gray-400 hover:text-white disabled:opacity-50" title={isPlaying ? "Pause" : "Play"}>
               {isPlaying ? <Pause size={16} /> : <Play size={16} />}
             </button>
             {onTakeSnapshot && (
               <button 
                 onClick={onTakeSnapshot} 
                 className="p-1 text-gray-400 hover:text-cyan-400 transition-colors ml-1" 
                 title="Ambil Snapshot / Screenshot Canvas (PNG)"
               >
                 <Camera size={16} />
               </button>
             )}
           </div>
           
           {/* Zoom Controls */}
           <div className="flex items-center gap-2 px-3 border-l border-white/10 ml-2">
             <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="text-gray-400 hover:text-white"><ZoomOut size={14} /></button>
             <input 
               type="range" 
               min="0.5" 
               max="3" 
               step="0.1" 
               value={zoom} 
               onChange={e => setZoom(Number(e.target.value))}
               className="w-24 h-1 bg-white/10 rounded-full appearance-none accent-blue-500"
             />
             <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="text-gray-400 hover:text-white"><ZoomIn size={14} /></button>
           </div>
        </div>
      </div>
      
      {/* Timeline Area */}
      <div className="flex flex-1 overflow-hidden h-[150px]">
        {/* Track Manager (Left Sidebar) */}
        <div className="w-48 bg-[#141414] border-r border-white/10 flex flex-col shrink-0">
          <div className="p-1.5 border-b border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-widest h-6 flex items-center">
            TRACK MANAJER
          </div>
          <div className="overflow-y-auto flex-1">
            {tracks.map(track => (
              <div key={track.id} className="h-8 border-b border-white/5 flex items-center justify-between px-3 group">
                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white transition-colors">{track.name}</span>
                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                  <button className="text-gray-400 hover:text-white"><Volume2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Clips Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#0D0D0F]" ref={containerRef}>
          {/* Time Ruler */}
          <div className="h-6 border-b border-white/5 bg-[#141414] sticky top-0 text-[10px] flex items-center min-w-max">
            {/* We'll render ruler marks based on duration and zoom */}
            <div 
              className="relative h-full"
              style={{ width: `${Math.max(duration, 60) * 20 * zoom}px`, minWidth: '100%' }}
              onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 const time = x / (20 * zoom);
                 if (time <= duration) onSeek(time);
              }}
            >
               {Array.from({ length: Math.ceil(Math.max(duration, 60) / 5) + 1 }).map((_, i) => (
                 <div key={i} className="absolute h-full border-l border-white/10 flex items-end pb-1 pl-1" style={{ left: `${i * 5 * 20 * zoom}px` }}>
                   <span className="text-[9px] text-gray-500 font-mono">{i * 5}s</span>
                 </div>
               ))}
               
               {/* Playhead */}
               <div 
                 className="absolute top-0 bottom-[-300px] w-px bg-red-500 z-50 pointer-events-none"
                 style={{ left: `${currentTime * 20 * zoom}px` }}
               >
                 <div className="absolute top-0 left-[-4px] w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-red-500" />
               </div>
            </div>
          </div>
          
          {/* Tracks Content */}
          <div className="relative min-w-max" style={{ width: `${Math.max(duration, 60) * 20 * zoom}px`, minWidth: '100%' }}>
            {tracks.map(track => {
               // Determine what clips go in this track
               let clips: any[] = [];
               
               if (track.type === 'audio' && audioUrl) {
                  clips.push({ id: 'audio-main', name: 'Audio Source', color: 'bg-green-600', start: 0, length: duration });
               } else if (track.type === 'bg' && project.backgroundConfig.value) {
                  clips.push({ id: 'bg-main', name: 'Background', color: 'bg-gray-700', start: 0, length: duration || 60 });
               } else if (track.type === 'viz') {
                  clips = project.elements.filter(e => e.type !== 'text' && e.type !== 'subtitle').map(e => ({
                     id: e.id, name: `Visualizer (${e.type})`, color: 'bg-blue-600', start: e.startTime || 0, length: (e.endTime || duration || 60) - (e.startTime || 0), isElement: true
                  }));
               } else if (track.type === 'text') {
                  clips = project.elements.filter(e => e.type === 'text' || e.type === 'subtitle').map(e => ({
                     id: e.id, name: `Text (${(e as any).text || e.type})`, color: 'bg-purple-600', start: e.startTime || 0, length: (e.endTime || duration || 60) - (e.startTime || 0), isElement: true
                  }));
               }

               return (
                 <div key={track.id} className="h-8 border-b border-white/5 relative flex items-center">
                    {clips.map((clip, i) => (
                       <div 
                         key={clip.id}
                         onClick={() => onSelectElement(clip.id)}
                         className={`absolute h-5 rounded text-[10px] border border-white/20 shadow-md flex items-center group
                           ${clip.color} 
                           ${selectedElementId === clip.id ? 'ring-2 ring-white z-10' : 'hover:brightness-110 opacity-80'}
                         `}
                         style={{
                           left: `${clip.start * 20 * zoom}px`,
                           width: `${clip.length * 20 * zoom}px`,
                           // Stack vertically if overlapping
                           top: clips.length > 1 ? `${(i % 2) * 4 + 2}px` : '6px'
                         }}
                       >
                         {clip.isElement && (
                           <div 
                             className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/40 z-20 flex items-center justify-center bg-black/20"
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               e.preventDefault();
                               setDraggingHandle({ id: clip.id, type: 'start', startX: e.clientX, initialStart: clip.start, initialEnd: clip.start + clip.length });
                             }}
                           >
                             <div className="w-1 h-3 bg-white/80 rounded-full pointer-events-none" />
                           </div>
                         )}
                         <div 
                           className={`flex-1 w-full h-full px-5 overflow-hidden flex items-center ${clip.isElement ? 'cursor-move' : 'cursor-pointer'}`}
                           onMouseDown={(e) => {
                             if (clip.isElement) {
                               e.stopPropagation();
                               e.preventDefault();
                               onSelectElement(clip.id);
                               setDraggingHandle({ id: clip.id, type: 'move', startX: e.clientX, initialStart: clip.start, initialEnd: clip.start + clip.length });
                             }
                           }}
                         >
                           <span className="text-[10px] font-bold text-white truncate pointer-events-none select-none">{clip.name}</span>
                         </div>
                         {clip.isElement && (
                           <div 
                             className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-white/40 z-20 flex items-center justify-center bg-black/20"
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               e.preventDefault();
                               setDraggingHandle({ id: clip.id, type: 'end', startX: e.clientX, initialStart: clip.start, initialEnd: clip.start + clip.length });
                             }}
                           >
                             <div className="w-1 h-3 bg-white/80 rounded-full pointer-events-none" />
                           </div>
                         )}
                       </div>
                    ))}
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
