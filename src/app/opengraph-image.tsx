import { ImageResponse } from 'next/og'
import { ORG } from '@/config/org.config'

export const alt = ORG.name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Dynamic social-share card so links to the site render a branded preview
// (used for both Open Graph and Twitter). No static asset to maintain.
export default function OpengraphImage() {
  const gold = ORG.brand.colors.gold
  const black = ORG.brand.colors.black

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: black,
          padding: '96px',
          backgroundImage: `radial-gradient(circle at 85% 12%, ${gold}22, transparent 40%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            letterSpacing: 14,
            color: gold,
            fontWeight: 700,
          }}
        >
          {`${ORG.shortName} · WRESTLING CLUB`}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 24,
            fontSize: 132,
            lineHeight: 1.02,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex', color: '#FFFFFF' }}>Work. Compete.</div>
          <div style={{ display: 'flex', color: gold }}>Repeat.</div>
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 40, color: '#C9C9C9' }}>
          {ORG.name}
        </div>
      </div>
    ),
    { ...size },
  )
}
