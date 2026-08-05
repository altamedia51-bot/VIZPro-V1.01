import React from 'react';

export const PostProcessingFilters = () => {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', zIndex: -1 }}>
      <defs>
        {/* Chromatic Aberration */}
        <filter id="pp-chromatic">
          <feOffset in="SourceGraphic" dx="6" dy="0" result="red" />
          <feOffset in="SourceGraphic" dx="-6" dy="0" result="blue" />
          <feOffset in="SourceGraphic" dx="0" dy="0" result="green" />
          
          <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redOnly" />
          <feColorMatrix in="green" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="greenOnly" />
          <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueOnly" />
          
          <feBlend mode="screen" in="redOnly" in2="greenOnly" result="rg" />
          <feBlend mode="screen" in="rg" in2="blueOnly" result="rgb" />
        </filter>

        {/* Bloom */}
        <filter id="pp-bloom">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="brightBlur" />
          <feBlend mode="screen" in="SourceGraphic" in2="brightBlur" />
        </filter>

        {/* Cyberpunk LUT (approximate via ColorMatrix) */}
        <filter id="pp-lut-cyberpunk">
          <feColorMatrix type="matrix" values="
            1.2 0.2 0.0 0 0
            0.0 0.8 0.2 0 0
            0.4 0.0 1.5 0 0
            0   0   0   1 0" />
        </filter>
        
        {/* Cinematic LUT */}
        <filter id="pp-lut-cinematic">
          <feColorMatrix type="matrix" values="
            1.1 -0.1 0.0 0 0
            0.0  1.0 0.0 0 0
            -0.1 0.0 1.2 0 0
            0    0   0   1 0" />
        </filter>
        
        {/* Vintage LUT */}
        <filter id="pp-lut-vintage">
          <feColorMatrix type="matrix" values="
            0.9 0.1 0.1 0 0
            0.1 0.8 0.1 0 0
            0.0 0.1 0.7 0 0
            0   0   0   1 0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.1" intercept="0.1" />
            <feFuncG type="linear" slope="1.1" intercept="0.05" />
            <feFuncB type="linear" slope="1.0" intercept="0.0" />
          </feComponentTransfer>
        </filter>
        
        {/* Black and White Noir */}
        <filter id="pp-lut-bw">
          <feColorMatrix type="matrix" values="
            0.33 0.33 0.33 0 0
            0.33 0.33 0.33 0 0
            0.33 0.33 0.33 0 0
            0    0    0    1 0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.5" intercept="-0.2" />
            <feFuncG type="linear" slope="1.5" intercept="-0.2" />
            <feFuncB type="linear" slope="1.5" intercept="-0.2" />
          </feComponentTransfer>
        </filter>
        
        {/* Warm Sunshine */}
        <filter id="pp-lut-warm">
          <feColorMatrix type="matrix" values="
            1.2 0.1 0.0 0 0
            0.1 1.1 0.0 0 0
            0.0 0.0 0.8 0 0
            0   0   0   1 0" />
        </filter>
        
        {/* Cool Matrix */}
        <filter id="pp-lut-cool">
          <feColorMatrix type="matrix" values="
            0.8 0.0 0.0 0 0
            0.0 1.2 0.2 0 0
            0.0 0.2 1.2 0 0
            0   0   0   1 0" />
        </filter>
      </defs>
    </svg>
  );
};
