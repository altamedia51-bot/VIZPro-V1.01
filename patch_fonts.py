with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

content = content.replace('<option value="Dancing Script">Dancing Script</option>', '<option value="Caveat">Caveat (Handwriting)</option>\\n                                <option value="Kalam">Kalam (Handwriting)</option>\\n                                <option value="Dancing Script">Dancing Script</option>')

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
