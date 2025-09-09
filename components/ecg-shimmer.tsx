"use client"

import { useEffect, useRef } from "react"

interface ECGShimmerProps {
  className?: string
  intensity?: "low" | "medium" | "high"
}

export function ECGShimmer({ className = "", intensity = "medium" }: ECGShimmerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    updateCanvasSize()

    let animationId: number
    let time = 0

    const getIntensitySettings = () => {
      switch (intensity) {
        case "low":
          return { amplitude: 0.3, frequency: 0.5, opacity: 0.3 }
        case "medium":
          return { amplitude: 0.5, frequency: 1, opacity: 0.5 }
        case "high":
          return { amplitude: 0.8, frequency: 1.5, opacity: 0.7 }
        default:
          return { amplitude: 0.5, frequency: 1, opacity: 0.5 }
      }
    }

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      const { amplitude, frequency, opacity } = getIntensitySettings()

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw ECG-like waveform
      ctx.strokeStyle = `rgba(56, 225, 184, ${opacity})`
      ctx.lineWidth = 2
      ctx.beginPath()

      const centerY = height / 2
      const waveLength = width / 4

      for (let x = 0; x < width; x++) {
        let y = centerY

        // Create ECG-like pattern with sharp peaks
        const progress = (x + time * frequency) % waveLength
        const normalizedProgress = progress / waveLength

        if (normalizedProgress < 0.1) {
          // P wave (small bump)
          y += Math.sin(normalizedProgress * Math.PI * 10) * amplitude * 10
        } else if (normalizedProgress < 0.3) {
          // Flat section
          y += 0
        } else if (normalizedProgress < 0.4) {
          // QRS complex (sharp spike)
          const qrsProgress = (normalizedProgress - 0.3) / 0.1
          if (qrsProgress < 0.3) {
            y -= qrsProgress * amplitude * 30 // Q wave (down)
          } else if (qrsProgress < 0.7) {
            y += (qrsProgress - 0.3) * amplitude * 80 // R wave (up)
          } else {
            y -= (qrsProgress - 0.7) * amplitude * 50 // S wave (down)
          }
        } else if (normalizedProgress < 0.6) {
          // T wave (rounded bump)
          const tProgress = (normalizedProgress - 0.4) / 0.2
          y += Math.sin(tProgress * Math.PI) * amplitude * 15
        }

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Add shimmer effect
      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, "transparent")
      gradient.addColorStop(0.4, `rgba(56, 225, 184, ${opacity * 0.3})`)
      gradient.addColorStop(0.6, `rgba(56, 225, 184, ${opacity * 0.6})`)
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      time += 2
      animationId = requestAnimationFrame(animate)
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!prefersReducedMotion) {
      animate()
    } else {
      // Static ECG line for reduced motion
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      const centerY = height / 2

      ctx.strokeStyle = "rgba(56, 225, 184, 0.3)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
    }

    const handleResize = () => {
      updateCanvasSize()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  )
}
