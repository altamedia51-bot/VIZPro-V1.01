with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_templates = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'bubble_black', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="bg-black text-white border border-white px-2 py-1 rounded font-bold text-xs">BLACK</span>
                          </button>"""

new_templates = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'bubble_black', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="bg-black text-white border border-white px-2 py-1 rounded font-bold text-xs">BLACK</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'background_box', color: '#ffffff', backgroundColor: '#000000', backgroundOpacity: 0.5 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="bg-black/50 text-white px-2 py-1 rounded font-bold text-[10px]">BOX BG</span>
                          </button>"""

content = content.replace(old_templates, new_templates)

old_basic_start = """                    {subtitleTab === 'templates' && ("""

new_basic_start = """                    {subtitleTab === 'basic' && (
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
                    {subtitleTab === 'templates' && ("""

content = content.replace(old_basic_start, new_basic_start)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
