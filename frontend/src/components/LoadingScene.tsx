// LoadingScene — branded loading overlay.
//
// mode="fill":    fills parent container (used in BoardPanel while rendering)
// mode="overlay": fixed full-screen overlay (used in GreetingView while connecting)

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface Props {
  label?: string
  mode?: 'fill' | 'overlay'
}

export default function LoadingScene({ label, mode = 'fill' }: Props) {
  const rootRef    = useRef<HTMLDivElement>(null)
  const glowRef    = useRef<HTMLDivElement>(null)
  const labelRef   = useRef<HTMLParagraphElement>(null)

  // Fade in on mount
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' })
    return () => { gsap.killTweensOf(el) }
  }, [])

  // Ambient glow pulse
  useEffect(() => {
    const el = glowRef.current
    if (!el) return
    const t = gsap.to(el, {
      opacity: 0.75,
      scale: 1.14,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
    return () => {
      t.kill()
    }
  }, [])

  // Label breathe
  useEffect(() => {
    const el = labelRef.current
    if (!el) return
    const t = gsap.to(el, {
      opacity: 0.4,
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 0.4,
    })
    return () => {
      t.kill()
    }
  }, [label])

  // ── OVERLAY mode ─────────────────────────────────────────────────────────
  if (mode === 'overlay') {
    return (
      <div
        ref={rootRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse 90% 75% at 50% 48%, rgba(92,32,180,0.2) 0%, #000 62%)',
        }}
      >
        {/* Ambient glow blob */}
        <div
          ref={glowRef}
          style={{
            position: 'absolute',
            width: 'min(520px, 58vw)',
            height: 'min(520px, 58vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(92,32,180,0.16) 40%, transparent 70%)',
            pointerEvents: 'none',
            opacity: 0.42,
          }}
        />

        <div style={{
          position: 'relative',
          width: 'min(400px, 52vw)',
          height: 'min(400px, 52vw)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div
            style={{
              position: 'absolute',
              inset: '10%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(152,84,255,0.3) 0%, rgba(87,39,167,0.18) 38%, rgba(0,0,0,0) 72%)',
              filter: 'blur(22px)',
              opacity: 0.9,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '15%',
              borderRadius: '50%',
              background:
                'conic-gradient(from 210deg, rgba(255,255,255,0) 0deg, rgba(239,178,255,0.2) 48deg, rgba(124,58,237,0.5) 116deg, rgba(96,165,250,0.18) 198deg, rgba(255,255,255,0) 270deg, rgba(239,178,255,0.16) 360deg)',
              filter: 'blur(14px) saturate(1.12)',
              mixBlendMode: 'screen',
              animation: 'lsCoreSpin 5.6s linear infinite',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '22%',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.26) 0%, rgba(255,236,255,0.16) 18%, rgba(177,104,255,0.14) 40%, rgba(10,10,18,0.02) 65%, rgba(10,10,18,0) 100%)',
              filter: 'blur(6px)',
              animation: 'lsCoreFloat 4.8s ease-in-out infinite alternate',
              pointerEvents: 'none',
            }}
          />
          {[0, 1, 2].map((ringIndex) => (
            <div
              key={ringIndex}
              style={{
                position: 'absolute',
                inset: `${16 + (ringIndex * 8)}%`,
                borderRadius: '50%',
                border: '1px solid rgba(239,178,255,0.18)',
                boxShadow: '0 0 22px rgba(124,58,237,0.16)',
                opacity: 0.46 - (ringIndex * 0.1),
                animation: `lsOrbitRing ${6 + (ringIndex * 1.4)}s linear infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Edge vignette to blend into bg */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 82% 82% at 50% 50%, transparent 38%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Status label */}
        {label && (
          <p
            ref={labelRef}
            style={{
              margin: '10px 0 0',
              fontSize: '12px',
              fontStyle: 'italic',
              letterSpacing: '0.1em',
              color: 'rgba(239,178,255,0.72)',
              textShadow: '0 0 10px rgba(167,72,255,0.38)',
            }}
          >
            {label}
          </p>
        )}

        <style>{`
          @keyframes lsOrbitRing {
            from { transform: rotate(0deg) scale(0.98); }
            50% { transform: rotate(180deg) scale(1.02); }
            to { transform: rotate(360deg) scale(0.98); }
          }

          @keyframes lsCoreSpin {
            from { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.04); }
            to { transform: rotate(360deg) scale(1); }
          }

          @keyframes lsCoreFloat {
            from { transform: translate3d(-6px, -4px, 0) scale(0.98); }
            to { transform: translate3d(6px, 5px, 0) scale(1.03); }
          }
        `}</style>
      </div>
    )
  }

  // ── FILL mode ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          inset: '12%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(92,32,180,0.1) 50%, transparent 72%)',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      />

      {/* Edge vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 78% 78% at 50% 50%, transparent 35%, rgba(6,6,11,0.6) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Status label */}
      {label && (
        <p
          ref={labelRef}
          style={{
            position: 'absolute',
            bottom: '20px',
            margin: 0,
            fontSize: '13px',
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            color: 'rgba(239,178,255,0.7)',
            textShadow: '0 0 12px rgba(167,72,255,0.42)',
          }}
        >
          {label}
        </p>
      )}
    </div>
  )
}
