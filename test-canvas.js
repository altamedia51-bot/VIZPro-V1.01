const cx = 200;
const angle = Math.PI * 0.35;
console.log("Right bracket:");
console.log("Top Y (sin(-angle)):", Math.sin(-angle));
console.log("Bottom Y (sin(angle)):", Math.sin(angle));

console.log("Left bracket:");
const topAngle = Math.PI + angle; // 180 + 63 = 243 -> sin is negative -> TOP
const bottomAngle = Math.PI - angle; // 180 - 63 = 117 -> sin is positive -> BOTTOM
console.log("Top Y (sin(Math.PI + angle)):", Math.sin(topAngle));
console.log("Bottom Y (sin(Math.PI - angle)):", Math.sin(bottomAngle));
