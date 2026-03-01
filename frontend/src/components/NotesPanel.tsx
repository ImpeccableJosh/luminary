interface NoteItem {
  id: string
  text: string
  createdAt: number
}

interface NotesPanelProps {
  draft: string
  notes: NoteItem[]
  onDraftChange: (value: string) => void
  onAddNote: () => void
  isAddDisabled: boolean
}

export default function NotesPanel({
  draft,
  notes,
  onDraftChange,
  onAddNote,
  isAddDisabled,
}: NotesPanelProps) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(160deg, rgba(124,58,237,0.08) 0%, rgba(92,32,180,0.03) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(167,72,255,0.2)',
      boxShadow: 'inset 0 0 0 1px rgba(167,72,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(167,72,255,0.12)',
        flexShrink: 0,
      }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#efb2ff',
          textShadow: '0 0 10px rgba(239,178,255,0.4), 0 0 22px rgba(167,72,255,0.2)',
          margin: 0,
        }}>
          Notes
        </p>
      </div>

      {/* Input area */}
      <div style={{
        padding: '10px',
        borderBottom: '1px solid rgba(167,72,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(92,32,180,0.04)',
      }}>
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              onAddNote()
            }
          }}
          placeholder="Type a note… (⌘ + Enter to save)"
          className="lm-note-area"
          style={{
            width: '100%',
            minHeight: '80px',
            resize: 'vertical',
            background: 'rgba(167,72,255,0.07)',
            border: '1px solid rgba(167,72,255,0.2)',
            borderRadius: '8px',
            padding: '10px',
            color: 'white',
            fontSize: '12px',
            lineHeight: 1.4,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={onAddNote}
          disabled={isAddDisabled}
          style={{
            alignSelf: 'flex-end',
            padding: '7px 14px',
            borderRadius: '8px',
            border: 'none',
            background: isAddDisabled
              ? 'rgba(124,58,237,0.18)'
              : 'linear-gradient(135deg, rgba(167,72,255,0.82), rgba(124,58,237,0.88))',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            cursor: isAddDisabled ? 'default' : 'pointer',
            opacity: isAddDisabled ? 0.4 : 1,
            transition: 'all 0.2s',
            boxShadow: isAddDisabled ? 'none' : '0 0 12px rgba(124,58,237,0.25)',
          }}
        >
          Save note
        </button>
      </div>

      {/* Notes list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {notes.length === 0 && (
          <p style={{
            color: 'rgba(239,178,255,0.25)',
            fontSize: '12px',
            textAlign: 'center',
            padding: '24px 8px',
            fontStyle: 'italic',
          }}>
            Your saved notes will appear here
          </p>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(167,72,255,0.08)',
              border: '1px solid rgba(167,72,255,0.15)',
            }}
          >
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: 'rgba(239,178,255,0.82)',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {note.text}
            </p>
            <p style={{
              margin: '8px 0 0',
              fontSize: '10px',
              color: 'rgba(239,178,255,0.32)',
            }}>
              {new Date(note.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .lm-note-area::placeholder { color: rgba(239,178,255,0.28); }
        .lm-note-area:focus { border-color: rgba(167,72,255,0.45); }
      `}</style>
    </div>
  )
}
