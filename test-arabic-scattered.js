import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const targetStr = `                  const words = line.split(' ');
                  const totalWords = words.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));`;

const replaceStr = `                  const words = line.split(' ');
                  
                  // Deteksi bahasa Arab (RTL)
                  const isArabic = /[\\u0600-\\u06FF\\u0750-\\u077F]/.test(line);
                  
                  // Jika Arab, kata pertama (index 0) dibaca dari kanan, jadi urutannya harus dibalik
                  // saat perulangan agar timing progresnya sesuai dengan urutan baca RTL.
                  const displayWords = isArabic ? [...words].reverse() : words;
                  
                  const totalWords = displayWords.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));`;

const loopTarget = `                  words.forEach((word, wIdx) => {
                      const isActive = (wIdx === activeWordIndex);`;

const loopReplace = `                  displayWords.forEach((word, wIdx) => {
                      // Jika Arab, index aktif harus dibalik karena progres 0 berjalan dari kiri ke kanan 
                      // dalam waktu, tapi kata Arab dibaca dari kanan ke kiri.
                      const visualIndex = isArabic ? (totalWords - 1 - wIdx) : wIdx;
                      const currentActiveIdx = isArabic ? (totalWords - 1 - activeWordIndex) : activeWordIndex;
                      
                      const isActive = (wIdx === currentActiveIdx);`;

if (code.includes(targetStr) && code.includes(loopTarget)) {
    code = code.replace(targetStr, replaceStr).replace(loopTarget, loopReplace);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Arabic support patched for Scattered");
} else {
    console.log("Failed to patch Arabic support");
}
