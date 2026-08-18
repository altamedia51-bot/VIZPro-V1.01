import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const target = `                          <button onClick={() => updateElement(el.id, { templateStyle: 'tiktok_karaoke', color: '#00ff00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{textShadow: '2px 2px 0px #000000'}}>KARAOKE</span>
                          </button>`;

const replacement = target + `
                          <button onClick={() => updateElement(el.id, { templateStyle: 'popup_words', color: '#ffcc00' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-[#ffcc00] font-bold text-[10px]" style={{textShadow: '1px 1px 0px #000', transform: 'scale(1.1)'}}>POP-UP ARAB</span>
                          </button>`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Editor popup patched");
}
