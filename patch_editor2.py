with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'colorful_words', fontFamily: 'Caveat' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="font-bold text-xs flex gap-[1px]">
                              <span style={{color: '#FFB3C6'}}>C</span>
                              <span style={{color: '#FFD166'}}>O</span>
                              <span style={{color: '#A0C4FF'}}>L</span>
                              <span style={{color: '#FF9F1C'}}>O</span>
                              <span style={{color: '#FFB3C6'}}>R</span>
                              <span style={{color: '#FFD166'}}>S</span>
                            </span>
                          </button>"""

new_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'colorful_words', fontFamily: 'Caveat' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
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
                          </button>"""

content = content.replace(old_btn, new_btn)

# Add fonts to the dropdown
old_fonts = """                                <option value="Caveat">Caveat (Handwriting)</option>
                                <option value="Kalam">Kalam (Handwriting)</option>
                                <option value="Dancing Script">Dancing Script</option>"""

new_fonts = """                                <option value="Caveat">Caveat (Handwriting)</option>
                                <option value="Caveat Brush">Caveat Brush</option>
                                <option value="Permanent Marker">Permanent Marker</option>
                                <option value="Kalam">Kalam (Handwriting)</option>
                                <option value="Dancing Script">Dancing Script</option>"""
content = content.replace(old_fonts, new_fonts)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
