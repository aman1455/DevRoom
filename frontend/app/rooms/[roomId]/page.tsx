"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import { RoomProvider } from "@/app/RoomContext"
import RoomChatPanel from "@/components/chat/RoomChatPanel"
import CollaborativeEditor from "@/components/editor/CollaborativeEditor"
import FilePreview from "@/components/chat/FilePreview"
import UsersList from "@/components/rooms/UsersList"
import { toast } from "sonner"
import { ArrowLeft, MessageSquare, Code, Files, Users } from "lucide-react"
import NotificationBell from "@/components/chat/NotificationBell"
import { cn } from "@/lib/utils"

type Tab = "chat" | "code" | "files" | "members"

function RoomDetailContent() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { selectedRoom, fetchRoom, roomMessages, fetchMembers, members } = useRoom()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>("chat")

  // Load room data - only if we don't already have the room
  useEffect(() => {
    if (roomId && (!selectedRoom || selectedRoom._id !== roomId)) {
      fetchRoom?.(roomId as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, fetchRoom, selectedRoom?._id])

  if (!selectedRoom) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-[#b39ddb]/40 via-white to-[#39ff14]/20">
        <div className="border-2 border-black bg-white p-8 rounded-lg shadow-lg">
          <p className="font-bold text-center">Loading room...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "code", label: "Code", icon: Code },
    { id: "files", label: "Files", icon: Files },
    { id: "members", label: "Members", icon: Users },
  ] as const

  // Get files from messages that have fileUrl
  const roomFiles = roomMessages.filter((msg: any) => msg.fileUrl)

  return (
    <div className="flex flex-col h-screen w-screen font-sans bg-gradient-to-br from-[#b39ddb]/40 via-white to-[#39ff14]/20">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b-2 border-sidebar-border bg-white shadow-sm">
        <button
          onClick={() => router.push("/chat")}
          className="p-2 rounded-full border-2 border-sidebar-border hover:bg-[#b39ddb]"
          aria-label="Back to chat"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {/* <NotificationBell /> */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#39ff14] flex items-center justify-center text-xl font-extrabold border-2 border-sidebar-border overflow-hidden">
            {selectedRoom.avatarUrl ? (
              <img
                src={selectedRoom.avatarUrl}
                alt={selectedRoom.name}
                className="w-full h-full object-cover"
              />
            ) : (
              selectedRoom.name[0]
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-black">{selectedRoom.name}</h1>
            <p className="text-sm text-gray-600">
              {selectedRoom.type === "interview" ? "🎯 Interview Room" : "👥 Group Chat"} · {members?.length || 0} members
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b-2 border-sidebar-border bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-[#39ff14] text-[#39ff14] bg-[#f3e8ff]"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <RoomChatPanel />
        )}
        {activeTab === "code" && (
          <div className="h-full p-4">
            <CollaborativeEditor roomId={selectedRoom._id} />
          </div>
        )}
        {activeTab === "files" && (
          <div className="h-full overflow-y-auto p-4 bg-white/50">
            <h3 className="font-extrabold text-black mb-4">Shared Files</h3>
            {roomFiles.length === 0 ? (
              <p className="text-gray-500">No files shared yet.</p>
            ) : (
              <div className="space-y-4">
                {roomFiles.map((msg: any) => (
                  <div key={msg._id} className="border-2 border-sidebar-border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">
                        {msg.senderId?.name} · {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                      {msg.language && (
                        <span className="px-2 py-0.5 bg-[#b39ddb] text-xs rounded">{msg.language}</span>
                      )}
                    </div>
                    {msg.fileUrl ? (
                      <FilePreview url={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} />
                    ) : msg.image ? (
                      <FilePreview url={msg.image} fileName="image" fileType="image/*" />
                    ) : null}
                    {msg.text && <p className="mt-2 text-sm text-gray-700">{msg.text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "members" && (
          <div className="h-full overflow-y-auto p-4 bg-white/50">
            <UsersList room={selectedRoom} />
          </div>
        )}
      </div>
    </div>
  )
}

// Wrap with providers
export default function RoomDetailPage() {
  return (
    <RoomProvider>
      <RoomDetailContent />
    </RoomProvider>
  )
}
