import fs from 'fs';
let code = fs.readFileSync('src/store.ts', 'utf8'); // or wherever state is saved
// I won't bother modifying the state unless needed. It shouldn't crash.
