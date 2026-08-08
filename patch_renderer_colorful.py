with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_block = "} else if (el.templateStyle === 'tiktok_pop' || el.templateStyle === 'tiktok_shadow') {"

new_block = """} else if (el.templateStyle === 'colorful_words') {
                  const palette = ['#FFB3C6', '#FFD166', '#A0C4FF', '#FF9F1C'];
                  
                  ctx.textAlign = 'left';
                  const words = line.split(' ');
                  
                  // Calculate total line width by simulating with spaces
                  let totalWidth = 0;
                  words.forEach((word, idx) => {
                     totalWidth += ctx.measureText(word).width;
                     if (idx < words.length - 1) {
                         totalWidth += ctx.measureText(' ').width;
                     }
                  });
                  
                  let currentX = -totalWidth / 2;
                  
                  words.forEach((word, wordIdx) => {
                     // Determine global word index based on all previous lines? 
                     // The problem is we don't have global word index easily here.
                     // But we can just use wordIdx per line, or maybe compute a rough global index
                     // For simplicity, we just use wordIdx % palette.length
                     // To make it continuous, let's calculate a global offset up to this line
                     let wordsBeforeThisLine = 0;
                     for (let pastLine = 0; pastLine < i; pastLine++) {
                         wordsBeforeThisLine += lines[pastLine].split(' ').length;
                     }
                     const globalIdx = wordsBeforeThisLine + wordIdx;
                     
                     ctx.fillStyle = palette[globalIdx % palette.length];
                     ctx.fillText(word, currentX, lineY);
                     currentX += ctx.measureText(word).width;
                     if (wordIdx < words.length - 1) {
                         currentX += ctx.measureText(' ').width;
                     }
                  });
                  ctx.textAlign = 'center'; // Restore
                } else if (el.templateStyle === 'tiktok_pop' || el.templateStyle === 'tiktok_shadow') {"""

content = content.replace(old_block, new_block)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)
