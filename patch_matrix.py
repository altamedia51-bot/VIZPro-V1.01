import re

with open('src/components/CanvasRenderer.tsx', 'r') as f:
    content = f.read()

old_dim = """                 mCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                 mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);"""

new_dim = """                 mCtx.globalCompositeOperation = 'destination-out';
                 mCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                 mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
                 mCtx.globalCompositeOperation = 'source-over';"""

content = content.replace(old_dim, new_dim)

old_draw = """                 ctx.drawImage(mCanvas, -canvas.width/2, -canvas.height/2);"""
new_draw = """                 // Draw relative to el.x and el.y so it centers on the element position
                 ctx.drawImage(mCanvas, el.x - mCanvas.width/2, el.y - mCanvas.height/2);"""

content = content.replace(old_draw, new_draw)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.write(content)

print("Done")
