import { useEffect, useRef, type ReactNode } from 'react'

export type SidePanelKind = 'teacher' | 'solar' | 'topics' | 'notes'

interface SpatialClassroomProps {
  children: ReactNode        // classroom stage
  sidebarContent: ReactNode  // sidebar
  sidebarKind?: SidePanelKind
}

declare global {
  interface Window {
    XRSystem?: unknown
  }
}

export default function SpatialClassroom({
  children,
  sidebarContent,
  sidebarKind = 'topics',
}: SpatialClassroomProps) {
  const isSpatial = import.meta.env.XR_ENV === 'avp'
  const sessionRef = useRef<any>(null) // ai fix: avoid importing SpatialSession type directly to prevent loading SDK in non-spatial contexts

  // Lazy-init SpatialSession only in WebSpatial context
  useEffect(() => {
    if (!isSpatial) return
    let mounted = true

    import('@webspatial/core-sdk').then(({ SpatialSession }) => {
      if (!mounted) return
      try {
        sessionRef.current = new SpatialSession()
      } catch {
        // not in WebSpatial App Shell
      }
    }).catch(() => {
      // SDK not available
    })

    return () => {
      mounted = false
      sessionRef.current?.destroy?.()
    }
  }, [isSpatial])

  if (isSpatial) {
    // Spatial layout: main classroom + floating sidebar
    return (
      <div style={{ display: 'flex', gap: '16px', height: '100%', width: '100%' }}>
        {/* Main classroom panel — spatialized */}
        <div
          enable-xr
          data-spatial-panel="main"
          style={{
            flex: 3,
            borderRadius: '16px',
            overflow: 'hidden',
            '--xr-background-material': 'translucent',
          } as React.CSSProperties}
        >
          {children}
        </div>

        {/* Sidebar panel — spatialized, floating */}
        <SpatialSidePanel kind={sidebarKind} style={{ flex: 1, maxWidth: '360px' }}>
          {sidebarContent}
        </SpatialSidePanel>
      </div>
    )
  }

  // Flat browser layout
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: '100%',
      width: '100%',
      flexDirection: 'row',
    }}>
      {/* Classroom stage */}
      <div style={{
        flex: 3,
        borderRadius: '16px',
        overflow: 'hidden',
        minHeight: '400px',
      }}>
        {children}
      </div>

      {/* Sidebar */}
      <SpatialSidePanel kind={sidebarKind} style={{ flex: 1, maxWidth: '340px', overflowY: 'auto' }}>
        {sidebarContent}
      </SpatialSidePanel>
    </div>
  )
}

function getSidePanelStyle(kind: SidePanelKind, isSpatial: boolean): React.CSSProperties {
  const spatialBackground = 'rgba(13,13,26,0.78)'
  const flatBackground = 'rgba(13,13,26,0.9)'

  const base: React.CSSProperties = {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: isSpatial ? spatialBackground : flatBackground,
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 12px 36px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.02)',
  }

  if (kind === 'teacher') {
    return {
      ...base,
      minWidth: '380px',
      minHeight: '640px',
      background: isSpatial
        ? 'linear-gradient(180deg, rgba(20,16,38,0.8) 0%, rgba(13,13,26,0.74) 100%)'
        : 'linear-gradient(180deg, rgba(20,16,38,0.96) 0%, rgba(13,13,26,0.9) 100%)',
      border: '1px solid rgba(167,139,250,0.16)',
    }
  }

  if (kind === 'solar') {
    return {
      ...base,
      minWidth: '600px',
      minHeight: '600px',
      background: isSpatial
        ? 'linear-gradient(180deg, rgba(10,24,46,0.82) 0%, rgba(9,16,28,0.76) 100%)'
        : 'linear-gradient(180deg, rgba(10,24,46,0.95) 0%, rgba(9,16,28,0.9) 100%)',
      border: '1px solid rgba(125,211,252,0.2)',
      boxShadow: '0 14px 40px rgba(0,0,0,0.24), 0 0 28px rgba(56,189,248,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)',
    }
  }

  if (kind === 'notes') {
    return {
      ...base,
      minWidth: '540px',
      maxHeight: '300px',
      background: isSpatial
        ? 'linear-gradient(90deg, rgba(24,14,42,0.82) 0%, rgba(13,13,26,0.74) 100%)'
        : 'linear-gradient(90deg, rgba(24,14,42,0.96) 0%, rgba(13,13,26,0.9) 100%)',
      border: '1px solid rgba(217,70,239,0.15)',
    }
  }

  return {
    ...base,
    minWidth: '320px',
    minHeight: '560px',
  }
}

interface SpatialSidePanelProps {
  kind: SidePanelKind
  children: ReactNode
  style?: React.CSSProperties
}

export function SpatialSidePanel({ kind, children, style }: SpatialSidePanelProps) {
  const isSpatial = import.meta.env.XR_ENV === 'avp'
  const panelStyle = {
    ...getSidePanelStyle(kind, isSpatial),
    ...style,
  }

  if (isSpatial) {
    return (
      <div
        enable-xr
        data-spatial-panel={kind}
        style={{
          ...panelStyle,
          '--xr-background-material': 'translucent',
        } as React.CSSProperties}
      >
        {children}
      </div>
    )
  }

  return (
    <div data-spatial-panel={kind} style={panelStyle}>
      {children}
    </div>
  )
}
