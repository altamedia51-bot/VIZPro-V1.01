import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const targetStr = `<button onClick={() => updateElement(el.id, { templateStyle: 'scattered', color: '#E31B1B', fontFamily: 'Georgia' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-[#E31B1B] font-bold text-[10px] text-center leading-tight" style={{fontFamily: 'Georgia', textShadow: '1px 1px 0px #FFF'}}>Scattered<br/>Pop</span>
                             </button>`;

const replaceStr = targetStr + `
                             <button onClick={() => updateElement(el.id, { templateStyle: 'arabic_cascade', color: '#E31B1B' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px] text-center leading-tight">Arabic<br/>Cascade</span>
                             </button>`;

if (code.includes(targetStr) && !code.includes('arabic_cascade')) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Editor patched for Arabic Cascade");
}
