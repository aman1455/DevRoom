"use client"

import React, { useState, useEffect } from "react"
import { useRoom } from "@/app/RoomContext"
import { useAuth } from "@/app/AuthContext"
import { api } from "@/app/fetcher"
import { toast } from "sonner"
import { X, UserPlus } from "lucide-react"

interface InviteModalProps {
  open: boolean
  onClose: () => void
}

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const { selectedRoom } = useRoom()
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch all users (excluding current user and existing members)
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    try {
      const data = await api.get("/allusers", "auth")
      console.log('InviteModal: Fetched users data:', data)
      console.log('InviteModal: selectedRoom:', selectedRoom)
      console.log('InviteModal: current user:', user?._id)

      // Exclude current user and existing members
      const others = (data.users || []).filter((u: any) => {
        if (u._id === user?._id) return false
        // Check if user is already a member (handle both populated and non-populated references)
        if (selectedRoom?.members?.some((m: any) => {
          const memberId = m.user?._id || m.user
          return memberId?.toString() === u._id?.toString()
        })) return false
        return true
      })

      console.log('InviteModal: Filtered users to invite:', others)
      setAllUsers(others)
    } catch (err) {
      console.error("Failed to fetch users:", err)
      toast.error("Failed to load users")
    }
  }

  const handleInvite = async (userId: string) => {
    if (!selectedRoom) return
    setLoading(true)
    try {
      await api.post(`/${selectedRoom._id}/invite`, { userId }, "rooms")
      toast.success("Invite sent successfully!")
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl border-2 border-sidebar-border shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-sidebar-border">
          <h2 className="text-xl font-extrabold text-black flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Members
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {allUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users available to invite</p>
          ) : (
            <div className="space-y-2">
              {allUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-sidebar-border hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-[#39ff14] flex items-center justify-center font-extrabold border-2 border-sidebar-border">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      u.name[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-black truncate">{u.name}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                  <button
                    onClick={() => handleInvite(u._id)}
                    disabled={loading}
                    className="px-4 py-2 bg-[#39ff14] border-2 border-sidebar-border rounded-lg font-bold hover:bg-[#b39ddb] disabled:opacity-50"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
