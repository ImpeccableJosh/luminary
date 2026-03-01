// TeacherPanel — Three.js teacher with FBX breathing-idle animation.
// Starts in idle by default and speeds up slightly while speaking.

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { useAnimations } from '@react-three/drei'
import { Group } from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

interface Props {
  isTalking: boolean
}

// ── Inner mesh component (runs inside <Canvas>) ───────────────────────────
function TeacherModel({ isTalking }: Props) {
  const sourceFbx = useLoader(FBXLoader, '/models/teacher/idle.fbx')
  const model = useMemo(() => sourceFbx.clone(), [sourceFbx])
  const groupRef = useRef<Group>(null)
  const { actions, mixer } = useAnimations(model.animations, groupRef)

  // Start idle animation (preferred by name, else first clip)
  useEffect(() => {
    const all = Object.values(actions).filter(
      (action): action is NonNullable<(typeof actions)[string]> => action !== null,
    )
    if (!all.length) return
    const idleByName = all.find((action) => action.getClip().name.toLowerCase().includes('idle'))
    const idleAction = idleByName ?? all[0]

    all.forEach((action) => action.stop())
    idleAction.reset().fadeIn(0.35).play()

    return () => {
      all.forEach((action) => action.fadeOut(0.2))
    }
  }, [actions])

  // Speed up animation slightly while speaking; reset on silence
  useEffect(() => {
    mixer.timeScale = isTalking ? 1.25 : 1.0
  }, [isTalking, mixer])

  return (
    <group ref={groupRef}>
      <primitive
        object={model}
        scale={0.01}
        position={[0, -0.9, 0]}
      />
    </group>
  )
}

// ── Panel shell (regular DOM + Canvas) ───────────────────────────────────
export default function TeacherPanel({ isTalking }: Props) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #0d0d1a 0%, #1a0a2e 60%, #0f1a2e 100%)',
    }}>
      <Canvas
        camera={{ position: [0, 0.8, 3.5], fov: 50 }}
        gl={{ antialias: true }}
        shadows={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Key light */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        {/* Cool fill from behind for depth */}
        <directionalLight position={[-1, 1, -2]} intensity={0.25} color="#4466ff" />

        <Suspense fallback={null}>
          <TeacherModel isTalking={isTalking} />
        </Suspense>
      </Canvas>

      {/* Status label */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: isTalking ? 'rgba(74,222,128,0.8)' : 'rgba(164,228,255,0.5)',
        }}>
          {isTalking ? 'Speaking' : 'Listening'}
        </span>
      </div>
    </div>
  )
}
