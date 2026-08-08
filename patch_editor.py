with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'architect', fontFamily: 'Architects Daughter', color: '#000000', rotation: 0 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs uppercase" style={{fontFamily: 'Architects Daughter', textShadow: '1px 1px 0px rgba(0,0,0,0.5)'}}>ARCHITECT</span>
                          </button>"""

new_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'architect', fontFamily: 'Architects Daughter', color: '#000000', rotation: 0 })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs uppercase" style={{fontFamily: 'Architects Daughter', textShadow: '1px 1px 0px rgba(0,0,0,0.5)'}}>ARCHITECT</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'jhun_brush', fontFamily: 'Sedgwick Ave Display', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{fontFamily: 'Sedgwick Ave Display', textShadow: '2px 2px 0px #000000'}}>JHUN BRUSH</span>
                          </button>"""

content = content.replace(old_btn, new_btn)

# Add font to dropdown
old_fonts = """                                <option value="Sedgwick Ave">Sedgwick Ave</option>"""

new_fonts = """                                <option value="Sedgwick Ave">Sedgwick Ave</option>
                                <option value="Sedgwick Ave Display">Sedgwick Ave Display</option>"""
content = content.replace(old_fonts, new_fonts)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
