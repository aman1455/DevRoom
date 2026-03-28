"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import ChatSidebar from "./ChatSidebar"
import ChatPanel from "./ChatPanel"
import RoomSidebar from "./RoomSidebar"
import RoomChatPanel from "./RoomChatPanel"
import ProfileModal from "./ProfileModal"
import CreateRoomModal from "./CreateRoomModal"
import { useAuth } from "@/app/AuthContext"
import { MessageProvider, useMessageContext } from "@/app/MessageContext"
import { RoomProvider, useRoom } from "@/app/RoomContext"
import { toast } from "sonner"
import { MessageSquare, Users } from "lucide-react"
import NotificationBell from "@/components/chat/NotificationBell"

type Mode = "messages" | "rooms"

const ChatPanels: React.FC = () => {
  const router = useRouter()
  const { user, logout, updateProfile } = useAuth()
  const { selectedUser, setSelectedUser, loadingUsers, loadingMessages, error } = useMessageContext()
  const { setSelectedRoom } = useRoom()

  const [mode, setMode] = useState<Mode>("messages")
  const [search, setSearch] = useState("")
  const [showProfile, setShowProfile] = useState(false)
  const [profileDraft, setProfileDraft] = useState<any>(null)
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar")
  const [showCreateRoom, setShowCreateRoom] = useState(false)

  // Message context handlers
  function handleUserClick(u: any) {
    setSelectedUser(u)
    if (window.innerWidth < 768) setMobileView("chat")
    if (mode === "rooms") setMode("messages") // Switch to messages mode
  }

  function handleBackFromChat() {
    setMobileView("sidebar")
  }

  function handleBackFromRoom() {
    setMobileView("sidebar")
    setSelectedRoom(null)
  }

  async function handleProfileSave() {
    if (!profileDraft) return
    await updateProfile(profileDraft)
    setShowProfile(false)
    toast.success("Profile updated!")
  }

  function handleLogout() {
    try {
      logout()
      toast.success("Logged out successfully!")
    } catch (err: any) {
      toast.error(err.message || "Logout failed, Try again!")
    }
  }

  // Filtered users (for direct messages)
  // We need to access users and unseenMessages from MessageContext
  const { users, unseenMessages } = useMessageContext()
  const filteredUsers = users
    ?.filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase()))
    ?.map((u: any) => ({
      ...u,
      unread: unseenMessages[u._id || u.id] || 0,
    }))

  const currentSelectedUser = selectedUser
    ? users.find(
        (user: any) =>
          (user._id || user.id) === (selectedUser._id || selectedUser.id),
      ) || selectedUser
    : null

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen font-sans bg-gradient-to-br from-[#b39ddb]/40 via-white to-[#39ff14]/20 text-black relative overflow-hidden">
      {/* Sidebar */}
      <div
        className={`h-full w-full md:w-80 flex flex-col ${
          mobileView === "chat" ? "hidden md:block" : ""
        }`}
      >
        {/* Dynamic Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {mode === "messages" ? (
            <ChatSidebar
              users={filteredUsers}
              selectedUser={currentSelectedUser || {}}
              onUserSelect={handleUserClick}
              search={search}
              setSearch={setSearch}
            />
          ) : (
            <RoomSidebar
              onOpenCreateRoom={() => setShowCreateRoom(true)}
            />
          )}
        </div>

        {mode === "messages" && loadingUsers && (
          <div className="p-4 text-center">Loading users...</div>
        )}

        {/* Bottom Navigation Bar */}
        <div className="border-t-2 border-sidebar-border bg-[#e9d5ff] dark:bg-background">
          {/* Mode Toggle */}
          <div className="flex border-b-2 border-sidebar-border">
            <button
              onClick={() => setMode("messages")}
              className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 ${
                mode === "messages"
                  ? "bg-sidebar text-[#39ff14] border-b-2 border-[#39ff14]"
                  : "text-gray-600 hover:bg-[#f3e8ff]"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>
            <button
              onClick={() => setMode("rooms")}
              className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 ${
                mode === "rooms"
                  ? "bg-sidebar text-[#39ff14] border-b-2 border-[#39ff14]"
                  : "text-gray-600 hover:bg-[#f3e8ff]"
              }`}
            >
              <Users className="w-4 h-4" />
              Rooms
            </button>
          </div>

          {/* Notifications & Actions */}
          <div className="flex flex-col gap-2 p-4">
            {/* <div className="flex justify-center mb-2">
              <NotificationBell />
            </div> */}
            <button
              onClick={() => {
                setProfileDraft({
                  name: user?.name || "",
                  bio: user?.bio || "",
                  avatarUrl: user?.avatarUrl || "",
                })
                setShowProfile(true)
              }}
              className="w-full py-2 rounded-lg border-2 border-sidebar-border bg-sidebar-accent text-primary font-bold hover:bg-[#b39ddb]"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2 rounded-lg border-2 border-sidebar-border bg-sidebar-accent text-primary font-bold hover:bg-red-500 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 h-full ${
          mobileView === "sidebar" ? "hidden md:flex" : ""
        }`}
      >
        {mode === "messages" ? (
          <ChatPanel selectedUser={currentSelectedUser} onBack={handleBackFromChat} />
        ) : (
          <RoomChatPanel onBack={handleBackFromRoom} />
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        profileDraft={profileDraft || { name: "", bio: "", avatarUrl: "" }}
        setProfileDraft={setProfileDraft}
        onSave={handleProfileSave}
      />

      {/* Create Room Modal */}
      <CreateRoomModal open={showCreateRoom} onClose={() => setShowCreateRoom(false)} />

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  )
}

const ModernDevRoom: React.FC = () => {
  const { user } = useAuth()
  if (!user) return null
  return (
    <MessageProvider currentUser={user}>
      <RoomProvider>
        <ChatPanels />
      </RoomProvider>
    </MessageProvider>
  )
}

export default ModernDevRoom
