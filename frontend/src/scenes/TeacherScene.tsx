// TeacherScene — runs in a separate spatial window.
// Listens on BroadcastChannel 'luminary-scene-sync' for { type: 'teacher-state', isTalking }
// and drives the 3D teacher avatar accordingly.

import { useState, useEffect } from 'react'
import TeacherPanelTabs from '@/components/TeacherPanelTabs'
import { SpatialSidePanel } from '@/components/spatial/SpatialClassroom'

export default function TeacherScene() {
  const [isTalking, setIsTalking] = useState(false)
  const [isSpaceMode, setIsSpaceMode] = useState(false)

  useEffect(() => {
    const channel = new BroadcastChannel('luminary-scene-sync')
    channel.postMessage({ type: 'teacher-scene-ready' })
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'teacher-state') {
        setIsTalking(e.data.isTalking)
      }
      if (e.data?.type === 'teacher-mode') {
        setIsSpaceMode(Boolean(e.data.isSpaceMode))
      }
    }
    channel.addEventListener('message', onMessage)
    return () => {
      channel.removeEventListener('message', onMessage)
      channel.close()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', padding: '10px' }}>
      <SpatialSidePanel
        kind={isSpaceMode ? 'solar' : 'teacher'}
        style={{ width: '100%', height: '100%' }}
      >
        <TeacherPanelTabs isTalking={isTalking} isSpaceMode={isSpaceMode} />
      </SpatialSidePanel>
    </div>
  )
}
