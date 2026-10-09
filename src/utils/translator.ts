export interface TranslationLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: TranslationLanguage[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English (Inggris)', flag: '🇬🇧' },
  { code: 'ja', name: 'Japanese (Jepang)', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean (Korea)', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic (Arab)', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish (Spanyol)', flag: '🇪🇸' },
  { code: 'fr', name: 'French (Prancis)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Jerman)', flag: '🇩🇪' },
  { code: 'jv', name: 'Basa Jawa (Jawa)', flag: '🇮🇩' },
  { code: 'su', name: 'Basa Sunda (Sunda)', flag: '🇮🇩' },
  { code: 'th', name: 'Thai (Thailand)', flag: '🇹🇭' },
  { code: 'ru', name: 'Russian (Rusia)', flag: '🇷🇺' },
];

/**
 * Fallback line translation using Google Translate public endpoint
 */
async function translateLineFallback(text: string, targetLang: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fallback HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((item: any) => item[0]).join('');
    }
  } catch (err) {
    console.warn('Google translate fallback error:', err);
  }

  // Second fallback: MyMemory
  try {
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=auto|${encodeURIComponent(targetLang)}`;
    const mmRes = await fetch(mmUrl);
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      if (mmData?.responseData?.translatedText) {
        return mmData.responseData.translatedText;
      }
    }
  } catch (mmErr) {
    console.warn('MyMemory fallback error:', mmErr);
  }

  return trimmed;
}

/**
 * Translates a batch of lyric lines.
 * First tries server-side Gemini API (/api/translate),
 * then falls back smoothly to client-side translation if server is unreachable.
 */
export async function translateLyrics(
  lines: string[],
  targetLang: string = 'id',
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  if (lines.length === 0) return [];

  // Try server endpoint first
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines,
        targetLang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.translations) && data.translations.length === lines.length) {
        if (onProgress) onProgress(lines.length, lines.length);
        return data.translations;
      }
    }
  } catch (serverErr) {
    console.warn('Server translation endpoint unavailable or failed, using client fallback:', serverErr);
  }

  // Fallback: translate chunk-by-chunk or line-by-line
  const results: string[] = [];
  const chunkSize = 5; // process in parallel chunks to be gentle with rate limits

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(line => translateLineFallback(line, targetLang));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    if (onProgress) {
      onProgress(Math.min(i + chunkSize, lines.length), lines.length);
    }

    // Small delay between chunks
    if (i + chunkSize < lines.length) {
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }

  return results;
}
