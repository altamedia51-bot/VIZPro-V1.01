import fs from 'fs';
let code = fs.readFileSync('src/components/Editor.tsx', 'utf8');

const target = `<button onClick={() => addElement('sticker_text')} className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-center transition-colors text-white font-bold text-sm">
                    + TEKS STIKER 3D
                  </button>`;

if(code.includes(target)) {
    code = code.replace(target, '');
    fs.writeFileSync('src/components/Editor.tsx', code);
    console.log("Button removed");
} else {
    console.log("Target not found!");
}
