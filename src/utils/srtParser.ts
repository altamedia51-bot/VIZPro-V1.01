import { Subtitle } from '../types';

function timeToSeconds(timeString: string): number {
  const parts = timeString.split(':');
  if (parts.length < 3) return 0;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  const secondsParts = parts[2].split(',');
  const seconds = parseInt(secondsParts[0], 10);
  const ms = secondsParts.length > 1 ? parseInt(secondsParts[1], 10) : 0;
  
  return (hours * 3600) + (minutes * 60) + seconds + (ms / 1000);
}

export function parseSRT(srtData: string): Subtitle[] {
  // Normalize line endings
  const normalized = srtData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by double blank lines
  const blocks = normalized.trim().split(/\n\s*\n/);
  
  return blocks.map((block, index) => {
    const lines = block.split('\n');
    const id = lines[0].trim();
    
    // Safety check
    if (lines.length < 3) {
      return { id: id || String(index), start: 0, end: 0, text: '' };
    }
    
    const timeLine = lines[1];
    const times = timeLine.split(' --> ');
    let start = 0, end = 0;
    
    if (times.length >= 2) {
      start = timeToSeconds(times[0].trim());
      end = timeToSeconds(times[1].trim());
    }
    
    const text = lines.slice(2).join('\n').trim();
    
    return {
      id: id || String(index),
      start,
      end,
      text,
    };
  }).filter(sub => sub.text !== '' && sub.end > 0);
}
