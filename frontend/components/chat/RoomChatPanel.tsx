"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import EmojiPicker from "emoji-picker-react"
import { ModeToggle } from "../ui/mode-toggle"
import FilePreview from "./FilePreview"
import { toast } from "sonner"
import { Code, FileCode, Users, Timer as TimerIcon } from "lucide-react"
import CodeExecutionPanel from "../editor/CodeExecutionPanel"
import { Message } from "@/app/MessageContext"
import InterviewRoomPanel from "../interview/InterviewRoomPanel"
import { getToken } from "@/app/fetcher"

interface RoomChatPanelProps {
  onBack?: () => void
}

export default function RoomChatPanel({ onBack }: RoomChatPanelProps) {
  const { selectedRoom, roomMessages, sendRoomMessage, isLoading, error, sendTyping, typingUsers, members } =
    useRoom()
  const { user } = useAuth()
  const [input, setInput] = useState("")
  const messageEndRef = useRef<HTMLDivElement | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [attachedFilePreview, setAttachedFilePreview] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)
  const [showCodePanel, setShowCodePanel] = useState(false)
  const [codeSnippet, setCodeSnippet] = useState({ code: "", language: "javascript" })
  const [showFileInput, setShowFileInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [roomMessages])

  // Typing indicator cleanup
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Clear any stale typing indicators after 3s
    }, 3000)
    return () => clearTimeout(timeout)
  }, [typingUsers])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file)
      setAttachedFile(file)
      setAttachedFilePreview({
        url: previewUrl,
        name: file.name,
        type: file.type,
      })
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachedFile = () => {
    if (attachedFilePreview?.url) {
      URL.revokeObjectURL(attachedFilePreview.url)
    }
    setAttachedFile(null)
    setAttachedFilePreview(null)
  }

  const handleSend = async () => {
    if (!selectedRoom) return
    const trimmedInput = input.trim()
    if (!trimmedInput && !attachedFile && !codeSnippet.code) return

    try {
      // Upload file if present
      let fileInfo = attachedFilePreview
      if (attachedFile && attachedFilePreview) {
        toast.loading("Uploading file...")
        const token = getToken()
        const formData = new FormData()
        formData.append("file", attachedFile)

        const res = await fetch("http://localhost:8080/api/v1/files/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        toast.dismiss()
        if (!res.ok) {
          throw new Error("File upload failed")
        }
        const data = await res.json()
        fileInfo = {
          url: data.file.url,
          name: data.file.originalname,
          type: data.file.mimetype,
        }
      }

      if (codeSnippet.code) {
        await sendRoomMessage(
          selectedRoom._id,
          trimmedInput || "Code snippet",
          fileInfo || undefined,
          codeSnippet.code,
          codeSnippet.language,
        )
        setCodeSnippet({ code: "", language: "javascript" })
      } else {
        await sendRoomMessage(
          selectedRoom._id,
          trimmedInput,
          fileInfo || undefined,
        )
      }
      setInput("")
      removeAttachedFile()
      setShowCodePanel(false)
      setShowEmoji(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to send message")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (selectedRoom) {
      sendTyping(selectedRoom._id, true)
    }
  }

  const getTypingText = () => {
    const typingIds = Object.entries(typingUsers)
      .filter(([, isTyping]) => isTyping)
      .map(([userId]) => {
        const member = members.find((m) => m.user._id === userId)
        return member?.user.name || "Someone"
      })
    if (typingIds.length === 0) return ""
    if (typingIds.length === 1) return `${typingIds[0]} is typing...`
    if (typingIds.length === 2) return `${typingIds[0]} and ${typingIds[1]} are typing...`
    return `${typingIds.length} people are typing...`
  }

  const typingText = getTypingText()

  if (!selectedRoom) {
    return (
      <div className="flex flex-col flex-1 h-full bg-white items-center justify-center">
        <p className="text-gray-500 font-bold">Select a room to start chatting</p>
      </div>
    )
  }

  return (
    <main className="flex flex-col flex-1 h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-sidebar-border bg-background sticky top-0 z-10">
        {onBack && (
          <button
            className="md:hidden mr-2 p-2 rounded-full border-2 border-sidebar-border bg-[#b39ddb] hover:bg-[#39ff14] focus:outline-none"
            onClick={onBack}
            aria-label="Back to rooms list"
            tabIndex={-1}
          >
            ←
          </button>
        )}
        <div
          className="w-10 h-10 rounded-full bg-[#b39ddb] flex items-center justify-center text-xl font-extrabold border-2 border-sidebar-border cursor-pointer hover:opacity-80"
          title={`${selectedRoom.type === 'interview' ? '🎯' : '👥'} ${selectedRoom.name}`}
        >
          {selectedRoom.avatarUrl ? (
            <img
              src={selectedRoom.avatarUrl}
              alt={selectedRoom.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            selectedRoom.name[0]
          )}
        </div>
        <div className="flex justify-between w-full px-2">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-primary">
              {selectedRoom.name}
            </span>
            <span className="text-xs font-bold text-gray-500">
              {selectedRoom.type === "interview" ? "🎯 Interview Room" : "👥 Group Chat"}{" "}
              · {selectedRoom.members?.length || 0} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCodePanel(!showCodePanel)}
              className={`p-2 rounded-full border-2 border-sidebar-border hover:bg-[#b39ddb] ${
                showCodePanel ? "bg-[#39ff14]" : ""
              }`}
              title="Code Editor"
            >
              <Code className="w-5 h-5" />
            </button>
            {selectedRoom.type === "interview" && (
              <button
                onClick={() => {/* Open interview panel */}}
                className="p-2 rounded-full border-2 border-sidebar-border bg-[#b39ddb] hover:bg-[#39ff14]"
                title="Interview Controls"
              >
                <TimerIcon className="w-5 h-5" />
              </button>
            )}
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Interview Panel (if interview type) */}
      {selectedRoom.type === "interview" && (
        <InterviewRoomPanel room={selectedRoom} onOpenEditor={() => setShowCodePanel(true)} />
      )}

      {/* Typing Indicator */}
      {typingText && (
        <div className="px-4 py-1 text-xs text-gray-500 italic bg-[#f3e8ff]">
          {typingText}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#f3e8ff] dark:bg-accent">
        {roomMessages?.map((msg: Message, i: number) => {
          const isMe = msg.senderId === user?._id
          let time = ""
          if (msg.createdAt) {
            const date = new Date(msg.createdAt)
            time = date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          }

          return (
            <div
              key={msg._id || i}
              className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-xs md:max-w-md px-0 py-0 rounded-2xl border-2 font-medium text-base flex flex-col gap-1 shadow-sm ${
                  isMe
                    ? "bg-[#39ff14] text-black border-[#b39ddb] rounded-br-none items-end"
                    : "bg-white text-black border-[#39ff14] rounded-bl-none items-start"
                }`}
              >
                {/* Sender name (for group chat) */}
                {!isMe && (
                  <span className="px-4 pt-2 text-xs font-bold text-gray-500">
                    {msg.senderId?.name || "User"}
                  </span>
                )}

                {/* Message Content */}
                {msg.text && (
                  <span className="px-4 pb-1 pt-1 break-words text-base text-black">
                    {msg.text}
                  </span>
                )}

                {/* File Preview */}
                {(msg.fileUrl || msg.image) && (
                  <div className="m-2">
                    <FilePreview
                      url={msg.fileUrl || msg.image}
                      fileName={msg.fileName}
                      fileType={msg.fileType}
                    />
                  </div>
                )}

                {/* Code Snippet */}
                {msg.code && msg.language && (
                  <div className="m-2 border-2 border-[#b39ddb] rounded-lg overflow-hidden bg-gray-900">
                    <div className="bg-gray-800 px-3 py-1 text-xs text-gray-300 flex justify-between">
                      <span>{msg.language}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.code)
                          toast.success("Code copied!")
                        }}
                        className="text-[#39ff14] hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 overflow-x-auto text-sm text-gray-100">
                      <code>{msg.code}</code>
                    </pre>
                  </div>
                )}

                {/* Time */}
                <span className="flex items-center gap-1 text-xs text-gray-500 mt-1 self-end pr-3 pb-1">
                  {time}
                  {msg.seen && isMe && (
                    <span title="Read">✓✓</span>
                  )}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Code Snippet Panel */}
      {showCodePanel && (
        <div className="border-t-2 border-sidebar-border p-2 bg-[#f3e8ff]">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4" />
            <span className="text-xs font-bold">Code Snippet</span>
            <button
              type="button"
              onClick={() => setShowCodePanel(false)}
              className="ml-auto text-gray-500 hover:text-red-600"
            >
              ✕
            </button>
          </div>
          <textarea
            value={codeSnippet.code}
            onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
            placeholder="Paste your code here..."
            className="w-full h-32 px-2 py-1 border-2 border-sidebar-border rounded bg-white font-mono text-sm"
          />
          <div className="flex items-center gap-2 mt-2">
            <select
              value={codeSnippet.language}
              onChange={(e) => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
              className="px-2 py-1 border-2 border-sidebar-border rounded bg-white text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="typescript">TypeScript</option>
            </select>
            <button
              type="button"
              onClick={() => setShowCodePanel(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form
        className="flex items-center gap-2 border-t-2 border-sidebar-border px-2 py-2 bg-background sticky bottom-0"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <button
          type="button"
          className="px-2 py-2 text-xl border-2 border-sidebar-border rounded-full bg-accent hover:bg-[#b39ddb]"
          onClick={() => setShowEmoji((v) => !v)}
          aria-label="Add emoji"
        >
          😊
        </button>
        {showEmoji && (
          <div className="absolute bottom-14 left-0 z-50">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setInput((prev) => prev + emojiData.emoji)
                setShowEmoji(false)
              }}
            />
          </div>
        )}
        <label
          className="px-2 py-2 cursor-pointer border-2 border-sidebar-border rounded-full bg-accent hover:bg-[#b39ddb] flex items-center justify-center"
          title="Attach file"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          📎
        </label>
        {attachedFilePreview && (
          <div className="relative flex items-center">
            <div className="w-12 h-12 border-2 border-sidebar-border rounded overflow-hidden mr-2">
              <FilePreview
                url={attachedFilePreview.url}
                fileName={attachedFilePreview.name}
                fileType={attachedFilePreview.type}
                compact
              />
            </div>
            <button
              type="button"
              className="absolute top-0 right-0 bg-white border border-sidebar-border rounded-full w-5 h-5 flex items-center justify-center text-xs"
              onClick={removeAttachedFile}
            >
              ×
            </button>
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border-2 border-sidebar-border rounded-full font-medium text-base bg-[#f3e8ff] dark:bg-accent text-primary focus:bg-white focus:outline-none focus:border-[#39ff14] placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!input.trim() && !attachedFile && !codeSnippet.code}
          className="px-4 py-2 bg-[#39ff14] text-black text-base font-bold rounded-full border-2 border-sidebar-border transition-all duration-100 hover:bg-[#b39ddb] hover:text-white hover:scale-105 shadow-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {isLoading && (
        <div className="p-4 text-center text-sm text-gray-500">Loading messages...</div>
      )}
      {error && <div className="p-4 text-center text-red-500">{error}</div>}
    </main>
  )
}
