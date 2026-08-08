with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

old_templates = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'default', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold">DEFAULT</span>
                          </button>"""

new_templates = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'default', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold">DEFAULT</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'layered_outline', color: '#E87D2A' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill', filter: 'drop-shadow(4px 4px 0px #E87D2A)' }}>RETRO</span>
                          </button>"""

content = content.replace(old_templates, new_templates)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
