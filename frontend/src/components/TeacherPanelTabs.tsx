import { useEffect, useRef, useState } from 'react'
import TeacherPanel from './TeacherPanel'
import SpaceTeacherPanel from './SpaceTeacherPanel'

type PanelMode = 'teacher' | 'solar'

interface Props {
  isTalking: boolean
  isSpaceMode: boolean
}

export default function TeacherPanelTabs({ isTalking, isSpaceMode }: Props) {
  const [panelMode, setPanelMode] = useState<PanelMode>(isSpaceMode ? 'solar' : 'teacher')
  const previousSpaceModeRef = useRef(isSpaceMode)

  useEffect(() => {
    const previousSpaceMode = previousSpaceModeRef.current
    previousSpaceModeRef.current = isSpaceMode

    if (!isSpaceMode) {
      setPanelMode('teacher')
      return
    }

    if (!previousSpaceMode && isSpaceMode) {
      setPanelMode('solar')
    }
  }, [isSpaceMode])

  const showSolarTab = isSpaceMode

  const tabBaseStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    borderRadius: '10px',
    padding: '9px 10px',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'transform 0.18s ease, box-shadow 0.22s ease, background 0.22s ease, color 0.22s ease',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px',
          borderRadius: '14px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(167,139,250,0.16)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02), 0 10px 28px rgba(0,0,0,0.22)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setPanelMode('teacher')}
          style={{
            ...tabBaseStyle,
            background: panelMode === 'teacher'
              ? 'linear-gradient(135deg, rgba(124,58,237,0.32) 0%, rgba(239,178,255,0.18) 100%)'
              : 'rgba(255,255,255,0.02)',
            color: panelMode === 'teacher' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.5)',
            boxShadow: panelMode === 'teacher'
              ? 'inset 0 0 0 1px rgba(196,181,253,0.20), 0 0 0 1px rgba(124,58,237,0.12), 0 0 18px rgba(124,58,237,0.10)'
              : 'none',
            transform: panelMode === 'teacher' ? 'translateY(-0.5px)' : 'translateY(0)',
          }}
        >
          {panelMode === 'teacher' && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: '-40% -20%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(239,178,255,0.18) 45%, rgba(124,58,237,0.18) 55%, transparent 100%)',
                transform: 'translateX(-45%) rotate(10deg)',
                animation: 'lmTabSweep 2.8s linear infinite',
              }}
            />
          )}
          3D Teacher
        </button>

        {showSolarTab && (
          <button
            onClick={() => setPanelMode('solar')}
            style={{
              ...tabBaseStyle,
              background: panelMode === 'solar'
                ? 'linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(147,197,253,0.14) 100%)'
                : 'rgba(255,255,255,0.02)',
              color: panelMode === 'solar' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
              boxShadow: panelMode === 'solar'
                ? 'inset 0 0 0 1px rgba(147,197,253,0.18), 0 0 18px rgba(56,189,248,0.10)'
                : 'none',
              transform: panelMode === 'solar' ? 'translateY(-0.5px)' : 'translateY(0)',
            }}
          >
            {panelMode === 'solar' && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '-40% -20%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(226,247,255,0.16) 45%, rgba(56,189,248,0.14) 55%, transparent 100%)',
                  transform: 'translateX(-45%) rotate(10deg)',
                  animation: 'lmTabSweep 2.8s linear infinite',
                }}
              />
            )}
            Solar
          </button>
        )}
      </div>

      <style>{`
        @keyframes lmTabSweep {
          0% { transform: translateX(-55%) rotate(10deg); }
          100% { transform: translateX(55%) rotate(10deg); }
        }
      `}</style>

      <div style={{ flex: 1, minHeight: 0 }}>
        {panelMode === 'solar' && showSolarTab
          ? <SpaceTeacherPanel isTalking={isTalking} />
          : <TeacherPanel isTalking={isTalking} />}
      </div>
    </div>
  )
}
