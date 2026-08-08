import re
with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

# 1. newEl.templateStyle = 'hanging'; -> newEl.isHanging = true;
content = content.replace("newEl.templateStyle = 'hanging';", "newEl.isHanging = true;")

# 2. HANGING button
old_hanging_btn = """                          <button onClick={() => updateElement(el.id, { templateStyle: 'hanging', color: '#fff4e6' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs">HANGING</span>
                          </button>"""
new_hanging_btn = """                          <button onClick={() => updateElement(el.id, { isHanging: !el.isHanging })} className={`p-3 bg-[#1A1A1A] border ${el.isHanging ? 'border-blue-500' : 'border-white/5 hover:border-blue-500'} rounded flex items-center justify-center min-h-[60px]`}>
                            <span className="text-white font-bold text-xs">HANGING</span>
                          </button>"""
content = content.replace(old_hanging_btn, new_hanging_btn)

# 3. el.templateStyle === 'hanging'
content = content.replace("el.templateStyle === 'hanging'", "el.isHanging")

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
