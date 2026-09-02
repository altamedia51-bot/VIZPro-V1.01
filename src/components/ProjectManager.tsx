import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { db } from '../lib/db';
import { Plus, FolderOpen, Clock, Play } from 'lucide-react';

interface ProjectManagerProps {
  onSelectProject: (project: Project) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    db.getProjects().then(setProjects);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elements: [],
      backgroundConfig: { type: 'image', value: '/neon_wave_terrain.jpg' }
    };

    await db.saveProject(newProject);
    onSelectProject(newProject);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await db.deleteProject(id);
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-[#0D0D10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Create New */}
        <div className="flex-1 p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-b md:border-b-0 md:border-r border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-black text-white italic text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">VIZ <span className="text-indigo-400 font-light italic">PRO</span></h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Audio Visualizer</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-2">
                New Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Synthwave Beat"
                className="w-full bg-[#121216] border border-white/10 text-white rounded-lg px-4 py-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-600 text-sm"
                autoFocus
                maxLength={40}
              />
            </div>
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Plus size={18} />
              Create & Open
            </button>
          </form>
        </div>

        {/* Right Side: Recent Projects */}
        <div className="flex-1 p-8 bg-[#0D0D10] flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-gray-300">
            <FolderOpen size={18} />
            <h2 className="text-sm font-semibold">Recent Projects</h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] -mx-2 px-2 space-y-2">
            {projects.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                <FolderOpen size={32} className="opacity-30" />
                <p className="text-xs text-center text-gray-500">No recent projects.<br/>Create one to get started.</p>
              </div>
            ) : (
              projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 rounded-xl p-4 transition-all group flex items-start justify-between"
                >
                  <div>
                    <h3 className="font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors text-sm">{project.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-wider">
                      <Clock size={10} />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete project"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
