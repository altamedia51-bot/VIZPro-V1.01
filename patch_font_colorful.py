with open('src/components/Editor.tsx', 'r') as f:
    content = f.read()

content = content.replace("templateStyle: 'colorful_words'", "templateStyle: 'colorful_words', fontFamily: 'Caveat'")

with open('src/components/Editor.tsx', 'w') as f:
    f.write(content)
