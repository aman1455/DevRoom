"use client"

import React from "react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import { cn } from "@/lib/utils"

interface RoomSidebarProps {
  onOpenCreateRoom: () => void
  onProfile: () => void
  onLogout: () => void
}

export default function RoomSidebar({
  onOpenCreateRoom,
  onProfile,
  onLogout,
}: RoomSidebarProps) {
  const { rooms, selectedRoom, setSelectedRoom, isLoading } = useRoom()
  const { user } = useAuth()

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room)
  }

  return (
    <aside className="flex flex-col w-full md:w-80 bg-[#e9d5ff] dark:bg-background border-r-2 border-sidebar-border h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-sidebar-border">
        <div className="w-8 h-8 bg-[#39ff14] rounded-lg flex items-center justify-center text-xl font-extrabold border-2 border-sidebar-border select-none">
          N
        </div>
        <span className="inline text-xl font-extrabold tracking-tight text-primary">
          DevRoom
        </span>
      </div>

      {/* Create Room Button */}
      <div className="px-4 py-2 border-b-2 border-sidebar-border">
        <button
          onClick={onOpenCreateRoom}
          className="w-full py-2 rounded-lg border-2 border-sidebar-border bg-[#39ff14] text-black font-bold hover:bg-[#b39ddb] flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Create Room
        </button>
      </div>

      {/* Room List */}
      <ul className="flex-1 overflow-y-auto py-2 space-y-1">
        {isLoading ? (
          <li className="px-4 py-2 text-center text-sm">Loading rooms...</li>
        ) : rooms.length === 0 ? (
          <li className="px-4 py-2 text-center text-sm text-gray-500">
            No rooms yet. Create one!
          </li>
        ) : (
          rooms.map((room) => {
            const isSelected = selectedRoom?._id === room._id
            return (
              <li
                key={room._id}
                onClick={() => handleRoomClick(room)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all duration-100 select-none",
                  isSelected
                    ? "bg-sidebar shadow border border-[#39ff14]"
                    : "hover:bg-[#f3e8ff]",
                )}
              >
                {/* Room Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#39ff14] flex items-center justify-center text-xl font-extrabold border-2 border-sidebar-border overflow-hidden">
                  {room.avatarUrl ? (
                    <img
                      src={room.avatarUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    room.name[0].toUpperCase()
                  )}
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-bold text-primary flex items-center gap-1">
                    {room.name}
                    <span className="text-xs font-normal text-gray-500">
                      {room.type === "interview" ? "🎯" : "👥"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {room.description || `${room.members?.length || 0} members`}
                  </div>
                </div>

                {/* Unread Badge */}
                {room.unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#b39ddb] text-black text-xs font-extrabold border-2 border-black">
                    {room.unreadCount}
                  </span>
                )}
              </li>
            )
          })
        )}
      </ul>

      {/* Profile/Logout */}
      <div className="flex flex-col gap-2 p-4 border-t-2 border-sidebar-border">
        <button
          onClick={onProfile}
          className="w-full py-2 rounded-lg border-2 border-sidebar-border bg-sidebar-accent text-primary font-bold hover:bg-[#b39ddb]"
        >
          Profile
        </button>
        <button
          onClick={onLogout}
          className="w-full py-2 rounded-lg border-2 border-sidebar-border bg-sidebar-accent text-primary font-bold hover:bg-red-500 hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
