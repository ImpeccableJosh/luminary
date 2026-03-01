// TopicsPanel — right panel: scrollable list of completed animations
// Click any item to replay it in the BoardPanel

import type { CompletedTopic } from '@/App'

interface Props {
  topics: CompletedTopic[]
  currentVideoUrl: string | null
  onSelect: (url: string) => void
}

export default function TopicsPanel({ topics, currentVideoUrl, onSelect }: Props) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, rgba(124,58,237,0.10) 0%, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.015) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(167,139,250,0.18)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 14px 14px',
        borderBottom: '1px solid rgba(167,139,250,0.12)',
        flexShrink: 0,
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Subtle spark/glint layer */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(10px 10px at 18% 35%, rgba(239,178,255,0.18), transparent 60%),'
              + 'radial-gradient(12px 12px at 72% 30%, rgba(196,181,253,0.14), transparent 62%),'
              + 'radial-gradient(8px 8px at 56% 70%, rgba(124,58,237,0.14), transparent 60%)',
            opacity: 0.9,
            filter: 'blur(0.2px)',
            animation: 'lmSparkDrift 5.6s ease-in-out infinite',
            mixBlendMode: 'screen',
          }}
        />

        <p style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          // Flowing purple gradient text
          // A tiled gradient where the start == end, so the loop is seamless.
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(124,58,237,0.95) 0%, rgba(196,181,253,0.95) 30%, rgba(124,58,237,0.95) 60%, rgba(124,58,237,0.95) 100%)',
          backgroundSize: '200% 100%',
          backgroundPosition: '0% 50%',
          willChange: 'background-position',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.14))',
          animation: 'lessonHistoryFlow 4.8s linear infinite',
        }}>
          Lesson History
        </p>
        <p style={{
          margin: '6px 0 0',
          fontSize: '12px',
          fontWeight: 500,
          lineHeight: 1.25,
          color: 'rgba(196,181,253,0.75)',
        }}>
          Quick recap of what you covered.
        </p>
      </div>

      <style>{`
        @keyframes lessonHistoryFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: -200% 50%; }
        }

        @keyframes lmSparkDrift {
          0% { transform: translate3d(0, 0, 0); opacity: 0.75; }
          50% { transform: translate3d(0, 2px, 0); opacity: 0.92; }
          100% { transform: translate3d(0, 0, 0); opacity: 0.75; }
        }
      `}</style>

      {/* Topic list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {topics.length === 0 && (
          <p style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: '12px',
            textAlign: 'center',
            padding: '24px 8px',
            fontStyle: 'italic',
          }}>
            Completed topics will appear here
          </p>
        )}

        {[...topics].reverse().map((topic, i) => {
          const isActive = topic.videoUrl === currentVideoUrl
          return (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.videoUrl)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '10px',
                border: `1px solid ${isActive ? 'rgba(167,139,250,0.55)' : 'rgba(255,255,255,0.03)'}`,
                background: isActive
                  ? 'rgba(124,58,237,0.22)'
                  : 'rgba(255,255,255,0.025)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(167,139,250,0.08)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
              }}
            >
              {/* Index badge */}
              <span style={{
                flexShrink: 0,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: isActive ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 700,
                color: 'white',
                marginTop: '1px',
              }}>
                {topics.length - i}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.82)',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                }}>
                  {topic.summary ?? topic.title}
                </p>

                <p style={{
                  margin: '2px 0 0',
                  fontSize: '10px',
                  color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                }}>
                  {topic.summary ? topic.title : 'Generating summary…'}
                </p>

                {topic.keyPoints && topic.keyPoints.length > 0 && (
                  <div style={{
                    marginTop: '6px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}>
                    {topic.keyPoints.slice(0, 3).map((kp, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '9px',
                          padding: '3px 7px',
                          borderRadius: '999px',
                          border: `1px solid ${isActive ? 'rgba(196,181,253,0.30)' : 'rgba(255,255,255,0.07)'}`,
                          background: isActive ? 'rgba(196,181,253,0.10)' : 'rgba(255,255,255,0.02)',
                          color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {kp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
