interface SectionDividerProps {
  variant?: 'up' | 'down'
  color?: string
}

export default function SectionDivider({ variant = 'up', color = 'rgba(74,140,63,0.08)' }: SectionDividerProps) {
  const path = variant === 'up'
    ? 'M0 60 C360 0 1080 60 1440 10 L1440 60 L0 60 Z'
    : 'M0 0 C360 60 1080 0 1440 50 L1440 60 L0 60 Z'

  return (
    <div style={{ lineHeight: 0, marginTop: '-1px', marginBottom: '-1px', position: 'relative', zIndex: 1 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 80 }}>
        <path d={path} fill={color} />
      </svg>
    </div>
  )
}
