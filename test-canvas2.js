const h = 100;
const gap = h * 0.08;
const bracketWidth = h * 0.12;
const radiusInner = h/2 + gap;
const angle = Math.PI * 0.3;

const startY = radiusInner * Math.sin(-angle);
console.log("Top Y of bracket:", startY);
console.log("Top Y of pill:", -h/2);
