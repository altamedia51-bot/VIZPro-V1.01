import { Subtitle } from '../types';
import { parseSRT } from './srtParser';

function lrcTimeToSeconds(minStr: string, secStr: string, msStr?: string): number {
  const min = parseInt(minStr, 10) || 0;
  const sec = parseInt(secStr, 10) || 0;
  let ms = 0;
  if (msStr) {
    if (msStr.length === 2) {
      ms = parseInt(msStr, 10) * 10;
    } else {
      ms = parseInt(msStr.padEnd(3, '0').slice(0, 3), 10);
    }
  }
  return min * 60 + sec + ms / 1000;
}

/**
 * Parses LRC lyric files (.lrc)
 * Example: [00:15.50]Lyric line here
 */
export function parseLRC(lrcData: string, totalAudioDuration?: number): Subtitle[] {
  const normalized = lrcData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');

  interface RawLrcItem {
    time: number;
    text: string;
  }

  const items: RawLrcItem[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it's metadata tag like [ar:Artist], [ti:Title], [length:03:45], [offset:0]
    if (/^\[(ti|ar|al|by|offset|length|re|ve):/i.test(trimmed)) {
      continue;
    }

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      // The text is whatever is after all timestamps
      const cleanText = trimmed.replace(timeRegex, '').trim();
      for (const match of matches) {
        const time = lrcTimeToSeconds(match[1], match[2], match[3]);
        items.push({ time, text: cleanText });
      }
    }
  }

  // Sort items by timestamp
  items.sort((a, b) => a.time - b.time);

  // Filter out empty items unless they denote instrumental pauses
  const validItems = items.filter(it => it.text.length > 0);

  const subtitles: Subtitle[] = [];
  for (let i = 0; i < validItems.length; i++) {
    const current = validItems[i];
    let end: number;

    if (i < validItems.length - 1) {
      const nextTime = validItems[i + 1].time;
      // Cap individual line duration to 8s max or next timestamp
      end = Math.min(nextTime, current.time + 8);
      if (end <= current.time) {
        end = current.time + 2.5;
      }
    } else {
      // Last line
      if (totalAudioDuration && totalAudioDuration > current.time) {
        end = Math.min(totalAudioDuration, current.time + 4);
      } else {
        end = current.time + 4;
      }
    }

    subtitles.push({
      id: crypto.randomUUID(),
      start: Math.round(current.time * 100) / 100,
      end: Math.round(end * 100) / 100,
      text: current.text,
      originalText: current.text,
    });
  }

  return subtitles;
}

/**
 * Parses plain text lines (.txt) or pasted lyrics
 * Distributes them evenly across totalAudioDuration or default spacing
 */
export function parsePlainText(plainText: string, totalAudioDuration?: number): Subtitle[] {
  const normalized = plainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return [];

  const duration = totalAudioDuration && totalAudioDuration > 5 ? totalAudioDuration : lines.length * 4;
  const timePerLine = Math.max(2.5, duration / lines.length);

  return lines.map((text, idx) => {
    const start = Math.round(idx * timePerLine * 100) / 100;
    const end = Math.round((start + Math.min(timePerLine, 6)) * 100) / 100;
    return {
      id: crypto.randomUUID(),
      start,
      end,
      text,
      originalText: text,
    };
  });
}

/**
 * Auto-detects format (LRC, SRT, TXT) and parses into Subtitle[]
 */
export function detectAndParseLyrics(
  content: string,
  fileName?: string,
  totalAudioDuration?: number
): { subtitles: Subtitle[]; format: 'lrc' | 'srt' | 'txt' } {
  const lowerName = (fileName || '').toLowerCase();

  if (lowerName.endsWith('.srt') || content.includes('-->')) {
    const srtList = parseSRT(content);
    if (srtList.length > 0) {
      return {
        subtitles: srtList.map(s => ({ ...s, originalText: s.text })),
        format: 'srt',
      };
    }
  }

  if (lowerName.endsWith('.lrc') || /\[\d{1,2}:\d{2}/.test(content)) {
    const lrcList = parseLRC(content, totalAudioDuration);
    if (lrcList.length > 0) {
      return { subtitles: lrcList, format: 'lrc' };
    }
  }

  // Fallback to plain text
  return {
    subtitles: parsePlainText(content, totalAudioDuration),
    format: 'txt',
  };
}

/**
 * Formats original and translated text for display mode
 */
export function formatSubtitleText(
  original: string,
  translated: string | undefined,
  mode: 'bilingual' | 'translated_only' | 'original_only'
): string {
  const cleanOrig = (original || '').trim();
  const cleanTrans = (translated || '').trim();

  if (mode === 'translated_only') {
    return cleanTrans || cleanOrig;
  }
  if (mode === 'original_only') {
    return cleanOrig;
  }
  // bilingual
  if (!cleanTrans) return cleanOrig;
  if (!cleanOrig) return cleanTrans;
  return `${cleanOrig}\n${cleanTrans}`;
}

export function splitSubtitleLines(text: string): { original: string; translated: string } {
  if (!text) return { original: '', translated: '' };
  const parts = text.split('\n');
  if (parts.length >= 2) {
    return {
      original: parts[0].trim(),
      translated: parts.slice(1).join('\n').trim(),
    };
  }
  return { original: text.trim(), translated: '' };
}
