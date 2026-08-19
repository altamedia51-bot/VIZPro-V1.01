import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const targetStr = `{subtitleTab === 'templates' && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] text-gray-500 uppercase font-bold">Text Templates</h3>
                        <div className="grid grid-cols-2 gap-2">`;

const replaceStr = `{subtitleTab === 'templates' && (
                      <div className="space-y-4">
                        
                        <div className="space-y-2">
                           <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Style Dasar</h3>
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'default', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex flex-col items-center justify-center h-16">
                               <span className="text-white font-bold text-xs">Default</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'retro', color: '#E87D2A' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex flex-col items-center justify-center h-16">
                               <span className="text-white font-bold text-xs" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill', filter: 'drop-shadow(4px 4px 0px #E87D2A)' }}>Retro</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'calli', color: '#015B28' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#015B28] font-bold text-xs" style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill', filter: 'drop-shadow(3px 3px 0px #013B18)' }}>Calli</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'bubble_yellow', color: '#000000' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="bg-[#FFD700] text-black px-2 py-0.5 rounded font-bold text-[10px]">Bubble Yellow</span>
                             </button>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Glowing & Neon</h3>
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'neon', color: '#00ffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '0 0 10px #00ffff'}}>Neon Blue</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'glow_border', color: '#ff00ff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="font-bold text-[10px]" style={{WebkitTextStroke: '1px #ff00ff', color: 'transparent', textShadow: '0 0 5px #ff00ff'}}>Glow Border</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'black_fire', fontFamily: 'Permanent Marker', color: '#ff6600', useGradient: true, color2: '#ffcc00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16 overflow-hidden">
                               <span className="font-bold text-[10px]" style={{fontFamily: 'Permanent Marker', color: '#ff6600', textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>Black Fire</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_shadow', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '-2px 0px 0px #00ffff, 2px 0px 0px #ff0050'}}>Glitch / TikTok</span>
                             </button>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Animasi Karaoke & Pop-Up</h3>
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_pop', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex flex-col items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '2px 2px 0px #000000'}}>Pop-Up Masuk</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_karaoke', color: '#00ff00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{textShadow: '2px 2px 0px #000000'}}>Green Karaoke</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'highlight_pop', color: '#FFFF00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#FFFF00] font-black text-[10px] italic" style={{textShadow: '2px 2px 0px #000000', WebkitTextStroke: '0.5px black'}}>Highlight Pop</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'popup_words', color: '#ffcc00' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#ffcc00] font-bold text-[10px]" style={{textShadow: '1px 1px 0px #000', transform: 'scale(1.1)'}}>Pop-Up Arab</span>
                             </button>
                           </div>
                        </div>

                        {/* Hidden Original Buttons just to prevent compile error in our replace logic */}
                        <div className="hidden">`;

const idxEnd = code.indexOf(`</div>\n                      </div>\n                    )}`);
const before = code.substring(0, code.indexOf(targetStr));
const middle = code.substring(code.indexOf(targetStr), idxEnd);
const after = code.substring(idxEnd);

const finalCode = before + middle.replace(targetStr, replaceStr) + "\n</div>" + after;

fs.writeFileSync('src/components/Editor.tsx', finalCode);
console.log("Dropdown categorized patched");
