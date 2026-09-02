export interface ColorPalette {
  id: string;
  name: string;
  category: 'cyberpunk' | 'synthwave' | 'nature' | 'monochrome' | 'sunset' | 'lofi' | 'luxury' | 'deep_sea';
  description: string;
  bgType: 'solid_color' | 'linear_gradient' | 'minimal_grid' | 'cyber_grid' | 'particle_starfield' | 'animated_gradient';
  bgColor1: string;
  bgColor2?: string;
  primaryWave: string;
  secondaryWave: string;
  accentColor: string;
  textColor: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'cyber_neon',
    name: 'Cyberpunk Neon',
    category: 'cyberpunk',
    description: 'Kontras tinggi cyan elektrik & magenta neon masa depan',
    bgType: 'cyber_grid',
    bgColor1: '#050510',
    bgColor2: '#0b001a',
    primaryWave: '#00f0ff',
    secondaryWave: '#ff0055',
    accentColor: '#ffe600',
    textColor: '#ffffff',
  },
  {
    id: 'synthwave_80s',
    name: 'Midnight Synthwave',
    category: 'synthwave',
    description: 'Nuansa ungu retro 80-an dengan gelombang pink menyala',
    bgType: 'linear_gradient',
    bgColor1: '#0f051d',
    bgColor2: '#280b45',
    primaryWave: '#ff2a8d',
    secondaryWave: '#9d00ff',
    accentColor: '#00e5ff',
    textColor: '#ffffff',
  },
  {
    id: 'sunset_horizon',
    name: 'Sunset Horizon',
    category: 'sunset',
    description: 'Gradasi hangat senja oranye keemasan dan merah kirmizi',
    bgType: 'linear_gradient',
    bgColor1: '#1a0505',
    bgColor2: '#3d1200',
    primaryWave: '#ff7700',
    secondaryWave: '#ff0055',
    accentColor: '#ffdd00',
    textColor: '#fff5ea',
  },
  {
    id: 'deep_ocean',
    name: 'Deep Ocean Trench',
    category: 'deep_sea',
    description: 'Biru laut dalam tenang dengan visualizer aquamarine cerah',
    bgType: 'linear_gradient',
    bgColor1: '#030b1e',
    bgColor2: '#061d38',
    primaryWave: '#00d2ff',
    secondaryWave: '#0066ff',
    accentColor: '#3a7bd5',
    textColor: '#e6f7ff',
  },
  {
    id: 'emerald_aurora',
    name: 'Emerald Aurora',
    category: 'nature',
    description: 'Cahaya hijau aurora borealis mistis berpadu hijau toska',
    bgType: 'linear_gradient',
    bgColor1: '#021612',
    bgColor2: '#062b24',
    primaryWave: '#00ff9d',
    secondaryWave: '#00b4d8',
    accentColor: '#b8ff00',
    textColor: '#f0fff4',
  },
  {
    id: 'lofi_chill_pastel',
    name: 'Lofi Pastel Chill',
    category: 'lofi',
    description: 'Warna pastel lembut menenangkan untuk musik lofi & santai',
    bgType: 'linear_gradient',
    bgColor1: '#1b1924',
    bgColor2: '#2d2238',
    primaryWave: '#ffb3c6',
    secondaryWave: '#c77dff',
    accentColor: '#ffd166',
    textColor: '#fef6eb',
  },
  {
    id: 'luxury_gold',
    name: 'Royal Gold & Obsidian',
    category: 'luxury',
    description: 'Hitam pekat eksklusif dengan aksen emas murni mengkilap',
    bgType: 'minimal_grid',
    bgColor1: '#0d0d0d',
    bgColor2: '#1a1813',
    primaryWave: '#ffd700',
    secondaryWave: '#d4af37',
    accentColor: '#ffea75',
    textColor: '#ffffff',
  },
  {
    id: 'monochrome_clean',
    name: 'Monochrome Studio',
    category: 'monochrome',
    description: 'Studio minimalis hitam-putih presisi dan elegan',
    bgType: 'minimal_grid',
    bgColor1: '#0a0a0c',
    bgColor2: '#16161a',
    primaryWave: '#ffffff',
    secondaryWave: '#9ca3af',
    accentColor: '#e5e7eb',
    textColor: '#ffffff',
  },
  {
    id: 'crimson_blood',
    name: 'Crimson Fury',
    category: 'sunset',
    description: 'Merah menyala penuh energi untuk musik metal, rock & trap bass',
    bgType: 'linear_gradient',
    bgColor1: '#150303',
    bgColor2: '#2e0505',
    primaryWave: '#ff1e27',
    secondaryWave: '#ff5e00',
    accentColor: '#ff0055',
    textColor: '#ffffff',
  },
  {
    id: 'cosmic_violet',
    name: 'Cosmic Nebula',
    category: 'synthwave',
    description: 'Bintang antariksa ungu violet kosmik berhamburan',
    bgType: 'particle_starfield',
    bgColor1: '#070014',
    bgColor2: '#1a0033',
    primaryWave: '#bf55ec',
    secondaryWave: '#00f2fe',
    accentColor: '#f72585',
    textColor: '#ffffff',
  },
  {
    id: 'toxic_acid',
    name: 'Acid Cyber Green',
    category: 'cyberpunk',
    description: 'Hijau asam neon tajam berkecepatan tinggi EDM & Bass house',
    bgType: 'linear_gradient',
    bgColor1: '#070d05',
    bgColor2: '#0e1c0a',
    primaryWave: '#39ff14',
    secondaryWave: '#00ffff',
    accentColor: '#ccff00',
    textColor: '#ffffff',
  },
  {
    id: 'dreamy_sakura',
    name: 'Dreamy Sakura Bloom',
    category: 'lofi',
    description: 'Kelopak sakura jepang bernuansa pink rose dan putih lembut',
    bgType: 'linear_gradient',
    bgColor1: '#1a1016',
    bgColor2: '#2a1622',
    primaryWave: '#ff70a6',
    secondaryWave: '#ff9770',
    accentColor: '#ffd670',
    textColor: '#fff0f5',
  }
];

// Utility to convert HEX to HSL and back for algorithmic harmony generation
export function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split_complementary' | 'monochromatic';

export function generateHarmony(baseHex: string, type: HarmonyType): ColorPalette {
  const [h, s, l] = hexToHsl(baseHex);

  let pWave = baseHex;
  let sWave = baseHex;
  let accent = baseHex;
  let bg1 = hslToHex(h, Math.min(s, 60), 6);
  let bg2 = hslToHex(h, Math.min(s, 70), 12);

  if (type === 'complementary') {
    const compH = (h + 180) % 360;
    pWave = baseHex;
    sWave = hslToHex(compH, Math.min(s + 10, 100), Math.max(l, 55));
    accent = hslToHex((h + 30) % 360, 95, 65);
    bg1 = hslToHex(h, 45, 5);
    bg2 = hslToHex(compH, 50, 10);
  } else if (type === 'analogous') {
    const h1 = (h + 30) % 360;
    const h2 = (h - 30 + 360) % 360;
    pWave = baseHex;
    sWave = hslToHex(h1, s, Math.max(l, 55));
    accent = hslToHex(h2, 90, 60);
    bg1 = hslToHex(h, 40, 5);
    bg2 = hslToHex(h1, 45, 10);
  } else if (type === 'triadic') {
    const h1 = (h + 120) % 360;
    const h2 = (h + 240) % 360;
    pWave = baseHex;
    sWave = hslToHex(h1, Math.min(s + 10, 100), Math.max(l, 55));
    accent = hslToHex(h2, 95, 65);
    bg1 = hslToHex(h, 40, 5);
    bg2 = hslToHex(h2, 45, 10);
  } else if (type === 'split_complementary') {
    const h1 = (h + 150) % 360;
    const h2 = (h + 210) % 360;
    pWave = baseHex;
    sWave = hslToHex(h1, s, Math.max(l, 55));
    accent = hslToHex(h2, 90, 65);
    bg1 = hslToHex(h, 40, 5);
    bg2 = hslToHex(h1, 45, 10);
  } else if (type === 'monochromatic') {
    pWave = hslToHex(h, s, 65);
    sWave = hslToHex(h, Math.max(s - 25, 20), 45);
    accent = hslToHex(h, 95, 80);
    bg1 = hslToHex(h, 30, 4);
    bg2 = hslToHex(h, 35, 9);
  }

  return {
    id: `custom_${type}_${Date.now()}`,
    name: `Harmoni ${type.replace('_', ' ').toUpperCase()}`,
    category: 'cyberpunk',
    description: `Kombinasi warna ${type} terhitung matematis dari warna dasar ${baseHex}`,
    bgType: 'linear_gradient',
    bgColor1: bg1,
    bgColor2: bg2,
    primaryWave: pWave,
    secondaryWave: sWave,
    accentColor: accent,
    textColor: '#ffffff',
  };
}
