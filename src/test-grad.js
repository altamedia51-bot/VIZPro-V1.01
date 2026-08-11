import { createCanvas } from 'canvas';
import fs from 'fs';

const canvas = createCanvas(1280, 720);
const ctx = canvas.getContext('2d');

// Fill black bg
ctx.fillStyle = 'black';
ctx.fillRect(0,0,1280,720);

const el = { x: 640, y: 360, radius: 150 };
const rMax = 225;

const grad = ctx.createLinearGradient(el.x - rMax, el.y - rMax, el.x + rMax, el.y + rMax);
grad.addColorStop(0, 'red');
grad.addColorStop(1, 'blue');
ctx.fillStyle = grad;

const count = 60;
const layers = 5;
const dotSize = 5;
const step = (Math.PI * 2) / count;

for (let i = 0; i < count; i++) {
  const angle = i * step - Math.PI / 2;
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate(angle);
  
  for (let j = 0; j < layers; j++) {
      const distance = el.radius + j * (dotSize * 3);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(distance, 0, dotSize, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('test.png', buffer);
console.log('done');
