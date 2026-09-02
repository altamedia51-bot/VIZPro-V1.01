import { PLATFORM_ICONS } from "../lib/icons";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Project, VizElement, BackgroundType, TextElement } from '../types';
import { CanvasRenderer, CanvasRendererRef } from './CanvasRenderer';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Timeline } from './Timeline';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { Recorder } from '../utils/recordStream';
import { Play, Pause, SkipBack, Square, Plus, Image as ImageIcon, Download, Trash2, Home, Music, Radio, Type, Sparkles, Layers, Search, Volume2, VolumeX, ChevronDown, FolderOpen, Undo2, Redo2, FileCode, Maximize2, Settings as SettingsIcon, CheckCircle2, Cpu, Settings, Database, Activity, Wind, Zap, Move, Camera } from 'lucide-react';
import { parseSRT } from '../utils/srtParser';
import { db } from '../lib/db';

interface EditorProps {
  project: Project;
  onExit: () => void;
}

type TabType = 'audio' | 'visualizer' | 'text' | 'background' | 'layers';
type FilterType = 'spectrum' | 'circular' | 'waves' | 'glow' | 'cyber' | 'particles' | 'shapes' | 'elements';

export const Editor: React.FC<EditorProps> = ({ project: initialProject, onExit }) => {
  const [historyState, setHistoryState] = useState<{ past: Project[], present: Project, future: Project[] }>({
    past: [],
    present: initialProject,
    future: []
  });
  
  const project = historyState.present;

  const setProject = useCallback((newProjectOrUpdater: React.SetStateAction<Project>) => {
    setHistoryState(state => {
        const nextProject = typeof newProjectOrUpdater === 'function' ? (newProjectOrUpdater as any)(state.present) : newProjectOrUpdater;
        
        if (JSON.stringify(state.present) === JSON.stringify(nextProject)) {
            return state;
        }
        
        return {
            past: [...state.past, state.present],
            present: nextProject,
            future: []
        };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistoryState(state => {
      if (state.past.length === 0) return state;
      const newPast = [...state.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [state.present, ...state.future]
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryState(state => {
      if (state.future.length === 0) return state;
      const newFuture = [...state.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: newFuture
      };
    });
  }, []);
  
  // Variables for UI rendering
  const historyIndex = historyState.past.length;
  const history = [...historyState.past, historyState.present, ...historyState.future];
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [fps, setFps] = useState(60);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [multiSelectIds, setMultiSelectIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('visualizer');
  const [openBgAccordion, setOpenBgAccordion] = useState<string>('type');
  const [openVizAccordion, setOpenVizAccordion] = useState<string>('spectrum');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('spectrum');
  const [subtitleTab, setSubtitleTab] = useState<'basic' | 'templates'>('templates');
  const [openTemplateAccordion, setOpenTemplateAccordion] = useState<string>('style_dasar');
  const [draggedSubtitleIndex, setDraggedSubtitleIndex] = useState<number | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const rendererRef = useRef<CanvasRendererRef>(null);

  const {
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    getAudioData,
    getWaveformData,
    audioContext,
    audioRef,
    sourceNode,
    volume,
    setVolume
  } = useAudioAnalyzer({ audioUrl });

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
         if (data && data.dataArray) {
           const l = (data.dataArray[10] || 0) / 255;
           const r = (data.dataArray[20] || 0) / 255;
           setMeters({ l, r });
         }
      } else {
         setMeters({ l: 0, r: 0 });
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, getAudioData]);

  // Auto-save
  useEffect(() => {
    db.saveProject(project);
  }, [project]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handleSrtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const subtitles = parseSRT(text);
      
      const hasSubtitleEl = project.elements.some(el => el.type === 'subtitle');
      const newElements = [...project.elements];
      let newSelectedId = selectedElementId;
      
      if (!hasSubtitleEl) {
        const subElId = crypto.randomUUID();
        newSelectedId = subElId;
        newElements.push({
          id: subElId,
          type: 'subtitle',
          x: project.resolution?.width ? project.resolution.width / 2 : 640,
          y: project.resolution?.height ? project.resolution.height - 100 : 620,
          scale: 1,
          rotation: 0,
          color: '#ffffff',
          opacity: 1,
          fontSize: 32,
          fontFamily: 'Inter',
        } as any); // Cast as any because SubtitleElement will be correctly inferred but TypeScript might complain about missing properties depending on BaseElement structure
      }
      
      setProject(prev => ({
        ...prev,
        subtitles,
        elements: newElements
      }));
      setSelectedElementId(newSelectedId);
      setActiveTab('text');
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      setProject({
        ...project,
        backgroundConfig: { type: isVideo ? 'video' : 'image', value: url }
      });
    }
  };

  const addElement = (type: VizElement['type']) => {
    const newEl: any = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 1280 / 2, // center of 720p canvas
      y: 720 / 2,
      scale: 1,
      rotation: 0,
      color: '#ffffff',
      opacity: 1,
    };

    if (type === 'bars') {
      newEl.width = 400;
      newEl.height = 200;
      newEl.barWidth = 10;
      newEl.barSpacing = 5;
    } else if (type === 'circle') {
      newEl.radius = 150;
      newEl.lineWidth = 4;
    } else if (type === 'text') {
      newEl.text = 'New Text';
      newEl.fontSize = 60;
      newEl.fontFamily = 'Arial';
    } else if (type === 'banner') {
      newEl.width = 600;
      newEl.height = 100;
      newEl.textLeft = 'Viz';
      newEl.textRight = 'Pro';
      newEl.fontFamily = 'Oswald';
      newEl.color = '#ffffff';
      newEl.color2 = '#fdf646';
      newEl.boxColor1 = '#171717';
      newEl.boxColor2 = '#247abf';
      newEl.strokeColor1 = '#2bc299';
      newEl.strokeColor2 = '#135185';
      newEl.slant = 25;
      newEl.boxOpacity1 = 1;
      newEl.boxOpacity2 = 1;
      newEl.textCase = 'uppercase';
    } else if (type === 'bracket_banner') {
      newEl.width = 600;
      newEl.height = 100;
      newEl.text = 'Bracket Banner';
      newEl.fontFamily = 'Oswald';
      newEl.color = '#ffffff';
      newEl.boxColor1 = '#df001c';
      newEl.boxColor2 = '#9a0914';
      newEl.strokeColor1 = '#ffffff';
      newEl.strokeColor2 = '#cccccc';
      newEl.boxOpacity = 1;
      newEl.textCase = 'uppercase';
    } else if (type as any === 'hanging_text') {
      newEl.type = 'text';
      newEl.text = 'VIZPRO';
      newEl.fontSize = 80;
      newEl.fontFamily = 'Arial';
      newEl.isHanging = true;
      newEl.y = 300; // Hang it a bit lower
    } else if (type === 'waveform') {
      newEl.width = 800;
      newEl.height = 200;
      newEl.lineWidth = 3;
    } else if (type === 'particles') {
      newEl.count = 100;
      newEl.speed = 1;
    } else if (type === 'orbs') {
      newEl.count = 5;
      newEl.radius = 50;
    } else if (type === 'neon_grid') {
      newEl.width = 1280;
      newEl.height = 720;
      newEl.perspective = 1.5;
    } else if (type === 'double_circle') {
      newEl.radius = 150;
      newEl.lineWidth = 4;
    } else if (type === 'smooth_curve') {
      newEl.width = 800;
      newEl.height = 200;
      newEl.lineWidth = 3;
    } else if (type === 'circular_spectrum') {
      newEl.radius = 150;
      newEl.height = 50;
    } else if (type === 'radial_dots') {
      newEl.radius = 150;
      newEl.count = 60;
      newEl.layers = 5;
      newEl.dotSize = 5;
    } else if (type === 'glowing_blocks') {
      newEl.columns = 8;
      newEl.rows = 6;
      newEl.blockWidth = 20;
      newEl.blockHeight = 40;
      newEl.spacing = 10;
      newEl.glowIntensity = 20;
      newEl.color = '#ff0000';
    } else if (type === 'perspective_ring') {
      newEl.radius = 200;
      newEl.perspective = 0.3;
      newEl.thickness = 15;
      newEl.segments = 60;
    } else if (type === 'progress_bar') {
      newEl.width = 600;
      newEl.height = 4;
      newEl.showTime = true;
      newEl.fontSize = 24;
      newEl.fontFamily = 'Inter';
    } else if (type === 'progress_visualizer') {
      newEl.width = 640;
      newEl.height = 4;
      newEl.barHeight = 40;
      newEl.barWidth = 4;
      newEl.barSpacing = 3;
      newEl.waveformStyle = 'bars';
      newEl.showTime = true;
      newEl.showKnob = true;
      newEl.knobSize = 7;
      newEl.fontSize = 16;
      newEl.fontFamily = 'Inter';
      newEl.color = '#3b82f6';
      newEl.color2 = '#8b5cf6';
      newEl.useGradient = true;
      newEl.glowIntensity = 15;
      newEl.waveformOffset = 10;
    } else if (type === 'water_splash') {
      newEl.particleCount = 150;
      newEl.splashRadius = 250;
      newEl.dropSize = 5;
      newEl.speed = 1;
      newEl.color = '#00ffff';
    } else if (type === 'symmetrical_mirror') {
      newEl.width = 800;
      newEl.height = 200;
      newEl.barWidth = 5;
      newEl.barSpacing = 2;
    } else if (type === 'bass_pulse') {
      newEl.radius = 100;
    } else if (type === 'multi_sine' || type === 'single_sine') {
      newEl.width = 800;
      newEl.height = 200;
      newEl.lines = 3;
    } else if (type === 'spiral_galaxy') {
      newEl.count = 200;
      newEl.radius = 300;
    } else if (type === 'flames') {
      newEl.width = 800;
      newEl.height = 300;
    } else if (type === 'rain') {
      newEl.count = 300;
      newEl.speed = 1.5;
    } else if (type === 'triangle_spectrum' || type === 'diamond_spectrum' || type === 'glowing_ring') {
      newEl.radius = 150;
      newEl.lineWidth = 4;
    } else if (type === 'mirrored_bars') {
      newEl.width = 800;
      newEl.height = 200;
      newEl.barWidth = 6;
      newEl.barSpacing = 4;
    }

    setProject({
      ...project,
      elements: [...project.elements, newEl]
    });
    setSelectedElementId(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<VizElement>) => {
    setProject(prev => {
      const element = prev.elements.find(el => el.id === id);
      if (element && element.groupId && (updates.x !== undefined || updates.y !== undefined)) {
        const dx = (updates.x ?? element.x) - element.x;
        const dy = (updates.y ?? element.y) - element.y;
        
        return {
          ...prev,
          elements: prev.elements.map(el => {
            if (el.id === id) {
              return { ...el, ...updates } as any;
            }
            if (el.groupId === element.groupId) {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
              } as any;
            }
            return el;
          })
        };
      }
      return {
        ...prev,
        elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } as any : el)
      };
    });
  };

  const removeElement = (id: string) => {
    setProject(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const takeSnapshot = () => {
    const canvas = rendererRef.current?.getCanvas();
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const timestamp = formatTime(currentTime).replace(/:/g, '-');
      a.download = `${project.name.replace(/\s+/g, '_')}_snapshot_${timestamp}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      const blob = await recorderRef.current.stop();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_export.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      const canvas = rendererRef.current?.getCanvas();
      if (canvas && audioContext && sourceNode) {
        // Need to create a destination node for recording
        const dest = audioContext.createMediaStreamDestination();
        
        // Connect the existing source to destination (for recording)
        sourceNode.connect(dest);
        
        recorderRef.current = new Recorder(canvas, audioContext, dest);
        recorderRef.current.start();
        setIsRecording(true);
        setSelectedElementId(null);
        if (!isPlaying) togglePlay(); // Start playing automatically
      }
    }
  };

  useEffect(() => {
    // Auto-stop recording when audio finishes
    if (isRecording && !isPlaying && duration > 0 && currentTime >= duration - 0.5) {
      stopRecording();
    }
  }, [isRecording, isPlaying, duration, currentTime]);

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    const cs = Math.floor((time % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`;
  };

  const toggleFullScreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resolutions = [
    { label: '720p HD (16:9)', width: 1280, height: 720 },
    { label: '1080p Full HD (16:9)', width: 1920, height: 1080 },
    { label: '2160p 4K (16:9)', width: 3840, height: 2160 },
    { label: 'Square (1:1 Instagram)', width: 1080, height: 1080 },
    { label: 'Portrait (9:16 Reels)', width: 1080, height: 1920 }
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0C] text-gray-200 font-sans overflow-hidden">
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 h-[50px] bg-[#111111] border-b border-[#222]">
        
        {/* Left Side */}
        <div className="flex items-center gap-3">
          
          <button onClick={onExit} className="flex items-center gap-2 mr-2 group" title="Exit to Project Manager">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-black text-sm group-hover:bg-blue-500 transition-colors">
              V
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-[13px] tracking-wide">VIZ PRO</span>
              <span className="bg-[#222] text-[#6b9cf2] text-[9px] font-bold px-1.5 py-0.5 rounded">V1.01</span>
            </div>
          </button>
          
          <div className="w-px h-5 bg-[#333] mx-1"></div>

          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#333] bg-[#1a1a1a] hover:bg-[#222] transition-colors text-white text-xs font-medium max-w-[200px] truncate">
            <FolderOpen size={14} className="text-[#6b9cf2]" />
            <span className="truncate">{project.name || "Untitled Visualizer Pro"}</span>
          </button>

          <button onClick={() => document.getElementById('hidden-audio-upload')?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#333] bg-[#1a1a1a] hover:bg-[#222] transition-colors text-white text-[11px] font-bold tracking-wide">
            <Music size={14} className="text-[#6b9cf2]" />
            IMPORT AUDIO
          </button>
          <input type="file" id="hidden-audio-upload" accept="audio/*,video/*" className="hidden" onChange={handleAudioUpload} />

          <button className="w-8 h-[28px] rounded-md border border-[#333] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center text-gray-400 transition-colors">
            <FileCode size={14} />
          </button>
          <button onClick={toggleFullScreen} className="w-8 h-[28px] rounded-md border border-[#333] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center text-gray-400 transition-colors">
            <Maximize2 size={14} />
          </button>

        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-1">
            <button onClick={handleUndo} disabled={historyIndex === 0} className={`w-8 h-8 flex items-center justify-center transition-colors ${historyIndex > 0 ? 'text-gray-300 hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}>
              <Undo2 size={16} />
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`w-8 h-8 flex items-center justify-center transition-colors ${historyIndex < history.length - 1 ? 'text-gray-300 hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}>
              <Redo2 size={16} />
            </button>
          </div>

          <div className="w-px h-5 bg-[#333] mx-1"></div>

          <div className="flex items-center gap-2 text-[11px] font-medium border border-[#333] bg-[#1a1a1a] rounded-md px-2 py-1 transition-colors relative">
            <span className="text-[#6b9cf2] uppercase font-bold tracking-wider mr-1">RESOLUTION</span>
            <div className="relative flex items-center">
              <select 
                className="bg-transparent text-white outline-none cursor-pointer appearance-none pr-5 font-bold"
                value={`${project.resolution?.width || 1280}x${project.resolution?.height || 720}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number);
                  setProject(prev => ({ ...prev, resolution: { width: w, height: h } }));
                }}
                disabled={isRecording}
              >
                {resolutions.map(r => (
                  <option key={`${r.width}x${r.height}`} value={`${r.width}x${r.height}`} className="bg-[#1a1a1a] text-white">
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="text-gray-400 pointer-events-none absolute right-0" />
            </div>
          </div>



          <button 
            onClick={takeSnapshot}
            title="Ambil Snapshot/Screenshot Canvas (PNG)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide border border-[#333] bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 hover:text-white transition-colors"
          >
            <Camera size={14} className="text-cyan-400" />
            <span>SNAPSHOT</span>
          </button>

          <button 
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-colors ${
              isRecording 
                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isRecording ? <Square size={14} /> : <Download size={14} />}
            {isRecording ? 'STOP' : 'EXPORT'}
          </button>

        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Controls */}
        <aside className="w-80 flex flex-col bg-[#111111] border-r border-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex w-full border-b border-white/5">
            <button 
              onClick={() => setActiveTab('audio')} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-[10px] font-bold tracking-wider transition-colors border-b-2 ${activeTab === 'audio' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <Music size={18} className={activeTab === 'audio' ? 'text-white' : 'text-gray-500'} /> AUDIO
            </button>
            <button 
              onClick={() => setActiveTab('visualizer')} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-[10px] font-bold tracking-wider transition-colors border-b-2 ${activeTab === 'visualizer' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <Radio size={18} className={activeTab === 'visualizer' ? 'text-white' : 'text-gray-500'} /> VISUALIZER
            </button>
            <button 
              onClick={() => setActiveTab('text')} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-[10px] font-bold tracking-wider transition-colors border-b-2 ${activeTab === 'text' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <Type size={18} className={activeTab === 'text' ? 'text-white' : 'text-gray-500'} /> TEXT
            </button>
            <button 
              onClick={() => setActiveTab('background')} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-[10px] font-bold tracking-wider transition-colors border-b-2 ${activeTab === 'background' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <ImageIcon size={18} className={activeTab === 'background' ? 'text-white' : 'text-gray-500'} /> BACKGROUND
            </button>
            <button 
              onClick={() => setActiveTab('layers')} 
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-[10px] font-bold tracking-wider transition-colors border-b-2 ${activeTab === 'layers' ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              <Layers size={18} className={activeTab === 'layers' ? 'text-white' : 'text-gray-500'} /> LAYERS
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {activeTab === 'audio' && (
              <div className="p-6 space-y-4">
                <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Audio Settings</h2>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                  <div>
                    <label className="block text-xs mb-1 text-gray-400">Audio Track</label>
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} className="block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer" />
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs text-gray-400">Subtitle File (.srt)</label>
                      {project.subtitles && project.subtitles.length > 0 && (
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{project.subtitles.length} lines</span>
                      )}
                    </div>
                    <input type="file" accept=".srt" onChange={handleSrtUpload} className="block w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="flex flex-col h-full overflow-hidden p-4">
                <input type="file" id="hidden-bg-image-upload" accept="image/*" className="hidden" onChange={handleBgUpload} />
                <input type="file" id="hidden-bg-video-upload" accept="video/*" className="hidden" onChange={handleBgUpload} />
                <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                  {/* Preset Background Unggulan */}
                  <div>
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-3">
                      <Sparkles size={12} className="text-amber-400" /> PRESET LATAR BELAKANG
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setProject({
                            ...project,
                            backgroundConfig: {
                              ...project.backgroundConfig,
                              type: 'image',
                              value: '/neon_wave_terrain.jpg'
                            }
                          });
                        }}
                        className={`w-full group relative overflow-hidden rounded-xl border p-2.5 flex items-center gap-3 transition-all ${
                          project.backgroundConfig.type === 'image' && project.backgroundConfig.value === '/neon_wave_terrain.jpg'
                            ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-[#1A1A1A] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black">
                          <img src="/neon_wave_terrain.jpg" alt="Neon Particle Soundwave" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">Neon Particle Terrain</span>
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-medium">Clean HD</span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">Gelombang partikel neon sinematik (tanpa teks)</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Tipe Background */}
                  <div className="pt-4 border-t border-white/5">
                    <button onClick={() => setOpenBgAccordion(openBgAccordion === 'type' ? '' : 'type')} className="w-full flex items-center justify-between group outline-none">
                      <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                        <Settings size={12} /> TIPE BACKGROUND
                      </h3>
                      <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openBgAccordion === 'type' ? 'rotate-180' : ''}`} />
                    </button>
                    {openBgAccordion === 'type' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'cyber_grid', name: 'Cyber Grid' },
                        { type: 'particle_starfield', name: 'Particle Starfield' },
                        { type: 'animated_gradient', name: 'Animated Gradient' },
                        { type: 'minimal_grid', name: 'Minimal Grid' },
                        { type: 'solid_color', name: 'Solid Color' },
                        { type: 'linear_gradient', name: 'Linear Gradient' },
                        { type: 'image', name: 'Image Background' },
                        { type: 'video', name: 'Video Background' },
                      ].map(bg => (
                        <button
                          key={bg.type}
                          onClick={() => {
                            if (bg.type === 'image') {
                              document.getElementById('hidden-bg-image-upload')?.click();
                            } else if (bg.type === 'video') {
                              document.getElementById('hidden-bg-video-upload')?.click();
                            } else {
                              setProject({
                                ...project,
                                backgroundConfig: { ...project.backgroundConfig, type: bg.type as BackgroundType }
                              });
                            }
                          }}
                          className={`p-3 border rounded-lg text-left transition-colors flex flex-col justify-center ${
                            project.backgroundConfig.type === bg.type
                              ? 'bg-[#1A1A1A] border-blue-500/50 text-white'
                              : 'bg-[#1A1A1A] border-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-bold">{bg.name}</span>
                        </button>
                      ))}
                    </div>
                    )}
                  </div>

                  {/* Filter & Efek Background */}
                  <div className="pt-4 border-t border-white/5">
                    <button onClick={() => setOpenBgAccordion(openBgAccordion === 'filter' ? '' : 'filter')} className="w-full flex items-center justify-between group outline-none">
                      <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                        <Settings size={12} /> FILTER & EFEK BACKGROUND
                      </h3>
                      <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openBgAccordion === 'filter' ? 'rotate-180' : ''}`} />
                    </button>
                    {openBgAccordion === 'filter' && (
                    <div className="space-y-4">
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Blur Background</span>
                          <span className="text-[10px] text-white">{project.backgroundConfig.blur || 0}px</span>
                        </div>
                        <input type="range" min="0" max="100" value={project.backgroundConfig.blur || 0} onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, blur: Number(e.target.value) } })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Kecerahan (Brightness)</span>
                          <span className="text-[10px] text-white">{project.backgroundConfig.brightness ?? 100}%</span>
                        </div>
                        <input type="range" min="0" max="200" value={project.backgroundConfig.brightness ?? 100} onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, brightness: Number(e.target.value) } })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Kontras (Contrast)</span>
                          <span className="text-[10px] text-white">{project.backgroundConfig.contrast ?? 100}%</span>
                        </div>
                        <input type="range" min="0" max="200" value={project.backgroundConfig.contrast ?? 100} onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, contrast: Number(e.target.value) } })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Vignette Border</span>
                          <span className="text-[10px] text-white">{project.backgroundConfig.vignette || 0}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={project.backgroundConfig.vignette || 0} onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, vignette: Number(e.target.value) } })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                      </label>
                      
                      <div className="pt-2 pb-1 border-t border-white/10 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox" 
                            id="focusEnabled"
                            checked={project.backgroundConfig.focusEnabled || false} 
                            onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, focusEnabled: e.target.checked } })}
                            className="rounded bg-black/50 border-white/10 text-blue-500"
                          />
                          <label htmlFor="focusEnabled" className="text-[10px] text-gray-400 cursor-pointer uppercase tracking-widest font-bold">Aktifkan Area Fokus</label>
                        </div>
                        {project.backgroundConfig.focusEnabled && (
                          <>
                            <label className="block mt-2">
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-gray-400">Ukuran Area Fokus</span>
                                <span className="text-[10px] text-white">{project.backgroundConfig.focusSize ?? 50}%</span>
                              </div>
                              <input type="range" min="10" max="100" value={project.backgroundConfig.focusSize ?? 50} onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, focusSize: Number(e.target.value) } })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                            </label>
                            <label className="block mt-2">
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-gray-400">Blur Luar Fokus</span>
                                <span className="text-[10px] text-white">{project.backgroundConfig.focusBlur ?? 10}px</span>
                              </div>
                              <input type="range" min="0" max="100" value={project.backgroundConfig.focusBlur ?? 10} onChange={e => setProject({ ...project, backgroundConfig: { ...project.backgroundConfig, focusBlur: Number(e.target.value) } })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Motion Presets Library (Animasi Latar Belakang) */}
                  <div className="pt-4 border-t border-white/5">
                    <button onClick={() => setOpenBgAccordion(openBgAccordion === 'motion' ? '' : 'motion')} className="w-full flex items-center justify-between group outline-none">
                      <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                        <Activity size={12} className="text-cyan-400" /> MOTION PRESETS
                      </h3>
                      <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openBgAccordion === 'motion' ? 'rotate-180' : ''}`} />
                    </button>
                    {openBgAccordion === 'motion' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'none', name: 'Statis (Diam)', desc: 'Tanpa animasi latar' },
                          { id: 'pulse', name: 'Bass Pulse', desc: 'Denyut hentakan bass' },
                          { id: 'drift', name: 'Parallax Drift', desc: 'Ken Burns pan sinematik' },
                          { id: 'slide', name: 'Slide & Pan', desc: 'Geser osilasi ritmis' },
                          { id: 'fade', name: 'Breathing Fade', desc: 'Pendaran cahaya lembut' },
                          { id: 'zoom_burst', name: 'Zoom Burst', desc: 'Hentakan zoom audio drop' },
                          { id: 'shake', name: 'Camera Shake', desc: 'Guncangan sub-bass dinamis' },
                        ].map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setProject({
                                ...project,
                                backgroundConfig: {
                                  ...project.backgroundConfig,
                                  motionPreset: preset.id as any
                                }
                              });
                            }}
                            className={`p-2.5 border rounded-xl text-left transition-all flex flex-col justify-between min-h-[58px] ${
                              (project.backgroundConfig.motionPreset || 'none') === preset.id
                                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                                : 'bg-[#1A1A1A] border-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-xs font-bold text-white">{preset.name}</span>
                            <span className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{preset.desc}</span>
                          </button>
                        ))}
                      </div>

                      {project.backgroundConfig.motionPreset && project.backgroundConfig.motionPreset !== 'none' && (
                        <div className="space-y-3 pt-3 border-t border-white/5">
                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-400">Intensitas Efek Gerakan</span>
                              <span className="text-[10px] text-cyan-400 font-bold">{project.backgroundConfig.motionIntensity ?? 50}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="100" 
                              value={project.backgroundConfig.motionIntensity ?? 50} 
                              onChange={e => setProject({
                                ...project,
                                backgroundConfig: {
                                  ...project.backgroundConfig,
                                  motionIntensity: Number(e.target.value)
                                }
                              })} 
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400" 
                            />
                          </label>
                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-400">Kecepatan Gerakan (Speed)</span>
                              <span className="text-[10px] text-cyan-400 font-bold">{(project.backgroundConfig.motionSpeed ?? 1.0).toFixed(1)}x</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.2" 
                              max="3.0" 
                              step="0.1"
                              value={project.backgroundConfig.motionSpeed ?? 1.0} 
                              onChange={e => setProject({
                                ...project,
                                backgroundConfig: {
                                  ...project.backgroundConfig,
                                  motionSpeed: Number(e.target.value)
                                }
                              })} 
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400" 
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    )}
                  </div>

                  {/* POST-PROCESSING SPECIAL EFFECTS */}
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <button onClick={() => setOpenBgAccordion(openBgAccordion === 'post' ? '' : 'post')} className="w-full flex items-center justify-between group outline-none">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 group-hover:text-gray-300 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        POST-PROCESSING SPECIAL EFFECTS
                      </h3>
                      <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openBgAccordion === 'post' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openBgAccordion === 'post' && (
                    <div className="space-y-4">
                      {/* Bloom Glow Effect */}
                      <label className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5">
                        <span className="text-sm font-bold text-white">Bloom Glow Effect</span>
                        <input type="checkbox" checked={project.postProcessing?.bloom || false} onChange={e => setProject({ ...project, postProcessing: { ...project.postProcessing, bloom: e.target.checked } as any })} className="w-5 h-5 rounded accent-blue-500" />
                      </label>

                      {/* Chromatic Aberration */}
                      <label className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5">
                        <span className="text-sm font-bold text-white">Chromatic Aberration (RGB Shift)</span>
                        <input type="checkbox" checked={project.postProcessing?.chromaticAberration || false} onChange={e => setProject({ ...project, postProcessing: { ...project.postProcessing, chromaticAberration: e.target.checked } as any })} className="w-5 h-5 rounded accent-blue-500" />
                      </label>

                      {/* Film Grain Texture */}
                      <label className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5">
                        <span className="text-sm font-bold text-white">Film Grain Texture</span>
                        <input type="checkbox" checked={project.postProcessing?.filmGrain || false} onChange={e => setProject({ ...project, postProcessing: { ...project.postProcessing, filmGrain: e.target.checked } as any })} className="w-5 h-5 rounded accent-blue-500" />
                      </label>

                      {/* Lens Flare Anamorphic */}
                      <label className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-white/5 rounded-xl cursor-pointer hover:bg-white/5">
                        <span className="text-sm font-bold text-white">Lens Flare Anamorphic</span>
                        <input type="checkbox" checked={project.postProcessing?.lensFlare || false} onChange={e => setProject({ ...project, postProcessing: { ...project.postProcessing, lensFlare: e.target.checked } as any })} className="w-5 h-5 rounded accent-blue-500" />
                      </label>

                      {/* LUT Color Grading */}
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">LUT COLOR GRADING PRESET</label>
                        <select 
                          value={project.postProcessing?.lut || 'none'} 
                          onChange={e => setProject({ ...project, postProcessing: { ...project.postProcessing, lut: e.target.value } as any })} 
                          className="w-full bg-[#1A1A1A] border border-blue-500/50 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                          <option value="none">None</option>
                          <option value="cyberpunk">Cyberpunk Neon</option>
                          <option value="cinematic">Cinematic Teal & Orange</option>
                          <option value="vintage">Vintage Film</option>
                          <option value="bw">Black & White Noir</option>
                          <option value="warm">Warm Sunshine</option>
                          <option value="cool">Cool Matrix</option>
                        </select>
                      </div>
                    </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="flex flex-col h-full overflow-hidden p-4">
                <div className="flex gap-2 mb-4">
                  <button onClick={() => addElement('text')} className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors text-white font-bold text-sm">
                    + TEKS BARU
                  </button>
                  
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {selectedElementId && (project.elements.find(e => e.id === selectedElementId)?.type === 'text' || project.elements.find(e => e.id === selectedElementId)?.type === 'subtitle' || project.elements.find(e => e.id === selectedElementId)?.type === 'banner' || project.elements.find(e => e.id === selectedElementId)?.type === 'bracket_banner' || project.elements.find(e => e.id === selectedElementId)?.type === 'sticker_text') ? (
                    (() => {
                      const el = project.elements.find(e => e.id === selectedElementId) as any;
                      const isSubtitle = el.type === 'subtitle';
                      const isBanner = el.type === 'banner';
                      const isBracketBanner = el.type === 'bracket_banner';
                      const isText = el.type === 'text' || el.type === 'bracket_banner' || el.type === 'sticker_text';
                      return (
                        <div className="space-y-4">
                          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                            <Type size={12} /> {isSubtitle ? "EDIT SUBTITLE LAYER" : isBanner ? "EDIT BANNER LAYER" : isBracketBanner ? "EDIT BRACKET BANNER" : "EDIT LAYER TEKS (TEXT LAYER)"}
                          </h3>
                          
                          {isText && (
    <div>
      <label className="block text-[10px] text-gray-400 mb-1">Isi Teks</label>
      <input type="text" value={el.text || ''} onChange={e => updateElement(el.id, { text: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500/50" />
    </div>
  )}
  {isBanner && !isBracketBanner && (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] text-gray-400 mb-1">Teks Kiri</label>
        <input type="text" value={el.textLeft || ''} onChange={e => updateElement(el.id, { textLeft: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500/50" />
      </div>
      <div>
        <label className="block text-[10px] text-gray-400 mb-1">Teks Kanan</label>
        <input type="text" value={el.textRight || ''} onChange={e => updateElement(el.id, { textRight: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500/50" />
      </div>
    </div>
  )}
  {isSubtitle && (
    <div className="space-y-2 mt-4 flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Editor Subtitle</label>
        <button onClick={() => {
          setProject(prev => ({
            ...prev,
            subtitles: [...(prev.subtitles || []), { id: crypto.randomUUID(), start: prev.subtitles?.length ? Math.round(prev.subtitles[prev.subtitles.length - 1].end * 100)/100 : 0, end: prev.subtitles?.length ? Math.round((prev.subtitles[prev.subtitles.length - 1].end + 2) * 100)/100 : 2, text: 'New Subtitle' }]
          }))
        }} className="text-[10px] text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1">+ TAMBAH</button>
      </div>
      <div className="space-y-2 pb-4">
      {project.subtitles?.map((sub, index) => (
        <div 
          key={sub.id} 
          draggable
          onDragStart={(e) => setDraggedSubtitleIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedSubtitleIndex === null || draggedSubtitleIndex === index) return;
            const newSubs = [...(project.subtitles || [])];
            const draggedSub = newSubs[draggedSubtitleIndex];
            newSubs.splice(draggedSubtitleIndex, 1);
            newSubs.splice(index, 0, draggedSub);
            setProject(prev => ({ ...prev, subtitles: newSubs }));
            setDraggedSubtitleIndex(null);
          }}
          className={`bg-[#1A1A1A]/80 border ${draggedSubtitleIndex === index ? 'border-blue-500 opacity-50' : 'border-white/5'} rounded-lg p-3 flex flex-col gap-2 cursor-move hover:border-white/20 transition-colors`}
        >
          <div className="flex justify-center -mt-1 mb-1 cursor-move text-white/20 hover:text-white/40">
            <div className="w-8 h-1 rounded-full bg-current"></div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Mulai (detik)</span>
              <input 
                type="number" 
                step="0.01" 
                value={Math.round(sub.start * 100) / 100} 
                onChange={e => {
                  const newSubs = [...(project.subtitles || [])];
                  newSubs[index] = { ...newSubs[index], start: Number(e.target.value) };
                  setProject(prev => ({ ...prev, subtitles: newSubs }));
                }}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" 
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Akhir (detik)</span>
              <input 
                type="number" 
                step="0.01" 
                value={Math.round(sub.end * 100) / 100} 
                onChange={e => {
                  const newSubs = [...(project.subtitles || [])];
                  newSubs[index] = { ...newSubs[index], end: Number(e.target.value) };
                  setProject(prev => ({ ...prev, subtitles: newSubs }));
                }}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" 
              />
            </div>
            <button 
              onClick={() => {
                const newSubs = (project.subtitles || []).filter((_, i) => i !== index);
                setProject(prev => ({ ...prev, subtitles: newSubs }));
              }}
              className="text-gray-500 hover:text-red-400 p-1.5 mt-4 transition-colors"
              title="Hapus Subtitle"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-1">
            <textarea
              value={sub.text}
              onChange={e => {
                const newSubs = [...(project.subtitles || [])];
                newSubs[index] = { ...newSubs[index], text: e.target.value };
                setProject(prev => ({ ...prev, subtitles: newSubs }));
              }}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 min-h-[60px] resize-y"
              placeholder="Teks subtitle..."
            />
          </div>
        </div>
      ))}
      {(!project.subtitles || project.subtitles.length === 0) && (
        <div className="text-center py-8 bg-black/20 rounded-lg border border-white/5 text-gray-500 text-xs">
          Belum ada subtitle.<br/>Upload file SRT atau tambah manual.
        </div>
      )}
      </div>
    </div>
  )}

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] text-gray-400">Font Family (Google Fonts)</label>
                              <button className="text-[10px] text-blue-500 font-bold uppercase hover:text-blue-400 flex items-center gap-1">
                                UPLOAD FONT
                              </button>
                            </div>
                            <select value={el.fontFamily} onChange={e => updateElement(el.id, { fontFamily: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                              <optgroup label="Latin Fonts">
                                <option value="Montserrat">Montserrat</option>
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Lato">Lato</option>
                                <option value="Oswald">Oswald</option>
                                <option value="Playfair Display">Playfair Display</option>
                                <option value="Nunito">Nunito</option>
                                <option value="Raleway">Raleway</option>
                                <option value="Ubuntu">Ubuntu</option>
                                <option value="Merriweather">Merriweather</option>
                                <option value="PT Sans">PT Sans</option>
                                <option value="Noto Sans">Noto Sans</option>
                                <option value="Quicksand">Quicksand</option>
                                <option value="Rubik">Rubik</option>
                                <option value="Work Sans">Work Sans</option>
                                <option value="Fira Sans">Fira Sans</option>
                                <option value="Caveat">Caveat (Handwriting)</option>\n                                <option value="Kalam">Kalam (Handwriting)</option>\n                                <option value="Dancing Script">Dancing Script</option>
                                <option value="Pacifico">Pacifico</option>
                                <option value="Arial">Arial</option>
                                <option value="Courier New">Courier New</option>
                              </optgroup>
                              <optgroup label="Arabic Fonts">
                                <option value="Cairo">Cairo</option>
                                <option value="Tajawal">Tajawal</option>
                                <option value="Amiri">Amiri</option>
                                <option value="Almarai">Almarai</option>
                                <option value="Scheherazade New">Scheherazade New</option>
                                <option value="Lateef">Lateef</option>
                                <option value="Changa">Changa</option>
                                <option value="Reem Kufi">Reem Kufi</option>
                                <option value="Lalezar">Lalezar</option>
                                <option value="Noto Kufi Arabic">Noto Kufi Arabic</option>
                                <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
                                <option value="El Messiri">El Messiri</option>
                                <option value="Lemonada">Lemonada</option>
                                <option value="Markazi Text">Markazi Text</option>
                                <option value="Aref Ruqaa">Aref Ruqaa</option>
                                <option value="Mada">Mada</option>
                                <option value="Harmattan">Harmattan</option>
                                <option value="Katibeh">Katibeh</option>
                                <option value="Rakkas">Rakkas</option>
                              </optgroup>
                            </select>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[10px] text-gray-400">Ukuran Font ({el.fontSize}px)</span>
                                </div>
                                <input type="range" min="12" max="200" value={el.fontSize || 16} onChange={e => updateElement(el.id, { fontSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                              </label>
                            </div>
                            <div className="flex-1">
                              <label className="block">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[10px] text-gray-400">Letter Spacing ({el.letterSpacing || 0}px)</span>
                                </div>
                                <input type="range" min="-10" max="50" value={el.letterSpacing || 0} onChange={e => updateElement(el.id, { letterSpacing: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-400 mb-2">Warna & Gradient Teks</label>
                            <div className="flex items-center gap-3">
                              <input type="color" value={el.color || '#ffffff'} onChange={e => updateElement(el.id, { color: e.target.value })} className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent" />
                              {el.useGradient && (
                                <input type="color" value={el.color2 || '#00ffff'} onChange={e => updateElement(el.id, { color2: e.target.value })} className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent" />
                              )}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={el.useGradient || false} onChange={e => updateElement(el.id, { useGradient: e.target.checked })} className="rounded bg-[#1A1A1A] border-white/10 text-blue-500 focus:ring-blue-500" />
                                <span className="text-xs text-gray-300">Gunakan Gradient Teks</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-gray-400 mb-1">Animasi Teks</label>
                            <select value={el.animation || 'none'} onChange={e => updateElement(el.id, { animation: e.target.value as any })} className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none">
                              <option value="none">Tidak Ada</option>
                              <option value="glow_pulse">Glow Pulse</option>
                              <option value="bounce">Bounce</option>
                              <option value="wave">Wave</option>
                              <option value="drop_bounce">Hanging / Drop Bounce</option>
                              
                            </select>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-gray-500 text-xs py-8">
                      Pilih layer teks dari daftar layers atau tambah baru.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'layers' && (
              <div className="p-6">
                <div className="mb-6">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    id="image-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        const img = new Image();
                        img.onload = () => {
                          const isAutoText = (document.getElementById('auto-text-checkbox') as HTMLInputElement)?.checked ?? true;
                          const imageId = crypto.randomUUID();
                          const groupId = isAutoText ? crypto.randomUUID() : undefined;
                          
                          // Default max dimension to 200px
                          let targetWidth = img.width;
                          let targetHeight = img.height;
                          const MAX_SIZE = 200;
                          
                          if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
                            if (targetWidth > targetHeight) {
                                targetHeight = targetHeight * (MAX_SIZE / targetWidth);
                                targetWidth = MAX_SIZE;
                            } else {
                                targetWidth = targetWidth * (MAX_SIZE / targetHeight);
                                targetHeight = MAX_SIZE;
                            }
                          }
                          
                          const newElImage: any = {
                            id: imageId,
                            type: 'image',
                            src: url,
                            x: isAutoText ? 640 - 80 : 640,
                            y: 360,
                            scale: 1,
                            rotation: 0,
                            opacity: 1,
                            width: targetWidth,
                            height: targetHeight,
                            groupId
                          };
                          const newElements = [newElImage];
                          if (isAutoText) {
                            const textId = crypto.randomUUID();
                            const newElText: any = {
                              id: textId,
                              type: 'text',
                              text: 'Custom Logo',
                              x: 640 + 80,
                              y: 360,
                              scale: 1,
                              rotation: 0,
                              color: '#ffffff',
                              opacity: 1,
                              fontSize: 48,
                              fontFamily: 'Inter',
                              groupId
                            };
                            newElements.push(newElText);
                          }
                          setProject(p => ({ ...p, elements: [...p.elements, ...newElements] }));
                          setSelectedElementId(newElImage.id);
                        };
                        img.src = url;
                      }
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="w-full py-3 bg-[#1A1A1A] border border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500 text-blue-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ImageIcon size={16} /> UPLOAD GAMBAR / LOGO STATIS
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Tambah Icon / Sticker</h2>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" id="auto-text-checkbox" defaultChecked className="w-3 h-3 rounded bg-[#1A1A1A] border-white/10 text-blue-500 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-gray-300 transition-colors">Teks Otomatis</span>
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-8">
                  {PLATFORM_ICONS.map(icon => (
                    <button
                      key={icon.name}
                      onClick={() => {
                        const isAutoText = (document.getElementById('auto-text-checkbox') as HTMLInputElement)?.checked ?? true;
                        
                        const imageId = crypto.randomUUID();
                        const groupId = isAutoText ? crypto.randomUUID() : undefined;
                        const newElImage: any = {
                          id: imageId,
                          type: 'image',
                          src: icon.src,
                          x: isAutoText ? 640 - 80 : 640,
                          y: 360,
                          scale: 1,
                          rotation: 0,
                          opacity: 1,
                          width: 48,
                          height: 48,
                          groupId
                        };

                        const newElements = [newElImage];

                        if (isAutoText) {
                          const textId = crypto.randomUUID();
                          const newElText: any = {
                            id: textId,
                            type: 'text',
                            text: icon.name,
                            x: 640 + 40,
                            y: 360,
                            scale: 1,
                            rotation: 0,
                            color: '#ffffff',
                            opacity: 1,
                            fontSize: 48,
                            fontFamily: 'Inter',
                            groupId
                          };
                          newElements.push(newElText);
                        }

                        setProject(p => ({ ...p, elements: [...p.elements, ...newElements] }));
                        setSelectedElementId(newElImage.id);
                      }}
                      className="p-2 bg-[#1A1A1A] border border-white/5 rounded hover:bg-white/10 flex flex-col items-center gap-1 transition-colors"
                      title={icon.name}
                    >
                      <img src={icon.src} alt={icon.name} className="w-6 h-6 object-contain" />
                      <span className="text-[8px] text-gray-400 text-center">{icon.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Layers</h2>
                  {multiSelectIds.length > 1 && (
                    <button 
                      onClick={() => {
                        const newGroupId = crypto.randomUUID();
                        setProject(p => ({
                          ...p,
                          elements: p.elements.map(e => multiSelectIds.includes(e.id) ? { ...e, groupId: newGroupId } : e)
                        }));
                        setMultiSelectIds([]);
                      }}
                      className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded font-bold"
                    >
                      Group Selected
                    </button>
                  )}
                  {multiSelectIds.length === 1 && project.elements.find(e => e.id === multiSelectIds[0])?.groupId && (
                     <button 
                       onClick={() => {
                         const groupToClear = project.elements.find(e => e.id === multiSelectIds[0])?.groupId;
                         setProject(p => ({
                           ...p,
                           elements: p.elements.map(e => e.groupId === groupToClear ? { ...e, groupId: undefined } : e)
                         }));
                         setMultiSelectIds([]);
                       }}
                       className="text-[9px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded font-bold"
                     >
                       Ungroup
                     </button>
                  )}
                </div>

                {project.elements.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No elements added.</p>
                ) : (
                  <div className="space-y-2">
                    {project.elements.map(el => (
                      <div 
                        key={el.id} 
                        onClick={() => setSelectedElementId(el.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${
                          selectedElementId === el.id 
                            ? 'bg-blue-500/10 border-blue-500/50' 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={multiSelectIds.includes(el.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (e.target.checked) setMultiSelectIds(p => [...p, el.id]);
                              else setMultiSelectIds(p => p.filter(id => id !== el.id));
                            }}
                            className="w-3 h-3 rounded bg-[#1A1A1A] border-white/10 text-blue-500"
                          />
                          <span className="font-medium text-xs text-white capitalize">
                            {el.type.replace('_', ' ')}
                          </span>
                          {el.groupId && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-2">
                              Grouped
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} 
                          className="text-gray-400 hover:text-rose-400 p-1"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visualizer' && (
              <div className="flex flex-col h-full overflow-hidden p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Cari preset visualizer (50+ preset)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Filters */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                  {([
                    { id: 'spectrum', name: 'AUDIO SPECTRUM' },
                    { id: 'circular', name: 'CIRCULAR ELEMENTS' },
                    { id: 'waves', name: 'WAVEFORMS & LINES' },
                    { id: 'cyber', name: 'CYBERPUNK & GLOW' },
                    { id: 'particles', name: 'PARTICLES & SHAPES' },
                    { id: 'text_banner', name: 'TEXT & BANNER' }
                  ]).map(category => {
                    
                    const items = ([
                      // spectrum
                      { type: 'bars', name: 'Linear Bars', category: 'spectrum', label: 'SPECTRUM' },
                      { type: 'smooth_curve', name: 'Smooth Curve', category: 'spectrum', label: 'SPECTRUM' },
                      { type: 'symmetrical_mirror', name: 'Symmetrical Mirror', category: 'spectrum', label: 'SPECTRUM' },
                      { type: 'waveform', name: 'Waveform', category: 'spectrum', label: 'SPECTRUM' },
                      { type: 'mirrored_bars', name: 'Mirrored Bars', category: 'spectrum', label: 'SPECTRUM' },
                      
                      // circular
                      { type: 'circle', name: 'Radial Circle', category: 'circular', label: 'CIRCULAR' },
                      { type: 'double_circle', name: 'Double Circle Ring', category: 'circular', label: 'CIRCULAR' },
                      { type: 'circular_spectrum', name: 'Circular Spectrum', category: 'circular', label: 'CIRCULAR' },
                      { type: 'radial_dots', name: 'Dotted Circular', category: 'circular', label: 'CIRCULAR' },
                      { type: 'bass_pulse', name: 'Bass Pulse Rings', category: 'circular', label: 'CIRCULAR' },
                      { type: 'perspective_ring', name: '3D Perspective Ring', category: 'circular', label: 'CIRCULAR' },
                      
                      // waves
                      { type: 'multi_sine', name: 'Multi Sine Waves', category: 'waves', label: 'WAVES' },
                      { type: 'single_sine', name: 'Single Sine Wave', category: 'waves', label: 'WAVES' },
                      { type: 'line_glow', name: 'Straight Line', category: 'waves', label: 'WAVES' },
                      
                      // cyber
                      { type: 'glowing_ring', name: 'Glowing Ring', category: 'cyber', label: 'GLOW' },
                      { type: 'neon_grid', name: 'Neon Synthwave', category: 'cyber', label: 'CYBER' },
                      { type: 'digital_matrix_rain', name: 'Digital Matrix Rain', category: 'cyber', label: 'CYBER' },
                      { type: 'orbs', name: 'Frequency Orbs', category: 'cyber', label: 'ORBS & GLOW' },
                      
                      // particles & shapes & elements
                      { type: 'progress_visualizer', name: 'Progress Visualizer', category: 'particles', label: 'PLAYER & WAVE' },
                      { type: 'water_splash', name: 'Water Splash Burst', category: 'particles', label: 'PARTICLES' },
                      { type: 'particles', name: 'Particle Explosion', category: 'particles', label: 'PARTICLES' },
                      { type: 'spiral_galaxy', name: 'Spiral Galaxy', category: 'particles', label: 'PARTICLES' },
                      { type: 'triangle_spectrum', name: 'Triangle Spectrum', category: 'particles', label: 'SHAPE' },
                      { type: 'diamond_spectrum', name: 'Diamond Spectrum', category: 'particles', label: 'SHAPE' },
                      { type: 'glowing_blocks', name: 'Glowing Blocks', category: 'particles', label: 'SHAPE' },
                      { type: 'flames', name: 'Flames Column', category: 'particles', label: 'ELEMENTS' },
                      { type: 'rain', name: 'Rain Ripples', category: 'particles', label: 'ELEMENTS' },
                      { type: 'color_pixel', name: 'Color Pixel', category: 'particles', label: 'ELEMENTS' },
                      { type: 'progress_bar', name: 'Progress Bar', category: 'particles', label: 'BASIC' },
                      
                      // text_banner
                      { type: 'banner', name: 'Text Banner', category: 'text_banner', label: 'BANNER' },
                      { type: 'bracket_banner', name: 'Bracket Banner', category: 'text_banner', label: 'BANNER' },
                      { type: 'hanging_text', name: 'Hanging Text', category: 'text_banner', label: 'TEXT' },
                    ] as const).filter(item => item.category === category.id && item.name.toLowerCase().includes(searchQuery.toLowerCase()));

                    if (items.length === 0) return null;

                    return (
                      <div key={category.id} className="border-b border-white/5 pb-4 last:border-0">
                        <button 
                          onClick={() => setOpenVizAccordion(openVizAccordion === category.id ? '' : category.id)} 
                          className="w-full flex items-center justify-between group outline-none"
                        >
                          <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-3 group-hover:text-gray-300 transition-colors">
                            <Settings size={12} /> {category.name}
                          </h3>
                          <ChevronDown size={14} className={`text-gray-500 mb-3 transition-transform ${openVizAccordion === category.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {openVizAccordion === category.id && (
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            {items.map(item => (
                              <button 
                                key={item.type}
                                onClick={() => addElement(item.type as any)} 
                                className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500/50 rounded-xl text-left transition-colors flex flex-col gap-1.5 min-h-[70px] justify-center"
                              >
                                <span className="text-xs font-bold text-gray-200">{item.name}</span>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col min-w-0 min-h-0 bg-[#0A0A0C] p-2 lg:p-4 gap-2 lg:gap-4 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-black' : ''}`}>
          
          {isFullscreen && (
            <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
              <span className="font-bold">X</span>
            </button>
          )}
          {/* Canvas Wrapper */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="w-full h-full flex items-center justify-center min-h-0 relative">
              <CanvasRenderer 
                ref={rendererRef}
                project={project}
                getAudioData={getAudioData}
                getWaveformData={getWaveformData}
                isPlaying={isPlaying || isRecording}
                isRecording={isRecording}
                currentTime={currentTime}
                duration={duration}
                selectedElementId={selectedElementId}
                onUpdateElement={updateElement}
                onSelectElement={setSelectedElementId}
              />
            </div>
          </div>

          {/* Timeline & Player UI */}
          <Timeline 
            project={project}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={seek}
            onTogglePlay={togglePlay}
            audioUrl={audioUrl}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={updateElement}
            onTakeSnapshot={takeSnapshot}
          />
        </main>

        {/* Right Sidebar - Properties or Analytics */}
        <aside className="w-80 flex flex-col bg-[#0D0D10] border-l border-white/5 overflow-y-auto">
          {selectedElementId ? (() => {
            const el = project.elements.find(e => e.id === selectedElementId);
            if (!el) return null;
            return (
              <div className="p-6 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-semibold text-white capitalize mb-1">{el.type} Element</h2>
                    <span className="inline-block px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded uppercase tracking-wider">VISUALIZER</span>
                  </div>
                  {el.groupId && (
                    <button 
                      onClick={() => {
                        const groupId = el.groupId;
                        setProject(p => ({
                          ...p,
                          elements: p.elements.map(e => e.groupId === groupId ? { ...e, groupId: undefined } : e)
                        }));
                      }}
                      className="text-[9px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded font-bold"
                    >
                      UNGROUP
                    </button>
                  )}
                </div>

                {/* Transform */}
                <div className="space-y-4">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                    <Settings size={12} /> Transform & Posisi
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[10px] text-gray-500 mb-1 block">Posisi X (px)</span>
                      <input type="number" value={el.x ?? 0} onChange={e => updateElement(el.id, { x: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-gray-500 mb-1 block">Posisi Y (px)</span>
                      <input type="number" value={el.y ?? 0} onChange={e => updateElement(el.id, { y: Number(e.target.value) })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </label>
                  </div>
                  <label className="block">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-500">Scale ({Math.round((el.scale || 1) * 100)}%)</span>
                    </div>
                    <input type="range" min="0.1" max="3" step="0.1" value={el.scale || 1} onChange={e => updateElement(el.id, { scale: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  </label>
                  <label className="block">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-500">Rotasi ({el.rotation || 0}°)</span>
                    </div>
                    <input type="range" min="-180" max="180" value={el.rotation || 0} onChange={e => updateElement(el.id, { rotation: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  </label>
                  <label className="block">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-500">Opasitas ({Math.round(el.opacity * 100)}%)</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={el.opacity ?? 1} onChange={e => updateElement(el.id, { opacity: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  </label>
                </div>

                {/* MOTION PRESETS (ANIMASI GELOMBANG & ELEMEN) */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                    <Activity size={12} className="text-indigo-400" /> Motion Presets & Transisi
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', name: 'Statis', desc: 'Tanpa animasi' },
                      { id: 'pulse', name: 'Bass Pulse', desc: 'Denyut beat bass' },
                      { id: 'floating_sine', name: 'Floating Sine', desc: 'Melayang naik-turun' },
                      { id: 'slide', name: 'Slide & Glide', desc: 'Geser osilasi ritmis' },
                      { id: 'fade', name: 'Breathing Fade', desc: 'Kelap-kelip pudar' },
                      { id: 'glow_pulse', name: 'Glow Pulse', desc: 'Denyut pendar cahaya' },
                      { id: 'bounce', name: 'Beat Bounce', desc: 'Lompatan ritme beat' },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => updateElement(el.id, { motionPreset: preset.id as any })}
                        className={`p-2 border rounded-lg text-left transition-all flex flex-col justify-between min-h-[50px] ${
                          (el.motionPreset || 'none') === preset.id
                            ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/10'
                            : 'bg-[#1A1A1A] border-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold text-white">{preset.name}</span>
                        <span className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{preset.desc}</span>
                      </button>
                    ))}
                  </div>

                  {el.motionPreset && el.motionPreset !== 'none' && (
                    <div className="space-y-3 pt-2">
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Intensitas Gerakan</span>
                          <span className="text-[10px] text-indigo-400 font-bold">{el.motionIntensity ?? 50}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="100" 
                          value={el.motionIntensity ?? 50} 
                          onChange={e => updateElement(el.id, { motionIntensity: Number(e.target.value) })} 
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                        />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Kecepatan Gerakan (Speed)</span>
                          <span className="text-[10px] text-indigo-400 font-bold">{(el.motionSpeed ?? 1.0).toFixed(1)}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.2" 
                          max="3.0" 
                          step="0.1"
                          value={el.motionSpeed ?? 1.0} 
                          onChange={e => updateElement(el.id, { motionSpeed: Number(e.target.value) })} 
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                        />
                      </label>
                    </div>
                  )}
                </div>

                
                {(el.type === 'subtitle' || el.type === 'text') && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex gap-2 p-1 bg-black/40 rounded-lg">
                      <button 
                        onClick={() => setSubtitleTab('basic')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded ${subtitleTab === 'basic' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Basic
                      </button>
                      <button 
                        onClick={() => setSubtitleTab('templates')}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded ${subtitleTab === 'templates' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Templates
                      </button>
                    </div>

                    {subtitleTab === 'basic' && (
                      <div className="space-y-4">
                        <label className="block">
                          <span className="text-[10px] text-gray-500 mb-2 block">Background Color</span>
                          <input type="color" value={(el as any).backgroundColor || '#000000'} onChange={e => updateElement(el.id, { backgroundColor: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                        </label>
                        <label className="block">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Background Opacity ({Math.round(((el as any).backgroundOpacity ?? 0.8) * 100)}%)</span>
                          </div>
                          <input type="range" min="0" max="1" step="0.05" value={(el as any).backgroundOpacity ?? 0.8} onChange={e => updateElement(el.id, { backgroundOpacity: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                        </label>
                      </div>
                    )}
                    {subtitleTab === 'templates' && (
                      <div className="space-y-0">
                        
                        {/* STYLE DASAR ACCORDION */}
                        <div className="pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'style_dasar' ? '' : 'style_dasar')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> STYLE DASAR
                             </h3>
                             <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openTemplateAccordion === 'style_dasar' ? 'rotate-180' : ''}`} />
                           </button>
                           {openTemplateAccordion === 'style_dasar' && (
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'default', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex flex-col items-center justify-center h-16">
                               <span className="text-white font-bold text-xs">Default</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'retro', color: '#E87D2A' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex flex-col items-center justify-center h-16">
                               <span className="text-white font-bold text-xs" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill', filter: 'drop-shadow(4px 4px 0px #E87D2A)' }}>Retro</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'calli', color: '#015B28' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#015B28] font-bold text-xs" style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill', filter: 'drop-shadow(3px 3px 0px #013B18)' }}>Calli</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'bubble_yellow', color: '#000000' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="bg-[#FFD700] text-black px-2 py-0.5 rounded font-bold text-[10px]">Bubble Yellow</span>
                             </button>
                           </div>
                           )}
                        </div>

                        {/* GLOWING & NEON ACCORDION */}
                        <div className="pt-4 border-t border-white/5 pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'glowing' ? '' : 'glowing')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> GLOWING & NEON
                             </h3>
                             <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openTemplateAccordion === 'glowing' ? 'rotate-180' : ''}`} />
                           </button>
                           {openTemplateAccordion === 'glowing' && (
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'neon', color: '#00ffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '0 0 10px #00ffff'}}>Neon Blue</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'glow_border', color: '#ff00ff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="font-bold text-[10px]" style={{WebkitTextStroke: '1px #ff00ff', color: 'transparent', textShadow: '0 0 5px #ff00ff'}}>Glow Border</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'black_fire', fontFamily: 'Permanent Marker', color: '#ff6600', useGradient: true, color2: '#ffcc00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16 overflow-hidden">
                               <span className="font-bold text-[10px]" style={{fontFamily: 'Permanent Marker', color: '#ff6600', textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>Black Fire</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_shadow', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '-2px 0px 0px #00ffff, 2px 0px 0px #ff0050'}}>Glitch / TikTok</span>
                             </button>
                           </div>
                           )}
                        </div>

                        {/* ANIMASI ACCORDION */}
                        <div className="pt-4 border-t border-white/5 pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'animasi' ? '' : 'animasi')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> ANIMASI KARAOKE & POP-UP
                             </h3>
                             <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openTemplateAccordion === 'animasi' ? 'rotate-180' : ''}`} />
                           </button>
                           {openTemplateAccordion === 'animasi' && (
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_pop', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex flex-col items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '2px 2px 0px #000000'}}>Pop-Up Masuk</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_karaoke', color: '#00ff00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '2px 2px 0px #000000'}}>Green Karaoke</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'highlight_pop', color: '#FFFF00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#FFFF00] font-black text-[10px] italic" style={{textShadow: '2px 2px 0px #000000', WebkitTextStroke: '0.5px black'}}>Highlight Pop</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'popup_words', color: '#ffcc00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#ffcc00] font-bold text-[10px]" style={{textShadow: '1px 1px 0px #000', transform: 'scale(1.1)'}}>Pop-Up Arab</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'scattered', color: '#E31B1B', fontFamily: 'Georgia' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#E31B1B] font-bold text-[10px] text-center leading-tight" style={{fontFamily: 'Georgia', textShadow: '1px 1px 0px #FFF'}}>Scattered<br/>Pop</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'arabic_cascade', color: '#E31B1B' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px] text-center leading-tight">Arabic<br/>Cascade</span>
                             </button>
                           </div>
                           )}
                        </div>

                        {/* OTHERS ACCORDION */}
                        <div className="pt-4 border-t border-white/5 pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'others' ? '' : 'others')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> KUAS, VINTAGE, & LAINNYA
                             </h3>
                             <ChevronDown size={14} className={`text-gray-500 mb-4 transition-transform ${openTemplateAccordion === 'others' ? 'rotate-180' : ''}`} />
                           </button>
                           {openTemplateAccordion === 'others' && (
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'colorful_words', fontFamily: 'Caveat' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="font-bold text-xs flex gap-[1px]">
                                 <span style={{color: '#FFB3C6'}}>C</span><span style={{color: '#FFD166'}}>O</span><span style={{color: '#A0C4FF'}}>L</span><span style={{color: '#FF9F1C'}}>O</span><span style={{color: '#FFB3C6'}}>R</span><span style={{color: '#FFD166'}}>S</span>
                               </span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'brush_stroke', fontFamily: 'Caveat Brush', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-xs" style={{fontFamily: 'Caveat Brush', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>Brush</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'vintage_brush', fontFamily: 'Rock Salt', color: '#ffffff', rotation: -5 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{fontFamily: 'Rock Salt', textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Vintage</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'street_dripping', fontFamily: 'Creepster', color: '#ffffff', useGradient: false, rotation: 0 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16 overflow-hidden">
                               <span className="font-bold text-[10px]" style={{fontFamily: 'Creepster', color: '#ffffff', textShadow: '3px 3px 0px #ff0000'}}>Street Drip</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'architect', fontFamily: 'Architects Daughter', color: '#000000', rotation: 0 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px] uppercase" style={{fontFamily: 'Architects Daughter', textShadow: '1px 1px 0px rgba(0,0,0,0.5)'}}>Architect</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'jhun_brush', fontFamily: 'Sedgwick Ave Display', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{fontFamily: 'Sedgwick Ave Display', textShadow: '2px 2px 0px #000000'}}>Jhun Brush</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'pen_story', fontFamily: 'Shadows Into Light', color: '#000000', rotation: -2 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-sm" style={{fontFamily: 'Shadows Into Light', textShadow: '1px 1px 0px rgba(0,0,0,0.2)'}}>Pen Story</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { isHanging: !(el as any).isHanging })} className={`p-2 bg-[#1A1A1A] border ${(el as any).isHanging ? 'border-blue-500' : 'border-white/5 hover:border-blue-500'} rounded flex items-center justify-center h-16`}>
                               <span className="text-white font-bold text-[10px]">Tali Gantung</span>
                             </button>
                           </div>
                           )}
                        </div>

                        {/* Hidden Original Buttons just to prevent compile error in our replace logic */}
                        <div className="hidden">
                          <button onClick={() => updateElement(el.id, { templateStyle: 'default', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold">DEFAULT</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'layered_outline', color: '#E87D2A' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill', filter: 'drop-shadow(4px 4px 0px #E87D2A)' }}>RETRO</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'calli', color: '#015B28' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-[#015B28] font-bold text-xs" style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill', filter: 'drop-shadow(3px 3px 0px #013B18)' }}>CALLI</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'bubble_yellow', color: '#000000' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="bg-[#FFD700] text-black px-2 py-1 rounded font-bold text-xs">BUBBLE</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'bubble_black', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="bg-black text-white border border-white px-2 py-1 rounded font-bold text-xs">BLACK</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'background_box', color: '#ffffff', backgroundColor: '#000000', backgroundOpacity: 0.5 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="bg-black/50 text-white px-2 py-1 rounded font-bold text-[10px]">BOX BG</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'neon', color: '#00ffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '0 0 10px #00ffff'}}>NEON</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'glow_border', color: '#ff00ff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="font-bold text-xs" style={{WebkitTextStroke: '1px #ff00ff', color: 'transparent', textShadow: '0 0 5px #ff00ff'}}>BORDER</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_pop', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>POP-UP</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'colorful_words', fontFamily: 'Caveat' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="font-bold text-xs flex gap-[1px]">
                              <span style={{color: '#FFB3C6'}}>C</span>
                              <span style={{color: '#FFD166'}}>O</span>
                              <span style={{color: '#A0C4FF'}}>L</span>
                              <span style={{color: '#FF9F1C'}}>O</span>
                              <span style={{color: '#FFB3C6'}}>R</span>
                              <span style={{color: '#FFD166'}}>S</span>
                            </span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'brush_stroke', fontFamily: 'Caveat Brush', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Caveat Brush', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>BRUSH</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'vintage_brush', fontFamily: 'Rock Salt', color: '#ffffff', rotation: -5 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Rock Salt', textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>VINTAGE</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'black_fire', fontFamily: 'Permanent Marker', color: '#ff6600', useGradient: true, color2: '#ffcc00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px] overflow-hidden">
                            <span className="font-bold text-xs" style={{fontFamily: 'Permanent Marker', color: '#ff6600', textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>BLACK FIRE</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'street_dripping', fontFamily: 'Creepster', color: '#ffffff', useGradient: false, rotation: 0 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px] overflow-hidden">
                            <span className="font-bold text-xs" style={{fontFamily: 'Creepster', color: '#ffffff', textShadow: '3px 3px 0px #ff0000'}}>STREET DRIP</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'architect', fontFamily: 'Architects Daughter', color: '#000000', rotation: 0 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs uppercase" style={{fontFamily: 'Architects Daughter', textShadow: '1px 1px 0px rgba(0,0,0,0.5)'}}>ARCHITECT</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'jhun_brush', fontFamily: 'Sedgwick Ave Display', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Sedgwick Ave Display', textShadow: '2px 2px 0px #000000'}}>JHUN BRUSH</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'pen_story', fontFamily: 'Shadows Into Light', color: '#000000', rotation: -2 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-lg" style={{fontFamily: 'Shadows Into Light', textShadow: '1px 1px 0px rgba(0,0,0,0.2)'}}>Pen story</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_karaoke', color: '#00ff00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>KARAOKE</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'popup_words', color: '#ffcc00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-[#ffcc00] font-bold text-[10px]" style={{textShadow: '1px 1px 0px #000', transform: 'scale(1.1)'}}>POP-UP ARAB</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_shadow', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-[10px]" style={{textShadow: '-2px 0px 0px #00ffff, 2px 0px 0px #ff0050'}}>TIKTOK</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { isHanging: !(el as any).isHanging })} className={`p-3 bg-[#1A1A1A] border ${(el as any).isHanging ? 'border-blue-500' : 'border-white/5 hover:border-blue-500'} rounded flex items-center justify-center min-h-[60px]`}>
                            <span className="text-white font-bold text-xs">HANGING</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'highlight_pop', color: '#FFFF00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px] col-span-2">
                            <span className="text-[#FFFF00] font-black text-sm italic" style={{textShadow: '2px 2px 0px #000000', WebkitTextStroke: '0.5px black'}}>HIGHLIGHT POP</span>
                          </button>
                        
</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Tint Properties */}
                {el.type === 'image' && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                      <Settings size={12} /> Properti Warna Gambar
                    </h3>
                    <div className="flex items-center gap-2 mt-2 mb-2">
                      <input 
                        type="checkbox" 
                        id={`colortint-${el.id}`}
                        checked={(el as any).useColorTint || false} 
                        onChange={e => updateElement(el.id, { useColorTint: e.target.checked })}
                        className="rounded bg-black/50 border-white/10 text-indigo-500"
                      />
                      <label htmlFor={`colortint-${el.id}`} className="text-[10px] text-gray-400 cursor-pointer">Timpa dengan Warna Solid (Tint)</label>
                    </div>
                    {(el as any).useColorTint && (
                      <label className="block mt-2">
                        <span className="text-[10px] text-gray-500 mb-2 block">Warna Tint</span>
                        <input type="color" value={el.color || '#ffffff'} onChange={e => updateElement(el.id, { color: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                      </label>
                    )}
                  </div>
                )}

                {/* Specific Properties */}
                {el.type !== 'image' && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                    <Settings size={12} /> Properti Visualizer ({el.type})
                  </h3>
                  <div className="block">
                    <span className="text-[10px] text-gray-500 mb-2 block">Warna Utama</span>
                    <div className="flex flex-wrap gap-1">
                      <label className="relative w-6 h-6 rounded flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/50 bg-[#2a2a2a] overflow-hidden">
                        <span className="text-white text-xs font-bold leading-none">+</span>
                        <input 
                          type="color" 
                          value={el.color || '#ffffff'} 
                          onChange={e => updateElement(el.id, { color: e.target.value })} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        />
                      </label>
                      {[
                        '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
                        '#ff00ff', '#00ffff', '#000000', '#808080', '#ffa500', 
                        '#800080', '#008000', '#000080', '#800000', '#008080',
                        '#ffc0cb', '#a52a2a', '#ffd700', '#4b0082', '#ff4500'
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateElement(el.id, { color })}
                          className="w-6 h-6 rounded border border-white/10 hover:border-white/50 transition-colors"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <input 
                      type="checkbox" 
                      id={`gradient-${el.id}`}
                      checked={el.useGradient || false} 
                      onChange={e => updateElement(el.id, { useGradient: e.target.checked })}
                      className="rounded bg-black/50 border-white/10 text-indigo-500"
                    />
                    <label htmlFor={`gradient-${el.id}`} className="text-[10px] text-gray-400 cursor-pointer">Gunakan Gradient (2 Warna)</label>
                  </div>
                  
                  {el.useGradient && (
                    <label className="block mt-2">
                      <span className="text-[10px] text-gray-500 mb-2 block">Warna Kedua (Gradient)</span>
                      <input type="color" value={el.color2 || '#ffffff'} onChange={e => updateElement(el.id, { color2: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    </label>
                  )}
                  
                  {(el.type === 'text' || el.type === 'subtitle' || el.type === 'banner' || el.type === 'bracket_banner') && (
                    <>
                      {el.type === 'text' && (
                        <label className="block">
                          <span className="text-[10px] text-gray-500 mb-1 block">Teks</span>
                          <input type="text" value={el.text || ''} onChange={e => updateElement(el.id, { text: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                        </label>
                      )}
                      
                      {el.type === 'banner' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[10px] text-gray-500 mb-1 block">Teks Kiri</span>
                              <input type="text" value={el.textLeft ?? ''} onChange={e => updateElement(el.id, { textLeft: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                            </label>
                            <label className="block">
                              <span className="text-[10px] text-gray-500 mb-1 block">Teks Kanan</span>
                              <input type="text" value={el.textRight ?? ''} onChange={e => updateElement(el.id, { textRight: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                            </label>
                          </div>
                          
                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Lebar ({el.width}px)</span>
                            </div>
                            <input type="range" min="200" max="1000" value={el.width || 600} onChange={e => updateElement(el.id, { width: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                          </label>
                          
                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Tinggi ({el.height}px)</span>
                            </div>
                            <input type="range" min="50" max="300" value={el.height || 100} onChange={e => updateElement(el.id, { height: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                          </label>
                          
                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Kemiringan / Slant ({el.slant}px)</span>
                            </div>
                            <input type="range" min="0" max="100" value={el.slant || 25} onChange={e => updateElement(el.id, { slant: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                          </label>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Opacity Kiri ({Math.round((el.boxOpacity1 ?? el.boxOpacity ?? 1) * 100)}%)</span>
                              </div>
                              <input type="range" min="0" max="1" step="0.05" value={el.boxOpacity1 ?? el.boxOpacity ?? 1} onChange={e => updateElement(el.id, { boxOpacity1: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                            </label>
                            <label className="block">
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Opacity Kanan ({Math.round((el.boxOpacity2 ?? el.boxOpacity ?? 1) * 100)}%)</span>
                              </div>
                              <input type="range" min="0" max="1" step="0.05" value={el.boxOpacity2 ?? el.boxOpacity ?? 1} onChange={e => updateElement(el.id, { boxOpacity2: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                            </label>
                          </div>

                          <div className="p-3 bg-white/5 rounded-lg space-y-3">
                            <span className="text-[10px] font-bold text-white uppercase block mb-2">Warna Banner</span>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Teks Kiri</span>
                                <input type="color" value={el.color || '#ffffff'} onChange={e => updateElement(el.id, { color: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>
                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Teks Kanan</span>
                                <input type="color" value={el.color2 || '#ffff00'} onChange={e => updateElement(el.id, { color2: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>
                              
                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Box Kiri</span>
                                <input type="color" value={el.boxColor1 || '#171717'} onChange={e => updateElement(el.id, { boxColor1: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>
                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Box Kanan</span>
                                <input type="color" value={el.boxColor2 || '#247abf'} onChange={e => updateElement(el.id, { boxColor2: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>

                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Tepi Kiri</span>
                                <input type="color" value={el.strokeColor1 || '#2bc299'} onChange={e => updateElement(el.id, { strokeColor1: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>
                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Tepi Kanan</span>
                                <input type="color" value={el.strokeColor2 || '#135185'} onChange={e => updateElement(el.id, { strokeColor2: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {el.type === 'bracket_banner' && (
                        <div className="space-y-4">
                          <label className="block">
                            <span className="text-[10px] text-gray-500 mb-1 block">Teks Banner</span>
                            <input type="text" value={el.text || ''} onChange={e => updateElement(el.id, { text: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/10 rounded px-3 py-2 text-sm text-white" />
                          </label>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                              <span className="text-[10px] text-gray-500 mb-1 block">Font</span>
                              <select value={el.fontFamily || 'Arial'} onChange={e => updateElement(el.id, { fontFamily: e.target.value })} className="w-full bg-[#1A1A1A] border border-white/10 rounded px-2 py-1.5 text-xs text-white">
                                {['Arial', 'Oswald', 'Impact', 'Verdana', 'Times New Roman', 'Courier New', 'Bebas Neue', 'Montserrat', 'Inter', 'Anton'].map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </label>
                            
                            <label className="block">
                              <span className="text-[10px] text-gray-500 mb-1 block">Huruf (Case)</span>
                              <select value={el.textCase || 'uppercase'} onChange={e => updateElement(el.id, { textCase: e.target.value as any })} className="w-full bg-[#1A1A1A] border border-white/10 rounded px-2 py-1.5 text-xs text-white">
                                <option value="none">Normal</option>
                                <option value="uppercase">UPPERCASE</option>
                                <option value="lowercase">lowercase</option>
                                <option value="capitalize">Capitalize</option>
                              </select>
                            </label>
                          </div>

                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Lebar ({el.width}px)</span>
                            </div>
                            <input type="range" min="200" max="1000" value={el.width || 600} onChange={e => updateElement(el.id, { width: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                          </label>
                          
                          <label className="block">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-gray-500">Tinggi ({el.height}px)</span>
                            </div>
                            <input type="range" min="50" max="300" value={el.height || 100} onChange={e => updateElement(el.id, { height: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                          </label>

                          <div className="p-3 bg-white/5 rounded-lg space-y-3">
                            <span className="text-[10px] font-bold text-white uppercase block mb-2">Warna Banner</span>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Warna Teks</span>
                                <input type="color" value={el.color || '#ffffff'} onChange={e => updateElement(el.id, { color: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>

                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Warna Border</span>
                                <input type="color" value={el.strokeColor1 || '#ffffff'} onChange={e => updateElement(el.id, { strokeColor1: e.target.value, strokeColor2: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>

                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Box Gradient Kiri</span>
                                <input type="color" value={el.boxColor1 || '#df001c'} onChange={e => updateElement(el.id, { boxColor1: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>

                              <label className="block">
                                <span className="text-[10px] text-gray-500 mb-1 block">Box Gradient Kanan</span>
                                <input type="color" value={el.boxColor2 || '#9a0914'} onChange={e => updateElement(el.id, { boxColor2: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(el.type === 'text' || el.type === 'subtitle') && (
                        <label className="block">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Ukuran Font ({el.fontSize}px)</span>
                          </div>
                          <input type="range" min="10" max="200" value={el.fontSize || 16} onChange={e => updateElement(el.id, { fontSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                        </label>
                      )}
                      
                      {(el.type === 'text' || el.type === 'subtitle') && (el as any).isHanging && (
                        <label className="block mt-4 mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Panjang Tali</span>
                          </div>
                          <input type="range" min="50" max="720" value={el.y} onChange={e => updateElement(el.id, { y: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                        </label>
                      )}
                      
                      <label className="block">
                        <span className="text-[10px] text-gray-500 mb-1 block">Format Teks (Case)</span>
                        <select 
                          value={el.textCase || 'none'} 
                          onChange={e => updateElement(el.id, { textCase: e.target.value as any })}
                          className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        >
                          <option value="none">Asli (Normal)</option>
                          <option value="uppercase">HURUF BESAR (UPPERCASE)</option>
                          <option value="lowercase">huruf kecil (lowercase)</option>
                          <option value="capitalize">Huruf Pertama Besar (Capitalize)</option>
                        </select>
                      </label>
                    </>
                  )}
                  
                  {el.type === 'bars' && (
                    <label className="block">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Tinggi Max ({el.height}px)</span>
                      </div>
                      <input type="range" min="50" max="600" value={el.height || 100} onChange={e => updateElement(el.id, { height: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    </label>
                  )}

                  {el.type === 'circle' && (
                    <label className="block">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Radius ({el.radius}px)</span>
                      </div>
                      <input type="range" min="20" max="400" value={el.radius || 100} onChange={e => updateElement(el.id, { radius: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    </label>
                  )}

                  {el.type === 'particles' && (
                    <>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jumlah Partikel ({el.count})</span>
                        </div>
                        <input type="range" min="10" max="500" value={el.count || 10} onChange={e => updateElement(el.id, { count: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Kecepatan ({el.speed}x)</span>
                        </div>
                        <input type="range" min="0.1" max="5" step="0.1" value={el.speed || 1} onChange={e => updateElement(el.id, { speed: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {el.type === 'orbs' && (
                    <>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jumlah Orb ({el.count})</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.count || 10} onChange={e => updateElement(el.id, { count: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Radius Base ({el.radius}px)</span>
                        </div>
                        <input type="range" min="10" max="200" value={el.radius || 100} onChange={e => updateElement(el.id, { radius: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {el.type === 'neon_grid' && (
                    <label className="block">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Perspektif ({el.perspective})</span>
                      </div>
                      <input type="range" min="0.5" max="3" step="0.1" value={el.perspective || 1} onChange={e => updateElement(el.id, { perspective: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    </label>
                  )}

                  {el.type === 'digital_matrix_rain' && (
                    <>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Kepadatan ({el.density})</span>
                        </div>
                        <input type="range" min="5" max="50" value={el.density || 20} onChange={e => updateElement(el.id, { density: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Kecepatan ({el.speed}x)</span>
                        </div>
                        <input type="range" min="0.1" max="5" step="0.1" value={el.speed || 1} onChange={e => updateElement(el.id, { speed: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {(el.type === 'double_circle' || el.type === 'circular_spectrum' || el.type === 'bass_pulse' || el.type === 'spiral_galaxy' || el.type === 'triangle_spectrum' || el.type === 'diamond_spectrum' || el.type === 'glowing_ring' || el.type === 'radial_dots' || el.type === 'perspective_ring') && (
                    <label className="block">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Radius ({el.radius}px)</span>
                      </div>
                      <input type="range" min="20" max="400" value={el.radius || 100} onChange={e => updateElement(el.id, { radius: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    </label>
                  )}

                  {el.type === 'perspective_ring' && (
                    <>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Perspektif (Squash: {el.perspective})</span>
                        </div>
                        <input type="range" min="0.1" max="1" step="0.05" value={el.perspective || 0.3} onChange={e => updateElement(el.id, { perspective: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ketebalan ({el.thickness}px)</span>
                        </div>
                        <input type="range" min="1" max="50" value={el.thickness || 15} onChange={e => updateElement(el.id, { thickness: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Segmen ({el.segments})</span>
                        </div>
                        <input type="range" min="10" max="120" value={el.segments || 60} onChange={e => updateElement(el.id, { segments: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {el.type === 'progress_bar' && (
                    <>
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <input 
                          type="checkbox" 
                          id={`show-time-${el.id}`}
                          checked={el.showTime !== false} 
                          onChange={e => updateElement(el.id, { showTime: e.target.checked })}
                          className="rounded bg-black/50 border-white/10 text-indigo-500"
                        />
                        <label htmlFor={`show-time-${el.id}`} className="text-[10px] text-gray-400 cursor-pointer">Tampilkan Waktu (0:00)</label>
                      </div>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ukuran Font ({el.fontSize}px)</span>
                        </div>
                        <input type="range" min="10" max="100" value={el.fontSize || 24} onChange={e => updateElement(el.id, { fontSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {el.type === 'progress_visualizer' && (
                    <>
                      <label className="block mt-4">
                        <span className="text-[10px] text-gray-500 mb-2 block">Gaya Visualizer Gelombang</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'bars', name: 'Equalizer Bars' },
                            { id: 'mirrored', name: 'Mirrored Wave' },
                            { id: 'wave', name: 'Smooth Curve' },
                            { id: 'dots', name: 'Dotted Column' },
                            { id: 'segmented', name: 'Segmented Blocks' },
                            { id: 'spectrum', name: 'Spectrum Bars (Rainbow)' },
                          ].map(style => (
                            <button
                              key={style.id}
                              onClick={() => updateElement(el.id, { waveformStyle: style.id as any })}
                              className={`p-2 rounded text-xs font-medium border transition-colors ${
                                (el.waveformStyle || 'bars') === style.id
                                  ? 'bg-blue-600/30 border-blue-500 text-white'
                                  : 'bg-[#1A1A1A] border-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Panjang Progress Bar ({el.width || 640}px)</span>
                        </div>
                        <input type="range" min="200" max="1920" step="10" value={el.width || 640} onChange={e => updateElement(el.id, { width: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Tinggi Visualizer ({el.barHeight || 40}px)</span>
                        </div>
                        <input type="range" min="10" max="200" value={el.barHeight || 40} onChange={e => updateElement(el.id, { barHeight: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Lebar Bar ({el.barWidth || 4}px)</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.barWidth || 4} onChange={e => updateElement(el.id, { barWidth: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jarak Spasi Bar ({el.barSpacing || 3}px)</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.barSpacing || 3} onChange={e => updateElement(el.id, { barSpacing: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jarak Waveform ke Bar ({el.waveformOffset || 0}px)</span>
                        </div>
                        <input type="range" min="0" max="200" value={el.waveformOffset || 0} onChange={e => updateElement(el.id, { waveformOffset: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ketebalan Garis Jalur ({el.height || 4}px)</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.height || 4} onChange={e => updateElement(el.id, { height: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Glow Intensity ({el.glowIntensity || 15})</span>
                        </div>
                        <input type="range" min="0" max="60" value={el.glowIntensity || 0} onChange={e => updateElement(el.id, { glowIntensity: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <input 
                          type="checkbox" 
                          id={`show-knob-${el.id}`}
                          checked={el.showKnob !== false} 
                          onChange={e => updateElement(el.id, { showKnob: e.target.checked })}
                          className="rounded bg-black/50 border-white/10 text-indigo-500"
                        />
                        <label htmlFor={`show-knob-${el.id}`} className="text-[10px] text-gray-400 cursor-pointer">Tampilkan Titik Playhead (Knob)</label>
                      </div>

                      {el.showKnob !== false && (
                        <label className="block mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Ukuran Knob ({el.knobSize || 7}px)</span>
                          </div>
                          <input type="range" min="3" max="25" value={el.knobSize || 7} onChange={e => updateElement(el.id, { knobSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                        </label>
                      )}

                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <input 
                          type="checkbox" 
                          id={`show-time-pv-${el.id}`}
                          checked={el.showTime !== false} 
                          onChange={e => updateElement(el.id, { showTime: e.target.checked })}
                          className="rounded bg-black/50 border-white/10 text-indigo-500"
                        />
                        <label htmlFor={`show-time-pv-${el.id}`} className="text-[10px] text-gray-400 cursor-pointer">Tampilkan Waktu (00:00 / 03:45)</label>
                      </div>

                      {el.showTime !== false && (
                        <label className="block mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Ukuran Font Waktu ({el.fontSize || 16}px)</span>
                          </div>
                          <input type="range" min="10" max="48" value={el.fontSize || 16} onChange={e => updateElement(el.id, { fontSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                        </label>
                      )}
                    </>
                  )}

                  {el.type === 'water_splash' && (
                    <>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jumlah Percikan ({el.particleCount})</span>
                        </div>
                        <input type="range" min="10" max="500" value={el.particleCount || 150} onChange={e => updateElement(el.id, { particleCount: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Radius Dasar ({el.splashRadius}px)</span>
                        </div>
                        <input type="range" min="50" max="800" value={el.splashRadius || 250} onChange={e => updateElement(el.id, { splashRadius: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ukuran Tetesan ({el.dropSize}px)</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.dropSize || 5} onChange={e => updateElement(el.id, { dropSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Kecepatan Splash</span>
                        </div>
                        <input type="range" min="0.1" max="3" step="0.1" value={el.speed || 1} onChange={e => updateElement(el.id, { speed: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {el.type === 'radial_dots' && (
                    <>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jumlah Titik/Layer ({el.count})</span>
                        </div>
                        <input type="range" min="10" max="200" value={el.count || 60} onChange={e => updateElement(el.id, { count: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jumlah Layer ({el.layers})</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.layers || 5} onChange={e => updateElement(el.id, { layers: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ukuran Titik ({el.dotSize}px)</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.dotSize || 5} onChange={e => updateElement(el.id, { dotSize: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {el.type === 'glowing_blocks' && (
                    <>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Kolom ({el.columns})</span>
                        </div>
                        <input type="range" min="2" max="40" value={el.columns || 8} onChange={e => updateElement(el.id, { columns: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Baris ({el.rows})</span>
                        </div>
                        <input type="range" min="2" max="40" value={el.rows || 6} onChange={e => updateElement(el.id, { rows: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Lebar Blok ({el.blockWidth}px)</span>
                        </div>
                        <input type="range" min="5" max="100" value={el.blockWidth || 20} onChange={e => updateElement(el.id, { blockWidth: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Tinggi Blok Max ({el.blockHeight}px)</span>
                        </div>
                        <input type="range" min="10" max="200" value={el.blockHeight || 40} onChange={e => updateElement(el.id, { blockHeight: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jarak Spasi ({el.spacing}px)</span>
                        </div>
                        <input type="range" min="0" max="50" value={el.spacing || 10} onChange={e => updateElement(el.id, { spacing: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Intensitas Glow ({el.glowIntensity})</span>
                        </div>
                        <input type="range" min="0" max="100" value={el.glowIntensity || 20} onChange={e => updateElement(el.id, { glowIntensity: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}

                  {(el.type === 'smooth_curve' || el.type === 'symmetrical_mirror' || el.type === 'multi_sine' || el.type === 'single_sine' || el.type === 'flames' || el.type === 'waveform' || el.type === 'mirrored_bars') && (
                    <label className="block">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Tinggi Max ({el.height}px)</span>
                      </div>
                      <input type="range" min="50" max="600" value={el.height || 100} onChange={e => updateElement(el.id, { height: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    </label>
                  )}
                  
                  {el.type === 'line_glow' && (
                    <>
                      <label className="block mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Panjang Garis ({el.width || 600}px)</span>
                        </div>
                        <input type="range" min="100" max="1920" value={el.width || 600} onChange={e => updateElement(el.id, { width: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ketebalan Garis ({el.lineWidth || 4}px)</span>
                        </div>
                        <input type="range" min="1" max="20" value={el.lineWidth || 4} onChange={e => updateElement(el.id, { lineWidth: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Glow/Blur ({el.radius || 20})</span>
                        </div>
                        <input type="range" min="0" max="100" value={el.radius || 20} onChange={e => updateElement(el.id, { radius: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}
                  
                  {el.type === 'rain' && (
                    <>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jumlah Drop ({el.count})</span>
                        </div>
                        <input type="range" min="50" max="1000" value={el.count || 10} onChange={e => updateElement(el.id, { count: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Kecepatan ({el.speed}x)</span>
                        </div>
                        <input type="range" min="0.1" max="5" step="0.1" value={el.speed || 1} onChange={e => updateElement(el.id, { speed: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}
                  {el.type === 'color_pixel' && (
                    <>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Blur ({el.radius || 15})</span>
                        </div>
                        <input type="range" min="0" max="100" value={el.radius || 15} onChange={e => updateElement(el.id, { radius: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Amount ({el.density || 70})</span>
                        </div>
                        <input type="range" min="10" max="200" value={el.density || 70} onChange={e => updateElement(el.id, { density: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Size ({el.lineWidth || 11})</span>
                        </div>
                        <input type="range" min="1" max="50" value={el.lineWidth || 11} onChange={e => updateElement(el.id, { lineWidth: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                      <label className="block">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Speed ({el.speed || 31})</span>
                        </div>
                        <input type="range" min="1" max="100" value={el.speed || 31} onChange={e => updateElement(el.id, { speed: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>
                    </>
                  )}
                  
                  {el.type === 'multi_sine' && (
                    <label className="block">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">Jumlah Gelombang ({el.lines})</span>
                      </div>
                      <input type="range" min="1" max="10" value={el.lines || 1} onChange={e => updateElement(el.id, { lines: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                    </label>
                  )}
                </div>
                )}
              </div>
            );
          })() : (
            <div className="p-6 space-y-6">
              <AnalyticsDashboard 
                getAudioData={getAudioData}
                getWaveformData={getWaveformData}
                isPlaying={isPlaying || isRecording}
              />
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mt-auto">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Project Info</h3>
                <p className="text-xs text-gray-500 mb-1.5">Name: <span className="text-gray-300 font-medium">{project.name}</span></p>
                <p className="text-xs text-gray-500 mb-1.5">Elements: <span className="text-gray-300 font-medium">{project.elements.length}</span></p>
                <p className="text-xs text-gray-500">Last updated: <span className="text-gray-300 font-medium">{new Date(project.updatedAt).toLocaleTimeString()}</span></p>
              </div>
            </div>
          )}
        </aside>
      </div>
      
      {/* Bottom Footer */}
      <footer className="h-8 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span className="text-[#d49953] text-[11px] font-medium font-mono tracking-wide">
            Tersimpan otomatis pada <span className="text-[#3b82f6]">{new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.')}</span>
          </span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#d49953] text-[11px] font-bold">L</span>
              <div className="w-24 h-1.5 bg-[#1a1a1a] border border-[#333] rounded-full overflow-hidden flex items-center">
                <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${meters.l * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#d49953] text-[11px] font-bold">R</span>
              <div className="w-24 h-1.5 bg-[#1a1a1a] border border-[#333] rounded-full overflow-hidden flex items-center">
                <div className="h-full bg-emerald-500 transition-all duration-75" style={{ width: `${meters.r * 100}%` }} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <Settings size={13} className="text-[#3b82f6]" />
              <span className="text-[#d49953] text-[11px] font-mono font-medium">{fps} FPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database size={13} className="text-[#a855f7]" />
              <span className="text-[#d49953] text-[11px] font-mono font-medium">RAM: {(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 4} MB</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
