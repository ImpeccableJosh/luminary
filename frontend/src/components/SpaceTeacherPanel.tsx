import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Model, type ModelRef } from '@webspatial/react-sdk'

const EARTH_MODEL_SRC = `${__XR_ENV_BASE__}/models/teacher/earth-1-12756.usdz`
const SUN_MODEL_SRC = `${__XR_ENV_BASE__}/models/teacher/sun-1-1391000.usdz`
const MARS_MODEL_SRC = `${__XR_ENV_BASE__}/models/teacher/mars-1-6792.usdz`
const TEACHER_POSITION = { x: 0, y: -0.18 } as const

interface Props {
  isTalking: boolean
}

export default function SpaceTeacherPanel({ isTalking }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const earthRef = useRef<ModelRef | null>(null)
  const marsRef = useRef<ModelRef | null>(null)

  useEffect(() => {
    const stageElement = stageRef.current
    const earthElement = earthRef.current
    const marsElement = marsRef.current

    if (!stageElement || !earthElement || !marsElement) return

    gsap.killTweensOf(stageElement)
    gsap.killTweensOf(earthElement)
    gsap.killTweensOf(marsElement)

    gsap.set(stageElement, { x: 0, y: 0, rotation: 0 })

    const orbitDuration = isTalking ? 5.8 : 7.2
    const earthRadiusX = 150
    const earthRadiusY = 150
    const marsRadiusX = 300
    const marsRadiusY = 300

    const resetModelTransform = (element: ModelRef) => {
      const modelTransform = element.entityTransform
      modelTransform.m11 = 1
      modelTransform.m12 = 0
      modelTransform.m13 = 0
      modelTransform.m14 = 0
      modelTransform.m21 = 0
      modelTransform.m22 = 1
      modelTransform.m23 = 0
      modelTransform.m24 = 0
      modelTransform.m31 = 0
      modelTransform.m32 = 0
      modelTransform.m33 = 1
      modelTransform.m34 = 0
      modelTransform.m41 = 0
      modelTransform.m42 = 0
      modelTransform.m43 = 0
      modelTransform.m44 = 1
    }

    const applyOrbit = (element: ModelRef, angleDegrees: number, radiusX: number, radiusY: number) => {
      const radians = (angleDegrees * Math.PI) / 180
      const x = Math.cos(radians) * radiusX
      const y = Math.sin(radians) * radiusY
      element.style.left = `calc(50% + ${x}px)`
      element.style.top = `calc(50% + ${y}px)`
      element.style.transform = 'none'
      resetModelTransform(element)
    }

    earthElement.style.left = '50%'
    earthElement.style.top = '50%'
    earthElement.style.transform = 'none'
    marsElement.style.left = '50%'
    marsElement.style.top = '50%'
    marsElement.style.transform = 'none'

    const earthOrbitState = { angle: 0 }
    const marsOrbitState = { angle: 0 }
    applyOrbit(earthElement, earthOrbitState.angle, earthRadiusX, earthRadiusY)
    applyOrbit(marsElement, marsOrbitState.angle, marsRadiusX, marsRadiusY)

    const earthOrbit = gsap.to(earthOrbitState, {
      angle: 360,
      duration: orbitDuration,
      repeat: -1,
      ease: 'none',
      overwrite: 'auto',
      onUpdate: () => applyOrbit(earthElement, earthOrbitState.angle, earthRadiusX, earthRadiusY),
    })

    const marsOrbit = gsap.to(marsOrbitState, {
      angle: 360,
      duration: orbitDuration,
      repeat: -1,
      ease: 'none',
      overwrite: 'auto',
      onUpdate: () => applyOrbit(marsElement, marsOrbitState.angle, marsRadiusX, marsRadiusY),
    })

    return () => {
      earthOrbit.kill()
      marsOrbit.kill()
    }
  }, [isTalking])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        position: 'relative',
      }}
    >
      <div
        ref={stageRef}
        enable-xr-monitor
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'visible',
          transform: `translate3d(${TEACHER_POSITION.x * 100}px, ${TEACHER_POSITION.y * 100}px, 0)`,
          transformOrigin: '50% 50%',
        }}
      >
        <Model
          enable-xr
          src={SUN_MODEL_SRC}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '20%',
            height: '20%',
            marginLeft: '-10%',
            marginTop: '-10%',
            transform: 'translate3d(0px, 0px, 60px)',
            display: 'block',
            background: 'transparent',
          }}
        />

        <Model
          ref={earthRef}
          enable-xr
          src={EARTH_MODEL_SRC}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '10%',
            height: '10%',
            marginLeft: '-8%',
            marginTop: '-8%',
            display: 'block',
            background: 'transparent',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        />

        <Model
          ref={marsRef}
          enable-xr
          src={MARS_MODEL_SRC}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '8%',
            height: '8%',
            marginLeft: '-6.5%',
            marginTop: '-6.5%',
            display: 'block',
            background: 'transparent',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: 0,
          right: 0,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(164,228,255,0.5)',
          }}
        >
          Solar
        </span>
      </div>
    </div>
  )
}
