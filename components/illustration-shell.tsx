"use client"

import { useEffect, useRef } from "react"

export function IllustrationShell() {
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

    // Animation variables
    let animationId: number
    let time = 0

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw brain/neural network visualization
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.3

      // Draw central orb
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, "rgba(91, 140, 255, 0.8)")
      gradient.addColorStop(0.5, "rgba(56, 225, 184, 0.4)")
      gradient.addColorStop(1, "rgba(91, 140, 255, 0.1)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw neural connections
      const nodes = 8
      for (let i = 0; i < nodes; i++) {
        const angle = (i / nodes) * Math.PI * 2 + time * 0.001
        const nodeX = centerX + Math.cos(angle) * radius * 1.5
        const nodeY = centerY + Math.sin(angle) * radius * 1.5

        // Draw connection lines
        ctx.strokeStyle = `rgba(56, 225, 184, ${0.3 + Math.sin(time * 0.002 + i) * 0.2})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(nodeX, nodeY)
        ctx.stroke()

        // Draw nodes
        ctx.fillStyle = "rgba(155, 240, 11, 0.8)"
        ctx.beginPath()
        ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw pulsing effect
      const pulseRadius = radius * (1 + Math.sin(time * 0.003) * 0.1)
      ctx.strokeStyle = "rgba(91, 140, 255, 0.3)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.stroke()

      time += 16
      animationId = requestAnimationFrame(animate)
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!prefersReducedMotion) {
      animate()
    } else {
      // Static version for reduced motion
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * 0.3

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, "rgba(91, 140, 255, 0.8)")
      gradient.addColorStop(0.5, "rgba(56, 225, 184, 0.4)")
      gradient.addColorStop(1, "rgba(91, 140, 255, 0.1)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
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
  }, [])

  return (
    <div className="relative w-full h-96 md:h-[500px]">
      {/* Canvas for AI brain visualization */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
        aria-label="AI brain visualization showing neural network connections"
      />

      {/* Fallback image for accessibility */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none">
        <img
          src="/ai-brain-medical-analysis.png"
          alt="AI brain neural network for medical analysis"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Glow effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 blur-3xl" />
    </div>
  )
}
