with open('src/components/CanvasRenderer.tsx', 'r') as f:
    lines = f.readlines()

out = []
skip = False
for i, line in enumerate(lines):
    if "} else if ((el as any).isHanging) {" in line and "const textColor = el.color || '#FFFFFF';" in lines[i+1]:
        skip = True
        out.append("                } else if ((el as any).isHanging && (!el.templateStyle || el.templateStyle === 'default')) {\n")
        out.append("                  const textColor = el.color || '#FFFFFF';\n")
        out.append("                  const extrudeDepth = Math.max(4, Math.floor(el.fontSize * 0.12));\n")
        out.append("                  let r = 200, g = 200, b = 200;\n")
        out.append("                  if (textColor.startsWith('#') && textColor.length === 7) {\n")
        out.append("                    r = parseInt(textColor.slice(1,3), 16);\n")
        out.append("                    g = parseInt(textColor.slice(3,5), 16);\n")
        out.append("                    b = parseInt(textColor.slice(5,7), 16);\n")
        out.append("                  }\n")
        out.append("                  const extrudeColor = `rgb(${Math.floor(r*0.6)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.6)})`;\n")
        out.append("                  ctx.save();\n")
        out.append("                  for(let j = extrudeDepth; j >= 1; j--) {\n")
        out.append("                      ctx.fillStyle = extrudeColor;\n")
        out.append("                      if (j === extrudeDepth) {\n")
        out.append("                         ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';\n")
        out.append("                         ctx.shadowBlur = 12;\n")
        out.append("                         ctx.shadowOffsetX = 4;\n")
        out.append("                         ctx.shadowOffsetY = 8;\n")
        out.append("                      } else {\n")
        out.append("                         ctx.shadowBlur = 0;\n")
        out.append("                         ctx.shadowOffsetX = 0;\n")
        out.append("                         ctx.shadowOffsetY = 0;\n")
        out.append("                      }\n")
        out.append("                      ctx.fillText(line, 0, lineY + j);\n")
        out.append("                  }\n")
        out.append("                  ctx.shadowBlur = 0;\n")
        out.append("                  ctx.shadowOffsetX = 0;\n")
        out.append("                  ctx.shadowOffsetY = 0;\n")
        out.append("                  const lineWidth = ctx.measureText(line).width;\n")
        out.append("                  ctx.fillStyle = el.useGradient ? getStyle(el, -lineWidth/2, lineY, lineWidth/2, lineY) : textColor;\n")
        out.append("                  ctx.fillText(line, 0, lineY);\n")
        out.append("                  ctx.restore();\n")
        continue
    
    if skip:
        if "ctx.restore();" in line and "ctx.fillText(line, 0, lineY);" in lines[i-1]:
            skip = False
        continue
        
    out.append(line)

with open('src/components/CanvasRenderer.tsx', 'w') as f:
    f.writelines(out)

