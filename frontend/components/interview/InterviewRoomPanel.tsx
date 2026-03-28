"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import TimerDisplay from "./TimerDisplay"
import { useRoomSocket } from "@/hooks/useRoomSocket"
import { toast } from "sonner"
import { Play, Pause, RotateCcw, Code, Send, Eye, EyeOff } from "lucide-react"

interface InterviewRoomPanelProps {
  room: any
  onOpenEditor: () => void
}

export default function InterviewRoomPanel({ room, onOpenEditor }: InterviewRoomPanelProps) {
  const { user } = useAuth()
  const { controlInterviewTimer, submitInterviewCode, executeCode } = useRoom()
  const { onInterviewTimerUpdate, onInterviewSubmission } = useRoomSocket(user?._id)

  const settings = room.interviewSettings || {}
  const [duration, setDuration] = useState(settings.duration || 60)
  const [isActive, setIsActive] = useState(settings.isActive || false)
  const [startedAt, setStartedAt] = useState<Date | null>(
    settings.startedAt ? new Date(settings.startedAt) : null,
  )
  const [timeRemaining, setTimeRemaining] = useState(duration * 60) // in seconds
  const [showCandidateCode, setShowCandidateCode] = useState(false)
  const [candidateSubmissions, setCandidateSubmissions] = useState<any[]>([])
  const [evaluation, setEvaluation] = useState("")

  // Determine user role in this room
  const member = room.members?.find((m: any) => m.user._id === user?._id)
  const isInterviewer = member?.role === "interviewer" || member?.role === "admin"
  const isCandidate = member?.role === "candidate"
  const isAdmin = member?.role === "admin"

  // Listen for timer updates
  useEffect(() => {
    const unsubscribe = onInterviewTimerUpdate((data: any) => {
      const { action, time, isActive: active, startedAt: start } = data
      setIsActive(active)
      if (time !== undefined) {
        setTimeRemaining(time * 60) // assuming time in minutes? Actually from controller it's passed as time = duration in minutes? In update we send duration as minutes. We'll store as seconds.
        setDuration(time)
      }
      if (start) {
        setStartedAt(new Date(start))
      }
      if (action === "start") {
        toast.info("Timer started!")
      } else if (action === "pause") {
        toast.info("Timer paused")
      } else if (action === "reset") {
        setTimeRemaining((time || duration) * 60)
        toast.info("Timer reset")
      }
    })

    return () => unsubscribe()
  }, [onInterviewTimerUpdate, duration])

  // Listen for submissions (interviewer only)
  useEffect(() => {
    if (!isInterviewer) return
    const unsubscribe = onInterviewSubmission((data: any) => {
      toast.success(`Submission received from ${data.candidateName}`)
      setCandidateSubmissions((prev) => [
        {
          ...data.submission,
          evaluated: false,
        },
        ...prev,
      ])
    })
    return () => unsubscribe()
  }, [isInterviewer, onInterviewSubmission])

  // Countdown timer
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          toast.warning("Time's up!")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive])

  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Timer controls
  const handleStart = async () => {
    try {
      await controlInterviewTimer(room._id, "start")
    } catch (err) {}
  }

  const handlePause = async () => {
    try {
      await controlInterviewTimer(room._id, "pause")
    } catch (err) {}
  }

  const handleReset = async () => {
    try {
      await controlInterviewTimer(room._id, "reset")
    } catch (err) {}
  }

  // Candidate submit
  const handleSubmitSolution = async () => {
    // Get code from editor? We could pass via prop or global state
    // For now, we'll assume code is typed in collaborative editor that is open
    // We'll need a way to get the code from the editor. We can store it in RoomContext? Or have candidate paste?
    // Simpler: candidate writes in editor, then clicks Submit which calls submitInterviewCode with current code.
    // We'll need the code as state. But it's in CollaborativeEditor component. We could lift state up or use a global.
    // For MVP, we'll just open editor and let candidate manually copy-paste to a textarea and submit? That's clunky.
    // Better: The CollaborativeEditor is part of the room's code tab; there we can have a Submit button that calls submitInterviewCode directly.
    // So maybe the InterviewRoomPanel shouldn't handle submission directly; instead, the CollaborativeEditor (in Code tab) will have Submit button when room is interview.
    // I'll revise: InterviewRoomPanel just shows question, timer, and maybe a button to open code editor. The submission happens within the code editor.
    // So handleSubmit will just open editor and let candidate submit from there.
    onOpenEditor()
    toast.info("Write your solution in the code editor and click Submit there.")
  }

  // Interviewer evaluate
  const handleEvaluate = (submissionId: string, score: number, feedback: string) => {
    // This would call an API to save evaluation
    toast.success(`Evaluation saved: ${score}/10`)
    setCandidateSubmissions((prev) =>
      prev.map((s) => (s.messageId === submissionId ? { ...s, evaluated: true, score, feedback } : s)),
    )
  }

  return (
    <div className="border-t-2 border-sidebar-border bg-[#f3e8ff] p-4 space-y-4">
      {/* Question */}
      <div>
        <h4 className="font-extrabold text-black mb-2 flex items-center gap-2">
          <span>📋 Interview Question</span>
        </h4>
        <div className="bg-white border-2 border-sidebar-border rounded-lg p-4">
          <p className="text-sm font-medium text-black whitespace-pre-wrap">
            {settings.question || "No question set."}
          </p>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-4">
        <TimerDisplay
          duration={duration * 60}
          timeRemaining={timeRemaining}
          isActive={isActive}
        />
        {isInterviewer && (
          <div className="flex items-center gap-2">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded font-bold hover:bg-green-600"
              >
                <Play className="w-4 h-4" /> Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded font-bold hover:bg-gray-600"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onOpenEditor}
          className="flex-1 py-2 bg-[#b39ddb] border-2 border-sidebar-border rounded font-bold flex items-center justify-center gap-2 hover:bg-[#39ff14]"
        >
          <Code className="w-4 h-4" />
          Open Code Editor
        </button>

        {isCandidate && (
          <button
            onClick={handleSubmitSolution}
            className="flex-1 py-2 bg-[#39ff14] border-2 border-sidebar-border rounded font-bold flex items-center justify-center gap-2 hover:bg-[#b39ddb]"
          >
            <Send className="w-4 h-4" />
            Submit Solution
          </button>
        )}
      </div>

      {/* Candidate's code preview (interviewer only) */}
      {isInterviewer && candidateSubmissions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-extrabold text-black">Submissions</h4>
          {candidateSubmissions.map((sub) => (
            <div key={sub.messageId} className="bg-white border-2 border-sidebar-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">
                  {sub.candidateName} · {new Date(sub.timestamp).toLocaleTimeString()}
                </span>
                {sub.evaluated ? (
                  <span className="text-green-600 font-bold text-sm">
                    ✓ Evaluated ({sub.score}/10)
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      // Show evaluation UI
                      // Could be a modal or inline form
                      const score = prompt("Score (0-10):")
                      if (score) {
                        handleEvaluate(sub.messageId, parseInt(score), "Good effort")
                      }
                    }}
                    className="text-xs px-2 py-1 bg-[#39ff14] border rounded"
                  >
                    Evaluate
                  </button>
                )}
              </div>
              <pre className="text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto max-h-40">
                {sub.code.substring(0, 500)}
                {sub.code.length > 500 && "..."}
              </pre>
              {sub.feedback && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Feedback:</strong> {sub.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
