"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Editor from "@monaco-editor/react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import { useRoomSocket } from "@/hooks/useRoomSocket"
import { Users, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CollaborativeEditorProps {
  roomId: string
}

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
]

// Debounce helper
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const { roomMessages, members } = useRoom()
  const { user } = useAuth()
  const { sendCodeChange, onCodeUpdated } = useRoomSocket(user?._id)

  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const codeRef = useRef(code) // Keep ref to avoid stale closures

  // Update ref when code changes
  useEffect(() => {
    codeRef.current = code
  }, [code])

  // Listen for code updates from others
  useEffect(() => {
    const unsubscribe = onCodeUpdated((data) => {
      const { userId, code: remoteCode, language: remoteLang } = data
      if (userId === user?._id) return // Ignore self

      // If language differs, you may want to sync language too
      if (remoteLang && remoteLang !== language) {
        setLanguage(remoteLang)
      }

      // Update code if different
      if (remoteCode !== codeRef.current) {
        setCode(remoteCode)
        toast.info(`Code updated by ${members.find(m => m.user._id === userId)?.user.name || "a member"}`)
      }

      // Track active editors
      setConnectedUsers((prev) => new Set(prev).add(userId))
      // Remove after 5 seconds of no updates (simple heuristic)
      setTimeout(() => {
        setConnectedUsers((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }, 5000)
    })

    return () => unsubscribe()
  }, [user?._id, language, members, onCodeUpdated])

  // Debounced emit function
  const debouncedEmit = useCallback(
    debounce((c: string, lang: string) => {
      sendCodeChange(roomId, c, lang)
    }, 300),
    [roomId, sendCodeChange],
  )

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || ""
    setCode(newCode)
    // Emit change
    debouncedEmit(newCode, language)
  }

  const editorOptions = {
    minimap: { enabled: true } as const,
    fontSize: 14,
    lineNumbers: "on" as const,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    tabSize: 2,
    // Show cursors from other users? Monaco doesn't support multiple cursors out of the box without decorations
  }

  // Get editor language for Monaco
  const getMonacoLanguage = (lang: string): string => {
    const map: Record<string, string> = {
      javascript: "javascript",
      typescript: "typescript",
      python: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rust: "rust",
    }
    return map[lang] || lang
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border-2 border-sidebar-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-sidebar-border bg-[#f3e8ff]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-black">Collaborative Editor</span>
          <div className="flex items-center gap-1 text-xs">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>
          {connectedUsers.size > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users className="w-4 h-4" />
              <span>{connectedUsers.size} editing</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1 border-2 border-sidebar-border rounded bg-white font-bold text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Users Bar */}
      {connectedUsers.size > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-gray-600">Active:</span>
          {Array.from(connectedUsers).map((userId) => {
            const member = members.find((m) => m.user._id === userId)
            return (
              <div
                key={userId}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-sidebar-border rounded-full text-xs"
              >
                <div className="w-4 h-4 rounded-full bg-[#39ff14] flex items-center justify-center text-[10px] font-bold">
                  {member?.user.name[0] || "U"}
                </div>
                <span className="max-w-[80px] truncate">{member?.user.name || "Unknown"}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage={getMonacoLanguage(language)}
          language={getMonacoLanguage(language)}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={editorOptions}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t-2 border-sidebar-border bg-[#f3e8ff] text-xs text-gray-600 flex items-center justify-between">
        <span>
          {code.length} characters · {code.split("\n").length} lines
        </span>
        <span className="italic">Changes sync automatically</span>
      </div>
    </div>
  )
}
