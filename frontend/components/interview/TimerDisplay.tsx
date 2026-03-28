"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TimerDisplayProps {
  duration: number // total duration in seconds
  timeRemaining: number
  isActive: boolean
}

export default function TimerDisplay({ duration, timeRemaining, isActive }: TimerDisplayProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    setProgress((timeRemaining / duration) * 100)
  }, [timeRemaining, duration])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Determine color based on remaining time
  const getTimerColor = (): string => {
    if (progress > 50) return "text-green-600"
    if (progress > 25) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (): string => {
    if (progress > 50) return "bg-green-500"
    if (progress > 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 flex items-center justify-center bg-white border-2 border-sidebar-border rounded-lg overflow-hidden">
        {/* Progress bar background */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200">
          <div
            className={cn("h-full transition-all duration-1000", getProgressColor())}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Time display */}
        <span
          className={cn("text-2xl font-extrabold tabular-nums", getTimerColor())}
        >
          {formatTime(timeRemaining)}
        </span>
      </div>
      <div className="text-xs font-bold text-gray-600">
        {isActive ? "⏳ In Progress" : "⏸ Paused"}
      </div>
    </div>
  )
}
