import re

with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

target = """                          <div>
                            <label className="block text-[10px] text-gray-400 mb-2">Warna & Gradient Teks</label>
                            <div className="flex items-center gap-3">
                              <input type="color" value={el.color || '#ffffff'} onChange={e => updateElement(el.id, { color: e.target.value })} className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent" />
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={el.useGradient || false} onChange={e => updateElement(el.id, { useGradient: e.target.checked })} className="rounded bg-[#1A1A1A] border-white/10 text-blue-500 focus:ring-blue-500" />
                                <span className="text-xs text-gray-300">Gunakan Gradient Teks</span>
                              </label>
                            </div>
                          </div>"""

replace = """                          <div>
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
                          </div>"""

content = content.replace(target, replace)
with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
