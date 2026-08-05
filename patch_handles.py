import re

with open('src/components/Timeline.tsx', 'r') as f:
    content = f.read()

target = """                         {clip.isElement && (
                           <div 
                             className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               e.preventDefault();
                               setDraggingHandle({ id: clip.id, type: 'start', startX: e.clientX, initialStart: clip.start, initialEnd: clip.start + clip.length });
                             }}
                           >
                             <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                           </div>
                         )}
                         <div 
                           className={`flex-1 w-full h-full px-3 overflow-hidden flex items-center ${clip.isElement ? 'cursor-move' : 'cursor-pointer'}`}
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
                             className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                             onMouseDown={(e) => {
                               e.stopPropagation();
                               e.preventDefault();
                               setDraggingHandle({ id: clip.id, type: 'end', startX: e.clientX, initialStart: clip.start, initialEnd: clip.start + clip.length });
                             }}
                           >
                             <div className="w-0.5 h-3 bg-white/70 rounded-full" />
                           </div>
                         )}"""

replace = """                         {clip.isElement && (
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
                         )}"""

content = content.replace(target, replace)
with open('src/components/Timeline.tsx', 'w') as f:
    f.write(content)
