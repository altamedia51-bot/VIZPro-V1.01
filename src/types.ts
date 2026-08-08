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
  | "image"
  | "digital_matrix_rain"
  | "color_pixel";
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
  animation?: "none" | "glow_pulse" | "wave" | "bounce" | "drop_bounce";
  isHanging?: boolean;
  templateStyle?:
    | "default"
    | "bubble_yellow"
    | "bubble_black"
    | "neon"
    | "glow_border"
    | "layered_outline"
    | "tiktok_pop"
    | "tiktok_karaoke"
    | "tiktok_shadow"
    | "highlight_pop"
    | "background_box";
  textCase?: "none" | "uppercase" | "lowercase" | "capitalize";
  backgroundColor?: string;
  backgroundOpacity?: number;
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
    | "tiktok_pop"
    | "tiktok_karaoke"
    | "tiktok_shadow"
    | "highlight_pop"
    | "background_box"
    | "layered_outline";
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
}
export interface ColorPixelElement extends BaseElement {
  type: "color_pixel";
  density: number;
  speed: number;
  radius: number;
  lineWidth: number;
}
export type VizElement =
  | BarsElement
  | CircleElement
  | TextElement
  | SubtitleElement
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
  | ColorPixelElement;
export interface AudioMetrics {
  rms: number;
  bass: number;
  mid: number;
  treble: number;
}
