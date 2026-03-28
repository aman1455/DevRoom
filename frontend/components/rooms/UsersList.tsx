"use client"

import React, { useState } from "react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import { toast } from "sonner"
import { MoreVertical, UserX, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import InviteModal from "@/components/chat/InviteModal"

interface UsersListProps {
  room: any
}

export default function UsersList({ room }: UsersListProps) {
  const { leaveRoom, members: roomMembers } = useRoom()
  const { user } = useAuth()
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Debug logging
  console.log('UsersList Debug:', {
    roomId: room?._id,
    roomName: room?.name,
    roomCreatorId: room?.creatorId,
    roomCreatorIdId: room?.creatorId?._id,
    roomMembersCount: room?.members?.length,
    userId: user?._id,
  })

  // Handle both populated creatorId (object) and plain ObjectId (string)
  const creatorId = room.creatorId?._id || room.creatorId
  const isCreator = creatorId?.toString() === user?._id?.toString()
  console.log('isCreator:', isCreator, 'creatorId:', creatorId)

  // Check if user has permission to invite (creator, admin, or interviewer) using room's members
  const currentMember = room.members?.find((m: any) => {
    const memberUserId = m.user?._id || m.user
    return memberUserId?.toString() === user?._id?.toString()
  })
  console.log('currentMember:', currentMember)

  const canInvite = true // FOR DEBUGGING - always show invite button
  console.log('canInvite (FORCED TRUE):', canInvite)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-black">Members ({room.members?.length || 0})</h3>
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#39ff14] border-2 border-sidebar-border rounded-lg font-bold hover:bg-[#b39ddb] text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>
      <div className="grid gap-3">
        {room.members?.map((member: any) => {
          // Handle both populated and non-populated user references
          const memberUserId = member.user?._id || member.user
          const memberName = member.user?.name || member.name || 'Unknown'
          const memberEmail = member.user?.email || member.email || ''
          const memberAvatar = member.user?.avatarUrl || member.avatarUrl || null
          const memberStatus = member.user?.status || member.status || 'offline'

          return (
            <div
              key={memberUserId}
              className="flex items-center gap-3 p-3 bg-white border-2 border-sidebar-border rounded-lg hover:shadow-sm transition"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#39ff14] flex items-center justify-center text-xl font-extrabold border-2 border-sidebar-border overflow-hidden">
                  {memberAvatar ? (
                    <img
                      src={memberAvatar}
                      alt={memberName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    memberName[0]
                  )}
                </div>
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                    memberStatus === "online" ? "bg-green-500" : "bg-gray-400",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-black truncate">{memberName}</div>
                <div className="text-xs text-gray-500 truncate">{memberEmail}</div>
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
                        : member.role === "interview" // For interview rooms, the creator might be "interviewer" but also could be "admin"? handle "interview" as well
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
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
              {/* Actions dropdown - only creator can remove members */}
              {isCreator && (
                <button
                  onClick={async () => {
                    if (confirm(`Remove ${memberName} from room?`)) {
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
          )
        })}
      </div>

      {/* Invite Modal */}
      <InviteModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </div>
  )
}
