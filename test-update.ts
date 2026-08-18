import { VizElement, BracketBannerElement } from './src/types';

const elements: VizElement[] = [
  {
    id: "123",
    type: "bracket_banner",
    width: 600,
    height: 100,
    text: "Bracket Banner",
    fontFamily: "Oswald",
    color: "#ffffff",
    boxColor1: "#df001c",
    boxColor2: "#9a0914",
    strokeColor1: "#ffffff",
    strokeColor2: "#cccccc",
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1
  }
];

const id = "123";
const updates: Partial<BracketBannerElement> = { text: "Hello" };
// Wait, updateElement accepts Partial<VizElement>
const func = (id: string, updates: Partial<VizElement>) => {
  return elements.map(el => el.id === id ? { ...el, ...updates } as any : el);
}

console.log(func(id, updates));
