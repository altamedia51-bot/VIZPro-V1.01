import fs from 'fs';
let code = fs.readFileSync('src/components/CanvasRenderer.tsx', 'utf8');

const target = `             // Brackets
             const bracketHeight = h * 0.95;
             const bracketWidth = h * 0.15;
             const gap = h * 0.08;
             const thicknessInner = bracketWidth * 0.3;
             
             // Right Bracket Crescent
             ctx.beginPath();
             ctx.moveTo(w/2 + gap, -bracketHeight/2);
             ctx.quadraticCurveTo(w/2 + gap + bracketWidth, 0, w/2 + gap, bracketHeight/2);
             ctx.quadraticCurveTo(w/2 + gap + thicknessInner, 0, w/2 + gap + thicknessInner * 0.5, -bracketHeight/2);
             ctx.closePath();
             
             const bracketGrad2 = ctx.createLinearGradient(0, -bracketHeight/2, 0, bracketHeight/2);
             bracketGrad2.addColorStop(0, el.boxColor1 || '#df001c');
             bracketGrad2.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = bracketGrad2;
             ctx.fill();
             
             ctx.strokeStyle = el.strokeColor2 || el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(1, h * 0.02);
             ctx.stroke();

             // Left Bracket Crescent
             ctx.beginPath();
             ctx.moveTo(-w/2 - gap, -bracketHeight/2);
             ctx.quadraticCurveTo(-w/2 - gap - bracketWidth, 0, -w/2 - gap, bracketHeight/2);
             ctx.quadraticCurveTo(-w/2 - gap - thicknessInner, 0, -w/2 - gap - thicknessInner * 0.5, -bracketHeight/2);
             ctx.closePath();
             
             const bracketGrad1 = ctx.createLinearGradient(0, -bracketHeight/2, 0, bracketHeight/2);
             bracketGrad1.addColorStop(0, el.boxColor1 || '#df001c');
             bracketGrad1.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = bracketGrad1;
             ctx.fill();
             
             ctx.strokeStyle = el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(1, h * 0.02);
             ctx.stroke();`;

const replacement = `             // Brackets
             const gap = h * 0.08;
             const bracketWidth = h * 0.15;
             const angle = Math.PI * 0.3;
             const radiusInner = radius + gap;

             // Right Bracket
             let cx = w/2 - radius;
             let startX = cx + radiusInner * Math.cos(-angle);
             let startY = radiusInner * Math.sin(-angle);
             let endX = cx + radiusInner * Math.cos(angle);
             let endY = radiusInner * Math.sin(angle);
             let midX = cx + radiusInner + bracketWidth;
             let cpX = 2 * midX - (startX + endX) / 2;

             ctx.beginPath();
             ctx.arc(cx, 0, radiusInner, -angle, angle, false);
             ctx.quadraticCurveTo(cpX, 0, startX, startY);
             ctx.closePath();

             const bracketGrad1 = ctx.createLinearGradient(0, -h/2, 0, h/2);
             bracketGrad1.addColorStop(0, el.boxColor1 || '#df001c');
             bracketGrad1.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = bracketGrad1;
             ctx.fill();
             
             ctx.strokeStyle = el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(1, h * 0.02);
             ctx.stroke();

             // Left Bracket
             cx = -w/2 + radius;
             startX = cx + radiusInner * Math.cos(Math.PI + angle);
             startY = radiusInner * Math.sin(Math.PI + angle);
             endX = cx + radiusInner * Math.cos(Math.PI - angle);
             endY = radiusInner * Math.sin(Math.PI - angle);
             midX = cx - radiusInner - bracketWidth;
             cpX = 2 * midX - (startX + endX) / 2;

             ctx.beginPath();
             ctx.arc(cx, 0, radiusInner, Math.PI + angle, Math.PI - angle, true);
             ctx.quadraticCurveTo(cpX, 0, startX, startY);
             ctx.closePath();

             const bracketGrad2 = ctx.createLinearGradient(0, -h/2, 0, h/2);
             bracketGrad2.addColorStop(0, el.boxColor1 || '#df001c');
             bracketGrad2.addColorStop(1, el.boxColor2 || '#9a0914');
             ctx.fillStyle = bracketGrad2;
             ctx.fill();
             
             ctx.strokeStyle = el.strokeColor2 || el.strokeColor1 || '#ffffff';
             ctx.lineWidth = Math.max(1, h * 0.02);
             ctx.stroke();`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/CanvasRenderer.tsx', code);
    console.log("Success");
} else {
    console.log("Target not found!");
}
