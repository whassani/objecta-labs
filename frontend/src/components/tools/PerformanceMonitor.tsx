'use client'

import { useEffect, useState } from 'react'

/**
 * Component to monitor and display frontend performance metrics
 * Only visible in development mode
 */
export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    fps: number
    memory: number
    cacheSize: number
  }>({ fps: 0, memory: 0, cacheSize: 0 })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime

        // Get memory usage if available
        const memory = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
          : 0

        setMetrics({ fps, memory, cacheSize: 0 })
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(animationId)
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
      <div>FPS: {metrics.fps}</div>
      <div>Memory: {metrics.memory}MB</div>
    </div>
  )
}
