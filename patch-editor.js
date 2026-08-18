import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const target1 = `                          <button onClick={() => updateElement(el.id, { templateStyle: 'layered_outline', color: '#E87D2A' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-white font-bold text-xs" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill', filter: 'drop-shadow(4px 4px 0px #E87D2A)' }}>RETRO</span>
                          </button>`;

const replacement1 = target1 + `\n                          <button onClick={() => updateElement(el.id, { templateStyle: 'calli', color: '#015B28' })} className="p-3 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center min-h-[60px]">
                            <span className="text-[#015B28] font-bold text-xs" style={{ WebkitTextStroke: '1px white', paintOrder: 'stroke fill', filter: 'drop-shadow(3px 3px 0px #013B18)' }}>CALLI</span>
                          </button>`;

if(code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Editor patched");
} else {
    console.log("Editor target not found");
}

