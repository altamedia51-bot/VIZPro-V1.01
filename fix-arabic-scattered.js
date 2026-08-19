import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

// I need to adjust the logic. 
// When reading Arabic, the user expects the FIRST word they hear (index 0) to be the RIGHT-MOST word.
// The displayWords logic in my previous script was okay conceptually, but let's make it simpler.

const targetStr = `                  const words = line.split(' ');
                  
                  // Deteksi bahasa Arab (RTL)
                  const isArabic = /[\\u0600-\\u06FF\\u0750-\\u077F]/.test(line);
                  
                  // Jika Arab, kata pertama (index 0) dibaca dari kanan, jadi urutannya harus dibalik
                  // saat perulangan agar timing progresnya sesuai dengan urutan baca RTL.
                  const displayWords = isArabic ? [...words].reverse() : words;
                  
                  const totalWords = displayWords.length;
                  const activeWordIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  const wordLineHeight = el.fontSize * 0.9; 
                  const groupStartY = lineY - ((totalWords - 1) * wordLineHeight) / 2;
                  
                  ctx.textAlign = 'center';
                  
                  displayWords.forEach((word, wIdx) => {
                      // Jika Arab, index aktif harus dibalik karena progres 0 berjalan dari kiri ke kanan 
                      // dalam waktu, tapi kata Arab dibaca dari kanan ke kiri.
                      const visualIndex = isArabic ? (totalWords - 1 - wIdx) : wIdx;
                      const currentActiveIdx = isArabic ? (totalWords - 1 - activeWordIndex) : activeWordIndex;
                      
                      const isActive = (wIdx === currentActiveIdx);`;

const replaceStr = `                  const words = line.split(' ');
                  const totalWords = words.length;
                  
                  // Deteksi teks Arab
                  const isArabic = /[\\u0600-\\u06FF\\u0750-\\u077F]/.test(line);
                  
                  // Progres audio berjalan dari 0 ke 1 (dari kata pertama diucapkan ke kata terakhir)
                  // Jadi index aktif menurut urutan audio adalah:
                  const activeAudioIndex = Math.min(totalWords - 1, Math.floor(progress * totalWords));
                  
                  // Untuk bahasa Arab (RTL), kata-kata biasanya ditulis dari Kanan ke Kiri.
                  // Misalnya kata "Satu Dua" dalam bahasa Arab (wahid itsnain). 
                  // Kata "Wahid" ditulis di posisi kanan, "Itsnain" di posisi kiri.
                  // Jika kita render dari index 0 ke 1, posisi X-nya harus disesuaikan.
                  
                  const wordLineHeight = el.fontSize * 0.9; 
                  const groupStartY = lineY - ((totalWords - 1) * wordLineHeight) / 2;
                  
                  ctx.textAlign = 'center';
                  
                  words.forEach((word, audioIdx) => {
                      // Apakah kata ini yang sedang aktif diucapkan?
                      const isActive = (audioIdx === activeAudioIndex);
                      
                      // Untuk mengatur layout (ZIGZAG / STAGGERED)
                      let staggerX = 0;
                      // Posisi visual Y (dari atas ke bawah)
                      const wY = groupStartY + audioIdx * wordLineHeight;
                      
                      // Jika Arab, posisinya kita balik agar menyebar dari Kanan ke Kiri
                      // Namun karena ini format scattered (acak), kita cukup pastikan zigzagnya terasa alami.
                      // Mari gunakan index visual (visualIdx) untuk menentukan posisi kiri/kanannya.
                      // Untuk teks latin (kiri->kanan): kata 0 di kiri, kata 1 di kanan.
                      // Untuk arab (kanan->kiri): kata 0 di kanan, kata 1 di kiri.
                      const isRightSided = isArabic ? (audioIdx % 2 === 0) : (audioIdx % 2 !== 0);
                      
                      if (totalWords === 3) {
                          if (audioIdx === 0) staggerX = isArabic ? el.fontSize * 1.2 : el.fontSize * 1.2; 
                          // Kita abaikan isArabic sementara untuk 3 kata karena logic zigzag nya custom
                          if (audioIdx === 0) staggerX = el.fontSize * 1.2;
                          else if (audioIdx === 1) staggerX = 0;
                          else staggerX = -el.fontSize * 1.2;
                      } else if (totalWords === 4) {
                          if (audioIdx === 0) staggerX = -el.fontSize * 0.8;
                          else if (audioIdx === 1) staggerX = el.fontSize * 0.8;
                          else if (audioIdx === 2) staggerX = -el.fontSize * 0.6;
                          else staggerX = 0;
                      } else {
                          staggerX = isRightSided ? el.fontSize * 0.8 : -el.fontSize * 0.8;
                      }
                      
                      if (isActive) staggerX *= 0.3; // Tarik sedikit ke tengah saat aktif`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    
    // Fix the wordProgress line which now uses audioIdx instead of wIdx
    code = code.replace(`const wordProgress = (progress * totalWords) - wIdx;`, `const wordProgress = (progress * totalWords) - audioIdx;`);
    
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Scattered Arab logic fixed");
} else {
    // maybe first patch hasn't run yet?
}
