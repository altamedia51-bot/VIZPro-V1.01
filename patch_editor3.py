with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'brush_stroke', fontFamily: 'Caveat Brush', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Caveat Brush', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>BRUSH</span>
                          </button>"""

new_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'brush_stroke', fontFamily: 'Caveat Brush', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Caveat Brush', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>BRUSH</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'vintage_brush', fontFamily: 'Rock Salt', color: '#ffffff', rotation: -5 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Rock Salt', textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>VINTAGE</span>
                          </button>"""

content = content.replace(old_btn, new_btn)

# Add fonts to the dropdown
old_fonts = """                                <option value="Caveat Brush">Caveat Brush</option>
                                <option value="Permanent Marker">Permanent Marker</option>"""

new_fonts = """                                <option value="Caveat Brush">Caveat Brush</option>
                                <option value="Permanent Marker">Permanent Marker</option>
                                <option value="Rock Salt">Rock Salt</option>
                                <option value="Sedgwick Ave">Sedgwick Ave</option>
                                <option value="Kaushan Script">Kaushan Script</option>"""

content = content.replace(old_fonts, new_fonts)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
