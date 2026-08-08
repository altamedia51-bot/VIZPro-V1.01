with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

# 1. Change category of hanging_text from 'waves' to 'elements'
content = content.replace("{ type: 'hanging_text' as any, name: 'Hanging Text', category: 'waves', label: 'TEXT' },", "{ type: 'hanging_text' as any, name: 'Hanging Text', category: 'elements', label: 'TEXT' },")

# 2. Remove the HANGING button from text templates
old_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_karaoke', color: '#00ff00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>KARAOKE</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { isHanging: !(el as any).isHanging })} className={`p-3 bg-[#1A1A1A] border ${(el as any).isHanging ? 'border-blue-500' : 'border-white/5 hover:border-blue-500'} rounded flex items-center justify-center min-h-[60px]`}>
                            <span className="text-white font-bold text-xs">HANGING</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_shadow', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">"""

new_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_karaoke', color: '#00ff00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>KARAOKE</span>
                          </button>
                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_shadow', color: '#ffffff' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">"""
content = content.replace(old_btn, new_btn)

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
