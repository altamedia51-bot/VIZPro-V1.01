import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  '| "layered_outline"', 
  '| "layered_outline"\n    | "calli"'
);
code = code.replace(
  '| "brush_stroke"', 
  '| "brush_stroke"\n    | "calli"'
);

fs.writeFileSync('src/types.ts', code);
console.log("Types patched");
