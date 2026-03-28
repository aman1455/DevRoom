"use client"

import React, { useState } from "react"
import { useRoom } from "@/app/RoomContext"
import { Bell, X } from "lucide-react"
import { toast } from "sonner"

export default function NotificationBell() {
  const { pendingInvites, acceptInvite, rejectInvite } = useRoom()
  const [isOpen, setIsOpen] = useState(false)

  const handleAccept = async (roomId: string) => {
    try {
      await acceptInvite(roomId)
      toast.success("Invite accepted!")
    } catch (err) {
      // Error already shown
    }
  }

  const handleReject = async (roomId: string) => {
    try {
      await rejectInvite(roomId)
      toast.success("Invite rejected")
    } catch (err) {
      // Error already shown
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full border-2 border-sidebar-border hover:bg-[#b39ddb] transition"
      >
        <Bell className="w-5 h-5" />
        {pendingInvites.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {pendingInvites.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-80 bg-white border-2 border-sidebar-border rounded-lg shadow-lg max-h-96 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-sidebar-border bg-[#e9d5ff]">
              <h3 className="font-extrabold text-black">
                Notifications ({pendingInvites.length})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-80">
              {pendingInvites.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No pending invites
                </div>
              ) : (
                <div className="divide-y divide-sidebar-border">
                  {pendingInvites.map((invite, index) => (
                    <div key={index} className="p-4 hover:bg-[#f3e8ff]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#39ff14] flex items-center justify-center font-extrabold border-2 border-sidebar-border shrink-0">
                          {invite.roomAvatar ? (
                            <img
                              src={invite.roomAvatar}
                              alt={invite.roomName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            invite.roomName[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-black text-sm truncate">
                            {invite.roomName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {invite.roomDescription || `${invite.roomType} room`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Invited by {invite.invitedBy?.name || "Someone"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAccept(invite.roomId)}
                          className="flex-1 py-1.5 px-3 bg-green-500 text-white text-sm font-bold rounded border-2 border-sidebar-border hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(invite.roomId)}
                          className="flex-1 py-1.5 px-3 bg-red-500 text-white text-sm font-bold rounded border-2 border-sidebar-border hover:bg-red-600"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
