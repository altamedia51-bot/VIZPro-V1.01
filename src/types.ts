export type BackgroundType =
  | "solid_color"
  | "image"
  | "video"
  | "cyber_grid"
  | "particle_starfield"
  | "animated_gradient"
  | "minimal_grid"
  | "linear_gradient";
export interface BackgroundConfig {
  type: BackgroundType;
  value: string; // hex color, or blob URL
  color1?: string;
  color2?: string;
  blur?: number;
  brightness?: number;
  contrast?: number;
  vignette?: number;
  focusEnabled?: boolean;
  focusSize?: number;
  focusBlur?: number;
}
export interface PostProcessingConfig {
  bloom: boolean;
  chromaticAberration: boolean;
  filmGrain: boolean;
  lensFlare: boolean;
  lut: string;
}
export interface Subtitle {
  id: string;
  start: number; // in seconds
  end: number;
  text: string;
}
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  elements: VizElement[];
  backgroundConfig: BackgroundConfig;
  postProcessing?: PostProcessingConfig;
  resolution?: { width: number; height: number };
  subtitles?: Subtitle[];
}
export type ElementType =
  | "bars"
  | "circle"
  | "text"
  | "banner"
  | "waveform"
  | "particles"
  | "orbs"
  | "neon_grid"
  | "double_circle"
  | "smooth_curve"
  | "circular_spectrum"
  | "symmetrical_mirror"
  | "bass_pulse"
  | "multi_sine"
  | "single_sine"
  | "spiral_galaxy"
  | "flames"
  | "rain"
  | "triangle_spectrum"
  | "diamond_spectrum"
  | "glowing_ring"
  | "mirrored_bars"
  | "subtitle"
  | "sticker_text"
  | "image"
  | "digital_matrix_rain"
  | "color_pixel"
  | "radial_dots"
  | "glowing_blocks"
  | "perspective_ring"
  | "progress_bar"
  | "progress_visualizer"
  | "water_splash"
  | "bracket_banner";
export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  opacity: number;
  useGradient?: boolean;
  color2?: string;
  startTime?: number; // Start time in seconds
  endTime?: number;
  groupId?: string; // End time in seconds
}
export interface BarsElement extends BaseElement {
  type: "bars";
  width: number;
  height: number;
  barWidth: number;
  barSpacing: number;
}
export interface CircleElement extends BaseElement {
  type: "circle";
  radius: number;
  lineWidth: number;
}
export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  letterSpacing?: number;
  useGradient?: boolean;
  animation?: "none" | "glow_pulse" | "wave" | "bounce" | "drop_bounce" | "popup_words"
    | "scattered"
    | "arabic_cascade";
  isHanging?: boolean;
  templateStyle?:
    | "default"
    | "bubble_yellow"
    | "bubble_black"
    | "neon"
    | "glow_border"
    | "layered_outline"
    | "calli"
    | "colorful_words"
    | "brush_stroke"
    | "calli"
    | "vintage_brush"
    | "architect"
    | "jhun_brush"
    | "pen_story"
    | "tiktok_pop"
    | "tiktok_karaoke"
    | "retro"
    | "popup_words"
    | "scattered"
    | "arabic_cascade"
    | "tiktok_shadow"
    | "highlight_pop"
    | "background_box"
    | "black_fire"
    | "street_dripping";
  textCase?: "none" | "uppercase" | "lowercase" | "capitalize";
  backgroundColor?: string;
  backgroundOpacity?: number;
}
export interface BannerElement extends BaseElement {
  type: "banner";
  width: number;
  height: number;
  textLeft: string;
  textRight: string;
  fontFamily: string;
  color: string;
  color2: string;
  boxColor1: string;
  boxColor2: string;
  strokeColor1: string;
  strokeColor2: string;
  slant: number;
  boxOpacity?: number;
  boxOpacity1?: number;
  boxOpacity2?: number;
  textCase?: "none" | "uppercase" | "lowercase" | "capitalize";
}
export interface WaveformElement extends BaseElement {
  type: "waveform";
  width: number;
  height: number;
  lineWidth: number;
}
export interface ParticlesElement extends BaseElement {
  type: "particles";
  count: number;
  speed: number;
}
export interface OrbsElement extends BaseElement {
  type: "orbs";
  count: number;
  radius: number;
}
export interface NeonGridElement extends BaseElement {
  type: "neon_grid";
  width: number;
  height: number;
  perspective: number;
}
export interface DoubleCircleElement extends BaseElement {
  type: "double_circle";
  radius: number;
  lineWidth: number;
}
export interface SmoothCurveElement extends BaseElement {
  type: "smooth_curve";
  width: number;
  height: number;
  lineWidth: number;
}
export interface CircularSpectrumElement extends BaseElement {
  type: "circular_spectrum";
  radius: number;
  height: number;
}
export interface SymmetricalMirrorElement extends BaseElement {
  type: "symmetrical_mirror";
  width: number;
  height: number;
  barWidth: number;
  barSpacing: number;
}
export interface BassPulseElement extends BaseElement {
  type: "bass_pulse";
  radius: number;
}
export interface MultiSineElement extends BaseElement {
  type: "multi_sine";
  width: number;
  height: number;
  lines: number;
}
export interface SingleSineElement extends BaseElement {
  type: "single_sine";
  width: number;
  height: number;
}
export interface SpiralGalaxyElement extends BaseElement {
  type: "spiral_galaxy";
  count: number;
  radius: number;
}
export interface FlamesElement extends BaseElement {
  type: "flames";
  width: number;
  height: number;
}
export interface RainElement extends BaseElement {
  type: "rain";
  count: number;
  speed: number;
}
export interface TriangleSpectrumElement extends BaseElement {
  type: "triangle_spectrum";
  radius: number;
  lineWidth: number;
}
export interface DiamondSpectrumElement extends BaseElement {
  type: "diamond_spectrum";
  radius: number;
  lineWidth: number;
}
export interface GlowingRingElement extends BaseElement {
  type: "glowing_ring";
  radius: number;
  lineWidth: number;
}
export interface MirroredBarsElement extends BaseElement {
  type: "mirrored_bars";
  width: number;
  height: number;
  barWidth: number;
  barSpacing: number;
}
export interface SubtitleElement extends BaseElement {
  type: "subtitle";
  fontSize: number;
  fontFamily: string;
  letterSpacing?: number;
  templateStyle?:
    | "default"
    | "bubble_yellow"
    | "bubble_black"
    | "neon"
    | "glow_border"
    | "colorful_words"
    | "brush_stroke"
    | "vintage_brush"
    | "architect"
    | "jhun_brush"
    | "pen_story"
    | "tiktok_pop"
    | "tiktok_karaoke"
    | "retro"
    | "popup_words"
    | "scattered"
    | "arabic_cascade"
    | "tiktok_shadow"
    | "highlight_pop"
    | "background_box"
    | "layered_outline"
    | "black_fire"
    | "street_dripping";
  textCase?: "none" | "uppercase" | "lowercase" | "capitalize";
  backgroundColor?: string;
  backgroundOpacity?: number;
}
export interface DigitalMatrixRainElement extends BaseElement {
  type: "digital_matrix_rain";
  density: number;
  speed: number;
}
export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  width: number;
  height: number;
  useColorTint?: boolean;
}
export interface ColorPixelElement extends BaseElement {
  type: "color_pixel";
  density: number;
  speed: number;
  radius: number;
  lineWidth: number;
}
export interface RadialDotsElement extends BaseElement {
  type: "radial_dots";
  radius: number;
  count: number;
  layers: number;
  dotSize: number;
}
export interface GlowingBlocksElement extends BaseElement {
  type: "glowing_blocks";
  columns: number;
  rows: number;
  blockWidth: number;
  blockHeight: number;
  spacing: number;
  glowIntensity: number;
}
export interface PerspectiveRingElement extends BaseElement {
  type: "perspective_ring";
  radius: number;
  perspective: number; // 0.1 to 1.0 (squash factor)
  thickness: number;
  segments: number;
}
export interface ProgressBarElement extends BaseElement {
  type: "progress_bar";
  width: number;
  height: number;
  showTime: boolean;
  fontSize: number;
  fontFamily: string;
}
export interface ProgressVisualizerElement extends BaseElement {
  type: "progress_visualizer";
  width: number;
  height: number;
  barHeight: number;
  barWidth: number;
  barSpacing: number;
  waveformStyle: "bars" | "mirrored" | "wave" | "dots" | "segmented";
  showTime: boolean;
  showKnob: boolean;
  knobSize: number;
  fontSize: number;
  fontFamily: string;
  trackColor?: string;
  waveformOffset?: number;
  glowIntensity?: number;
}
export interface WaterSplashElement extends BaseElement {
  type: "water_splash";
  particleCount: number;
  splashRadius: number;
  dropSize: number;
  speed: number;
}
export type VizElement =
  | BarsElement
  | CircleElement
  | TextElement
  | SubtitleElement
  | BannerElement
  | WaveformElement
  | ParticlesElement
  | OrbsElement
  | NeonGridElement
  | DoubleCircleElement
  | SmoothCurveElement
  | CircularSpectrumElement
  | SymmetricalMirrorElement
  | BassPulseElement
  | MultiSineElement
  | SingleSineElement
  | SpiralGalaxyElement
  | FlamesElement
  | RainElement
  | TriangleSpectrumElement
  | DiamondSpectrumElement
  | GlowingRingElement
  | MirroredBarsElement
  | ImageElement
  | DigitalMatrixRainElement
  | ColorPixelElement
  | RadialDotsElement
  | GlowingBlocksElement
  | PerspectiveRingElement
  | ProgressBarElement
  | ProgressVisualizerElement
  | WaterSplashElement
  | BracketBannerElement;
export interface AudioMetrics {
  rms: number;
  bass: number;
  mid: number;
  treble: number;
}

export interface BracketBannerElement extends BaseElement {
  type: "bracket_banner";
  width: number;
  height: number;
  text: string;
  fontFamily: string;
  color: string;
  boxColor1: string;
  boxColor2: string;
  strokeColor1: string;
  strokeColor2: string;
  boxOpacity?: number;
  textCase?: "none" | "uppercase" | "lowercase" | "capitalize";
}
