with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_pop', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>POP-UP</span>
                          </button>"""

new_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_pop', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>POP-UP</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'colorful_words' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="font-bold text-xs flex gap-[1px]">
                              <span style={{color: '#FFB3C6'}}>C</span>
                              <span style={{color: '#FFD166'}}>O</span>
                              <span style={{color: '#A0C4FF'}}>L</span>
                              <span style={{color: '#FF9F1C'}}>O</span>
                              <span style={{color: '#FFB3C6'}}>R</span>
                              <span style={{color: '#FFD166'}}>S</span>
                            </span>
                          </button>"""

content = content.replace(old_btn, new_btn)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
