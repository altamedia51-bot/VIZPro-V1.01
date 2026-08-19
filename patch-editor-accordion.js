import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

if(!code.includes('const [openTemplateAccordion, setOpenTemplateAccordion]')) {
    code = code.replace(
        `const [subtitleTab, setSubtitleTab] = useState<'basic' | 'templates'>('templates');`,
        `const [subtitleTab, setSubtitleTab] = useState<'basic' | 'templates'>('templates');\n  const [openTemplateAccordion, setOpenTemplateAccordion] = useState<string>('style_dasar');`
    );
}

const targetStr = `{subtitleTab === 'templates' && (
                      <div className="space-y-4">
                        
                        <div className="space-y-2">
                           <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Style Dasar</h3>
                           <div className="grid grid-cols-2 gap-2">`;

const replaceStr = `{subtitleTab === 'templates' && (
                      <div className="space-y-0">
                        
                        {/* STYLE DASAR ACCORDION */}
                        <div className="pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'style_dasar' ? '' : 'style_dasar')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> STYLE DASAR
                             </h3>
                             <ChevronDown size={14} className={\`text-gray-500 mb-4 transition-transform \${openTemplateAccordion === 'style_dasar' ? 'rotate-180' : ''}\`} />
                           </button>
                           {openTemplateAccordion === 'style_dasar' && (
                           <div className="grid grid-cols-2 gap-2">`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
}

const targetStr2 = `</div>
                        </div>

                        <div className="space-y-2">
                           <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Glowing & Neon</h3>
                           <div className="grid grid-cols-2 gap-2">`;

const replaceStr2 = `</div>
                           )}
                        </div>

                        {/* GLOWING & NEON ACCORDION */}
                        <div className="pt-4 border-t border-white/5 pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'glowing' ? '' : 'glowing')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> GLOWING & NEON
                             </h3>
                             <ChevronDown size={14} className={\`text-gray-500 mb-4 transition-transform \${openTemplateAccordion === 'glowing' ? 'rotate-180' : ''}\`} />
                           </button>
                           {openTemplateAccordion === 'glowing' && (
                           <div className="grid grid-cols-2 gap-2">`;

if(code.includes(targetStr2)) {
    code = code.replace(targetStr2, replaceStr2);
}

const targetStr3 = `</div>
                        </div>

                        <div className="space-y-2">
                           <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Animasi Karaoke & Pop-Up</h3>
                           <div className="grid grid-cols-2 gap-2">`;

const replaceStr3 = `</div>
                           )}
                        </div>

                        {/* ANIMASI ACCORDION */}
                        <div className="pt-4 border-t border-white/5 pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'animasi' ? '' : 'animasi')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> ANIMASI KARAOKE & POP-UP
                             </h3>
                             <ChevronDown size={14} className={\`text-gray-500 mb-4 transition-transform \${openTemplateAccordion === 'animasi' ? 'rotate-180' : ''}\`} />
                           </button>
                           {openTemplateAccordion === 'animasi' && (
                           <div className="grid grid-cols-2 gap-2">`;

if(code.includes(targetStr3)) {
    code = code.replace(targetStr3, replaceStr3);
}

const targetStr4 = `</button>
                           </div>
                        </div>

                        {/* Hidden Original Buttons just to prevent compile error in our replace logic */}
                        <div className="hidden">`;

const replaceStr4 = `</button>
                           </div>
                           )}
                        </div>

                        {/* OTHERS ACCORDION */}
                        <div className="pt-4 border-t border-white/5 pb-4">
                           <button onClick={() => setOpenTemplateAccordion(openTemplateAccordion === 'others' ? '' : 'others')} className="w-full flex items-center justify-between group outline-none">
                             <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold flex items-center gap-2 mb-4 group-hover:text-gray-300 transition-colors">
                               <Settings size={12} /> KUAS, VINTAGE, & LAINNYA
                             </h3>
                             <ChevronDown size={14} className={\`text-gray-500 mb-4 transition-transform \${openTemplateAccordion === 'others' ? 'rotate-180' : ''}\`} />
                           </button>
                           {openTemplateAccordion === 'others' && (
                           <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => updateElement(el.id, { templateStyle: 'colorful_words', fontFamily: 'Caveat' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="font-bold text-xs flex gap-[1px]">
                                 <span style={{color: '#FFB3C6'}}>C</span><span style={{color: '#FFD166'}}>O</span><span style={{color: '#A0C4FF'}}>L</span><span style={{color: '#FF9F1C'}}>O</span><span style={{color: '#FFB3C6'}}>R</span><span style={{color: '#FFD166'}}>S</span>
                               </span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'brush_stroke', fontFamily: 'Caveat Brush', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-xs" style={{fontFamily: 'Caveat Brush', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>Brush</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'vintage_brush', fontFamily: 'Rock Salt', color: '#ffffff', rotation: -5 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{fontFamily: 'Rock Salt', textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>Vintage</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'street_dripping', fontFamily: 'Creepster', color: '#ffffff', useGradient: false, rotation: 0 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16 overflow-hidden">
                               <span className="font-bold text-[10px]" style={{fontFamily: 'Creepster', color: '#ffffff', textShadow: '3px 3px 0px #ff0000'}}>Street Drip</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'architect', fontFamily: 'Architects Daughter', color: '#000000', rotation: 0 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px] uppercase" style={{fontFamily: 'Architects Daughter', textShadow: '1px 1px 0px rgba(0,0,0,0.5)'}}>Architect</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'jhun_brush', fontFamily: 'Sedgwick Ave Display', color: '#ffffff' })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-[10px]" style={{fontFamily: 'Sedgwick Ave Display', textShadow: '2px 2px 0px #000000'}}>Jhun Brush</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { templateStyle: 'pen_story', fontFamily: 'Shadows Into Light', color: '#000000', rotation: -2 })} className="p-2 bg-[#1A1A1A] border border-white/5 hover:border-blue-500 rounded flex items-center justify-center h-16">
                               <span className="text-white font-bold text-sm" style={{fontFamily: 'Shadows Into Light', textShadow: '1px 1px 0px rgba(0,0,0,0.2)'}}>Pen Story</span>
                             </button>
                             <button onClick={() => updateElement(el.id, { isHanging: !(el as any).isHanging })} className={\`p-2 bg-[#1A1A1A] border \${(el as any).isHanging ? 'border-blue-500' : 'border-white/5 hover:border-blue-500'} rounded flex items-center justify-center h-16\`}>
                               <span className="text-white font-bold text-[10px]">Tali Gantung</span>
                             </button>
                           </div>
                           )}
                        </div>

                        {/* Hidden Original Buttons just to prevent compile error in our replace logic */}
                        <div className="hidden">`;

if(code.includes(targetStr4)) {
    code = code.replace(targetStr4, replaceStr4);
}

fs.writeFileSync('src/components/Editor.tsx', code);
console.log("Accordion logic patched");
