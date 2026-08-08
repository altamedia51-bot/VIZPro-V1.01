import re
with open('index.html', 'r') as f:
    content = f.read()

# Replace '&family=Dancing+Script' with '&family=Caveat:wght@400;700&family=Kalam:wght@400;700&family=Dancing+Script'
content = content.replace('&family=Dancing+Script', '&family=Caveat:wght@400;700&family=Kalam:wght@400;700&family=Dancing+Script')

with open('index.html', 'w') as f:
    f.write(content)
