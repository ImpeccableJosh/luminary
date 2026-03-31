import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useConversation } from '@elevenlabs/react'
import { renderManim, createObjectUrl, summarizeText } from '@/lib/api'
import GreetingView from '@/components/GreetingView'
import ClassroomView from '@/components/ClassroomView'

const SPACE_KEYWORDS = [
  'space', 'solar', 'solar system', 'planet', 'planets',
  'earth', 'mars', 'sun', 'moon', 'mercury', 'venus', 'jupiter',
  'saturn', 'uranus', 'neptune', 'pluto', 'orbit', 'galaxy',
  'astronomy', 'asteroid', 'comet',
] as const

function isSpaceRelatedQuery(input: string) {
  const text = input.toLowerCase()
  return SPACE_KEYWORDS.some((keyword) => text.includes(keyword))
}

export interface LessonInfo {
  topic: string
  subject: string
}

export interface CompletedTopic {
  id: string
  title: string
  summary?: string
  keyPoints?: string[]
  videoUrl: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
}

type AppView = 'greeting' | 'classroom'

const AUTO_KICKOFF_MESSAGE = 'Hi'
const AUTO_KICKOFF_DELAY_MS = 900
const CONNECTION_FALLBACK_DELAY_MS = 2800
const PRIMARY_TRANSPORT: ConversationTransport = 'websocket'
const SECONDARY_TRANSPORT: ConversationTransport = 'webrtc'
type ConversationTransport = 'webrtc' | 'websocket'

export default function App() {
  const [view, setView] = useState<AppView>('greeting')
  const [lessonInfo, setLessonInfo] = useState<LessonInfo | null>(null)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [completedTopics, setCompletedTopics] = useState<CompletedTopic[]>([])
  const [startError, setStartError] = useState<string | null>(null)
  const [textMode, setTextMode] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSpaceMode, setIsSpaceMode] = useState(false)
  const autoKickoffTimerRef = useRef<number | null>(null)
  const connectionFallbackTimerRef = useRef<number | null>(null)
  const pendingAutoKickoffMessageRef = useRef<string | null>(null)
  const sawAgentResponseRef = useRef(false)
  const activeTransportRef = useRef<ConversationTransport>(PRIMARY_TRANSPORT)

  const clearAutoKickoffTimer = useCallback(() => {
    if (autoKickoffTimerRef.current !== null) {
      window.clearTimeout(autoKickoffTimerRef.current)
      autoKickoffTimerRef.current = null
    }
  }, [])

  const markAgentResponsive = useCallback(() => {
    sawAgentResponseRef.current = true
    clearAutoKickoffTimer()
    if (connectionFallbackTimerRef.current !== null) {
      window.clearTimeout(connectionFallbackTimerRef.current)
      connectionFallbackTimerRef.current = null
    }
  }, [clearAutoKickoffTimer])

  const clearConnectionFallbackTimer = useCallback(() => {
    if (connectionFallbackTimerRef.current !== null) {
      window.clearTimeout(connectionFallbackTimerRef.current)
      connectionFallbackTimerRef.current = null
    }
  }, [])

  const scheduleAutoKickoff = useCallback((conversationApi: { sendUserMessage: (text: string) => void }) => {
    clearAutoKickoffTimer()
    sawAgentResponseRef.current = false
    pendingAutoKickoffMessageRef.current = null
    autoKickoffTimerRef.current = window.setTimeout(() => {
      if (sawAgentResponseRef.current) {
        return
      }

      pendingAutoKickoffMessageRef.current = AUTO_KICKOFF_MESSAGE
      conversationApi.sendUserMessage(AUTO_KICKOFF_MESSAGE)
    }, AUTO_KICKOFF_DELAY_MS)
  }, [clearAutoKickoffTimer])

  const scheduleConnectionFallback = useCallback((
    conversationApi: {
      startSession: (options: { agentId: string; connectionType: ConversationTransport }) => Promise<string>
      endSession: () => Promise<void>
      sendUserMessage: (text: string) => void
    },
  ) => {
    clearConnectionFallbackTimer()

    if (activeTransportRef.current !== PRIMARY_TRANSPORT) {
      return
    }

    connectionFallbackTimerRef.current = window.setTimeout(async () => {
      if (sawAgentResponseRef.current || activeTransportRef.current !== PRIMARY_TRANSPORT) {
        return
      }

      try {
        await conversationApi.endSession()
        activeTransportRef.current = SECONDARY_TRANSPORT
        await conversationApi.startSession({
          agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
          connectionType: SECONDARY_TRANSPORT,
        })
        scheduleAutoKickoff(conversationApi)
      } catch (error) {
        setStartError(error instanceof Error ? error.message : 'Failed to reconnect to agent.')
      }
    }, CONNECTION_FALLBACK_DELAY_MS)
  }, [clearConnectionFallbackTimer, scheduleAutoKickoff])

  useEffect(() => {
    document.documentElement.dataset.luminaryLessonMode = isSpaceMode ? 'space' : 'default'
    return () => {
      delete document.documentElement.dataset.luminaryLessonMode
    }
  }, [isSpaceMode])

  useEffect(() => () => {
    clearAutoKickoffTimer()
    clearConnectionFallbackTimer()
  }, [clearAutoKickoffTimer, clearConnectionFallbackTimer])

  // Tool: agent calls this when user tells it what they want to learn
  const handleStartLesson = useCallback(
    async ({ topic, subject }: { topic: string; subject: string }) => {
      setLessonInfo({ topic, subject })
      setIsSpaceMode(isSpaceRelatedQuery(`${topic} ${subject}`))
      setView('classroom')
      return `Opened classroom for ${topic}. You're now teaching ${subject}.`
    },
    [],
  )

  // Tool: agent calls this to show a Manim animation for a concept
  const handleRenderAnimation = useCallback(
    async ({ description }: { description: string }) => {
      setIsSpaceMode(isSpaceRelatedQuery(description))
      setIsRendering(true)
      try {
        const blob = await renderManim(description)
        const url = createObjectUrl(blob)
        setCurrentVideoUrl(url)
        const id = String(Date.now())
        const title = description.length > 55 ? description.slice(0, 55) + '…' : description

        // Add immediately for snappy UI, then backfill summary.
        setCompletedTopics((prev) => ([...prev, { id, title, videoUrl: url }]))

        summarizeText(description)
          .then((s) => {
            setCompletedTopics((prev) => prev.map((t) => (
              t.id === id ? { ...t, summary: s.summary, keyPoints: s.keyPoints } : t
            )))
          })
          .catch(() => {
            // keep title-only; summary is optional.
          })
        return 'The animation is now on the board.'
      } catch {
        return 'Animation failed. Continue explaining verbally.'
      } finally {
        setIsRendering(false)
      }
    },
    [],
  )

  const clientTools = useMemo(
    () => ({
      start_lesson: handleStartLesson,
      render_animation: handleRenderAnimation,
    }),
    [handleStartLesson, handleRenderAnimation],
  )

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      setStartError(null)
    },
    onError: (error: unknown) => {
      setStartError(error instanceof Error ? error.message : String(error || 'Failed to connect to agent.'))
    },
    onMessage: ({ message, source }) => {
      if (source === 'ai') {
        markAgentResponsive()
      }

      if (source === 'user') {
        if (pendingAutoKickoffMessageRef.current === message) {
          pendingAutoKickoffMessageRef.current = null
          return
        }

        setIsSpaceMode(isSpaceRelatedQuery(message))
      }
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + Math.random()), role: source as 'user' | 'ai', text: message },
      ])
    },
    onModeChange: ({ mode }) => {
      if (mode === 'speaking') {
        markAgentResponsive()
      }
    },
  })

  const handleEnterDirectly = useCallback((topic: string, subject: string) => {
    setLessonInfo({ topic, subject })
    setIsSpaceMode(isSpaceRelatedQuery(`${topic} ${subject}`))
    setTextMode(true) // text-based entry — show chat panel immediately
    setView('classroom')
    // Kick off an intro animation immediately on manual entry
    handleRenderAnimation({ description: `Introduction to ${topic} in ${subject}` })
  }, [handleRenderAnimation])

  const handleSendMessage = useCallback(async (text: string) => {
    setIsSpaceMode(isSpaceRelatedQuery(text))
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), role: 'user', text },
    ])
    const result = await handleRenderAnimation({ description: text })
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now() + 1), role: 'ai', text: result ?? 'Done.' },
    ])
  }, [handleRenderAnimation])

  const startConversation = useCallback(async () => {
    setStartError(null)
    try {
      const permissionsApi = navigator.permissions
      let permissionState: PermissionState | null = null

      if (permissionsApi?.query) {
        try {
          const status = await permissionsApi.query({ name: 'microphone' as PermissionName })
          permissionState = status.state
        } catch {
          permissionState = null
        }
      }

      if (permissionState !== 'granted') {
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        permissionStream.getTracks().forEach((track) => track.stop())
      }
    } catch (e) {
      setStartError('Microphone access denied. Please allow mic access and try again.')
      return
    }
    try {
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        connectionType: PRIMARY_TRANSPORT,
      })
      activeTransportRef.current = PRIMARY_TRANSPORT
      scheduleAutoKickoff(conversation)
      scheduleConnectionFallback(conversation)
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Failed to connect to agent.')
      clearAutoKickoffTimer()
      clearConnectionFallbackTimer()
    }
  }, [clearAutoKickoffTimer, clearConnectionFallbackTimer, conversation, scheduleAutoKickoff, scheduleConnectionFallback])

  const endConversation = useCallback(async () => {
    clearAutoKickoffTimer()
    clearConnectionFallbackTimer()
    pendingAutoKickoffMessageRef.current = null
    sawAgentResponseRef.current = false
    activeTransportRef.current = PRIMARY_TRANSPORT
    await conversation.endSession()
  }, [clearAutoKickoffTimer, clearConnectionFallbackTimer, conversation])

  if (view === 'greeting') {
    return (
      <GreetingView
        status={conversation.status}
        isSpeaking={conversation.isSpeaking}
        onStart={startConversation}
        onStop={endConversation}
        onEnterDirectly={handleEnterDirectly}
        error={startError}
      />
    )
  }

  return (
    <ClassroomView
      lessonInfo={lessonInfo!}
      isTalking={conversation.isSpeaking}
      currentVideoUrl={currentVideoUrl}
      isRendering={isRendering}
      completedTopics={completedTopics}
      onSelectTopic={setCurrentVideoUrl}
      conversationStatus={conversation.status}
      isSpaceMode={isSpaceMode}
      textMode={textMode}
      onToggleTextMode={() => setTextMode((v) => !v)}
      messages={messages}
      onSendMessage={handleSendMessage}
    />
  )
}
