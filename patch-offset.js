import fs from 'fs';

// 1. PATCH types.ts
let typesCode = fs.readFileSync('src/types.ts', 'utf8');
if (!typesCode.includes('waveformOffset?: number;')) {
    typesCode = typesCode.replace('trackColor?: string;', 'trackColor?: string;\n  waveformOffset?: number;');
    fs.writeFileSync('src/types.ts', typesCode);
    console.log("types.ts patched");
}

// 2. PATCH Editor.tsx
let editorCode = fs.readFileSync('src/components/Editor.tsx', 'utf8');
if (!editorCode.includes('newEl.waveformOffset = 10;')) {
    editorCode = editorCode.replace('newEl.glowIntensity = 15;', 'newEl.glowIntensity = 15;\n      newEl.waveformOffset = 10;');
}
if (!editorCode.includes('Jarak Waveform ke Bar')) {
    const editorTarget = `<label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ketebalan Garis Jalur`;
    const editorReplace = `<label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Jarak Waveform ke Bar ({el.waveformOffset || 0}px)</span>
                        </div>
                        <input type="range" min="0" max="200" value={el.waveformOffset || 0} onChange={e => updateElement(el.id, { waveformOffset: Number(e.target.value) })} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </label>

                      <label className="block mt-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Ketebalan Garis Jalur`;
    editorCode = editorCode.replace(editorTarget, editorReplace);
    fs.writeFileSync('src/components/Editor.tsx', editorCode);
    console.log("Editor.tsx patched");
}

// 3. PATCH CanvasRenderer.tsx
let rendererCode = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');
if (!rendererCode.includes('const wOffset = pViz.waveformOffset || 0;')) {
    rendererCode = rendererCode.replace(
        "const trackColor = pViz.trackColor || 'rgba(255, 255, 255, 0.2)';",
        "const trackColor = pViz.trackColor || 'rgba(255, 255, 255, 0.2)';\n             const wOffset = pViz.waveformOffset || 0;"
    );
    
    // bars
    rendererCode = rendererCode.replace(
        "const by = -trackHeight / 2;",
        "const by = -trackHeight / 2 - wOffset;"
    );
    
    // segmented
    rendererCode = rendererCode.replace(
        "const by = -trackHeight / 2 - 2 - (s * stepHeight) - segmentHeight;",
        "const by = -trackHeight / 2 - 2 - wOffset - (s * stepHeight) - segmentHeight;"
    );
    
    // mirrored
    rendererCode = rendererCode.replace(
        "ctx.roundRect(bx, -bh / 2, barWidth, bh, barWidth / 2);",
        "ctx.roundRect(bx, -bh / 2 - wOffset, barWidth, bh, barWidth / 2);"
    );
    
    // dots
    rendererCode = rendererCode.replace(
        "const dy = -trackHeight / 2 - 4 - l * (dotSize * 1.6);",
        "const dy = -trackHeight / 2 - 4 - wOffset - l * (dotSize * 1.6);"
    );
    
    // wave points
    rendererCode = rendererCode.replace(
        "points.push({ x: bx, y: -trackHeight / 2 - 4 - bh });",
        "points.push({ x: bx, y: -trackHeight / 2 - 4 - wOffset - bh });"
    );
    
    // wave clip rect
    rendererCode = rendererCode.replace(
        "ctx.rect(-width/2 - 10, -maxBarHeight - 50, width * prog + 10, maxBarHeight + 100);",
        "ctx.rect(-width/2 - 10, -maxBarHeight - 50 - wOffset, width * prog + 10, maxBarHeight + 100 + wOffset);"
    );
    
    fs.writeFileSync('src/components/CanvasRenderer.tsx', rendererCode);
    console.log("CanvasRenderer.tsx patched");
}
