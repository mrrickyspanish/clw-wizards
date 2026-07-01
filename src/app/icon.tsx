import { ImageResponse } from 'next/og'
import { ORG } from '@/config/org.config'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// Generated favicon: gold "W" on the club black. Keeps the tab/bookmark icon
// on-brand without shipping a separate asset.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: ORG.brand.colors.black,
          color: ORG.brand.colors.gold,
          fontSize: 46,
          fontWeight: 900,
          borderRadius: 12,
        }}
      >
        W
      </div>
    ),
    { ...size },
  )
}
