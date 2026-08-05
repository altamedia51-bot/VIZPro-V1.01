import re

with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
if 'CheckCircle2' not in content:
    content = content.replace("Volume2, VolumeX, ChevronDown, FolderOpen, Undo2, Redo2, FileCode, Maximize2, Settings as SettingsIcon } from 'lucide-react';", 
                              "Volume2, VolumeX, ChevronDown, FolderOpen, Undo2, Redo2, FileCode, Maximize2, Settings as SettingsIcon, CheckCircle2, Cpu, Settings } from 'lucide-react';")

# 2. Add states for FPS and Meters
if 'const [fps, setFps] = useState(60);' not in content:
    content = content.replace("const [isRecording, setIsRecording] = useState(false);", """const [isRecording, setIsRecording] = useState(false);
  const [fps, setFps] = useState(60);
  const [meters, setMeters] = useState({ l: 0, r: 0 });
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (time: number) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }
      
      if (isPlaying) {
         const data = getAudioData();
         const l = (data[10] || 0) / 255;
         const r = (data[20] || 0) / 255;
         setMeters({ l, r });
      } else {
         setMeters({ l: 0, r: 0 });
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, getAudioData]);
""")

# 3. Add footer to the bottom of the component
old_end = """        </aside>
      </div>
    </div>
  );
};"""

new_end = """        </aside>
      </div>
      
      {/* Bottom Footer */}
      <footer className="h-8 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-[#888] text-[10px] font-medium font-mono">Tersimpan otomatis pada {new Date().toLocaleTimeString('id-ID', { hour12: false })}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[#666] text-[10px] font-bold">L</span>
              <div className="w-16 h-1.5 bg-[#1a1a1a] border border-[#333] rounded-full overflow-hidden flex items-center p-[1px]">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-75" style={{ width: `${meters.l * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#666] text-[10px] font-bold">R</span>
              <div className="w-16 h-1.5 bg-[#1a1a1a] border border-[#333] rounded-full overflow-hidden flex items-center p-[1px]">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-75" style={{ width: `${meters.r * 100}%` }} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 border-l border-[#222] pl-4">
            <div className="flex items-center gap-1.5">
              <Settings size={12} className="text-[#3b82f6]" />
              <span className="text-[#888] text-[10px] font-mono font-medium">{fps} FPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="text-[#a855f7]" />
              <span className="text-[#888] text-[10px] font-mono font-medium">RAM: {(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 4} MB</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};"""

content = content.replace(old_end, new_end)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)

print("Done")
