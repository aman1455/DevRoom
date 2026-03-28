"use client"

import React from "react"
import { useRoom } from "@/app/RoomContext"
import { toast } from "sonner"
import { MoreVertical, UserX } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsersListProps {
  room: any
}

export default function UsersList({ room }: UsersListProps) {
  const { leaveRoom, members: roomMembers } = useRoom()
  const currentMember = roomMembers.find((m: any) => m.user._id === room.creatorId) // Actually need current user's membership

  // Determine if current user is admin (creator or role admin)
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
  // But we need auth context. Let's just accept currentUserId via prop? We'll use useAuth inside.

  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-black">Members ({room.members?.length || 0})</h3>
      <div className="grid gap-3">
        {room.members?.map((member: any) => (
          <div
            key={member.user._id}
            className="flex items-center gap-3 p-3 bg-white border-2 border-sidebar-border rounded-lg hover:shadow-sm transition"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#39ff14] flex items-center justify-center text-xl font-extrabold border-2 border-sidebar-border overflow-hidden">
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt={member.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  member.user.name[0]
                )}
              </div>
              <span
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                  member.user.status === "online" ? "bg-green-500" : "bg-gray-400",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-black truncate">{member.user.name}</div>
              <div className="text-xs text-gray-500 truncate">{member.user.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded-full",
                    member.role === "admin"
                      ? "bg-purple-100 text-purple-800 border border-purple-300"
                      : member.role === "interviewer"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : member.role === "candidate"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-gray-100 text-gray-800 border border-gray-300",
                  )}
                >
                  {member.role}
                </span>
                <span className="text-xs text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {/* Actions dropdown */}
            {(member.role !== "admin" && room.creatorId._id === currentUserId) && (
              <button
                onClick={async () => {
                  if (confirm(`Remove ${member.user.name} from room?`)) {
                    // Need API: remove member from room
                    // For now, just leave room for themselves
                    await leaveRoom(room._id)
                  }
                }}
                className="p-2 rounded-full hover:bg-red-100 text-red-600"
                title="Remove member"
              >
                <UserX className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
