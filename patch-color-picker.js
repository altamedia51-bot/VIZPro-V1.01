import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const target = `                  <label className="block">
                    <span className="text-[10px] text-gray-500 mb-2 block">Warna Utama</span>
                    <input type="color" value={el.color || '#ffffff'} onChange={e => updateElement(el.id, { color: e.target.value })} className="block w-full h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                  </label>`;

const replacement = `                  <div className="block">
                    <span className="text-[10px] text-gray-500 mb-2 block">Warna Utama</span>
                    <div className="flex flex-wrap gap-1">
                      <label className="relative w-6 h-6 rounded flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/50 bg-[#2a2a2a] overflow-hidden">
                        <span className="text-white text-xs font-bold leading-none">+</span>
                        <input 
                          type="color" 
                          value={el.color || '#ffffff'} 
                          onChange={e => updateElement(el.id, { color: e.target.value })} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        />
                      </label>
                      {[
                        '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
                        '#ff00ff', '#00ffff', '#000000', '#808080', '#ffa500', 
                        '#800080', '#008000', '#000080', '#800000', '#008080',
                        '#ffc0cb', '#a52a2a', '#ffd700', '#4b0082', '#ff4500'
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateElement(el.id, { color })}
                          className="w-6 h-6 rounded border border-white/10 hover:border-white/50 transition-colors"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Color picker patched");
} else {
    console.log("Target not found!");
}
