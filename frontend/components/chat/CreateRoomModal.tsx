"use client"

import React, { useState, useEffect } from "react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import { api } from "@/app/fetcher"
import { toast } from "sonner"
import { X } from "lucide-react"

interface CreateRoomModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const { createRoom } = useRoom()
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"group" | "interview">("group")
  const [duration, setDuration] = useState(60)
  const [question, setQuestion] = useState("")
  const [languages, setLanguages] = useState<string[]>(["javascript"])
  const [languageInput, setLanguageInput] = useState("")
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch all users for member selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.get("/all", "auth")
        // Exclude current user
        const others = (data.users || []).filter((u: any) => u._id !== user?._id)
        setAllUsers(others)
      } catch (err) {
        console.error("Failed to fetch users:", err)
      }
    }
    if (open) {
      fetchUsers()
    }
  }, [open, user])

  const handleAddLanguage = () => {
    if (languageInput && !languages.includes(languageInput.toLowerCase())) {
      setLanguages([...languages, languageInput.toLowerCase()])
      setLanguageInput("")
    }
  }

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang))
  }

  const handleMemberToggle = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Room name is required")
      return
    }
    if (type === "interview" && !question.trim()) {
      toast.error("Interview question is required")
      return
    }

    setLoading(true)
    try {
      await createRoom({
        name: name.trim(),
        description: description.trim(),
        type,
        interviewSettings: {
          question: question.trim(),
          duration,
          languages,
          isActive: false,
        },
        memberIds,
      })
      handleClose()
    } catch (err) {
      // Error already shown in createRoom
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setType("group")
    setDuration(60)
    setQuestion("")
    setLanguages(["javascript"])
    setLanguageInput("")
    setMemberIds([])
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl border-2 border-sidebar-border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-sidebar-border">
          <h2 className="text-xl font-extrabold text-black">Create Room</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-200 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Room Type */}
          <div>
            <label className="block text-sm font-bold mb-2">Room Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="group"
                  checked={type === "group"}
                  onChange={() => setType("group")}
                  className="w-4 h-4"
                />
                <span className="font-bold">Group Chat</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="interview"
                  checked={type === "interview"}
                  onChange={() => setType("interview")}
                  className="w-4 h-4"
                />
                <span className="font-bold">Interview Mode</span>
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Room Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-3 py-2 border-2 border-sidebar-border rounded-lg bg-[#f3e8ff] font-bold focus:border-[#39ff14] focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Room description (optional)"
              rows={2}
              className="w-full px-3 py-2 border-2 border-sidebar-border rounded-lg bg-[#f3e8ff] font-bold focus:border-[#39ff14] focus:outline-none resize-none"
            />
          </div>

          {/* Interview Settings (only if interview type) */}
          {type === "interview" && (
            <>
              <div className="space-y-4 p-4 bg-accent rounded-lg border-2 border-sidebar-border">
                <h3 className="font-extrabold text-black">Interview Settings</h3>

                {/* Question */}
                <div>
                  <label className="block text-sm font-bold mb-2">Question *</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter the interview question or problem statement"
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-sidebar-border rounded-lg bg-white font-bold focus:border-[#39ff14] focus:outline-none resize-none"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-bold mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    min={5}
                    max={180}
                    className="w-full px-3 py-2 border-2 border-sidebar-border rounded-lg bg-white font-bold"
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-bold mb-2">Allowed Languages</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="e.g., python, javascript"
                      className="flex-1 px-3 py-2 border-2 border-sidebar-border rounded-lg bg-white font-bold text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddLanguage()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      className="px-4 py-2 bg-[#39ff14] border-2 border-sidebar-border rounded-lg font-bold hover:bg-[#b39ddb]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-[#b39ddb] border-2 border-black rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(lang)}
                          className="ml-1 text-black hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Members Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">Invite Members</label>
            <div className="border-2 border-sidebar-border rounded-lg p-2 max-h-48 overflow-y-auto bg-[#f3e8ff]">
              {allUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center p-2">No other users available</p>
              ) : (
                allUsers.map((u) => (
                  <label
                    key={u._id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      memberIds.includes(u._id) ? "bg-sidebar" : "hover:bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={memberIds.includes(u._id)}
                      onChange={() => handleMemberToggle(u._id)}
                      className="w-4 h-4"
                    />
                    <div className="w-8 h-8 rounded-full bg-[#39ff14] flex items-center justify-center font-extrabold border-2 border-sidebar-border">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        u.name[0]
                      )}
                    </div>
                    <span className="font-bold text-sm">{u.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-sidebar-border">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-lg border-2 border-sidebar-border bg-accent font-bold hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg border-2 border-sidebar-border bg-[#39ff14] font-bold hover:bg-[#b39ddb] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
