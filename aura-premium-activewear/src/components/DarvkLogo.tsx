import React from 'react';
import logoUrl from '../assets/logo.png';

/**
 * Source PNG is 1024x986 with large transparent margins.
 * "DARVK" text only (NO dot) sits roughly at:
 *   - horizontally: 8% → 90%  (text ends before dot, K fully visible)
 *   - vertically:   37% → 63%
 *
 * We crop out the PNG dot, then render a clean CSS red dot next to it.
 *
 * target text height = 38px
 * scale = 38 / 256  (26% of 986 = 256px is text height in source)
 */

const SCALE       = 38 / 256;
const FULL_W      = Math.round(1024 * SCALE); // ≈ 152
const FULL_H      = Math.round(986  * SCALE); // ≈ 146
const TEXT_W      = Math.round(0.82 * 1024 * SCALE); // 8%→90% = 82% of 1024 ≈ 125px
const TEXT_H      = 38;
const OFFSET_LEFT = Math.round(0.08 * FULL_W); // ≈ 12
const OFFSET_TOP  = Math.round(0.37 * FULL_H); // ≈ 54

interface DarvkLogoProps {
  className?: string;
  dotClassName?: string;
  animateDot?: boolean;
}

export const DarvkLogo: React.FC<DarvkLogoProps> = ({
  animateDot = true,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
      {/* DARVK text — PNG dot cropped out */}
      <div
        style={{
          width: TEXT_W,
          height: TEXT_H,
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <img
          src={logoUrl}
          alt="DARVK"
          style={{
            width: FULL_W,
            height: FULL_H,
            position: 'absolute',
            top:  -OFFSET_TOP,
            left: -OFFSET_LEFT,
            maxWidth: 'none',
          }}
        />
      </div>

      {/* Clean programmatic red dot */}
      <div
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          backgroundColor: '#dc2626',
          flexShrink: 0,
          marginBottom: 10,
          animation: animateDot ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
        }}
      />
    </div>
  );
};
