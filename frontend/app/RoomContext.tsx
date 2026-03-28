"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import { api } from "./fetcher"
import { useRoomSocket } from "@/hooks/useRoomSocket"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"

interface Member {
  user: {
    _id: string
    name: string
    avatarUrl?: string
    email?: string
    bio?: string
    status?: string
  }
  role: "admin" | "member" | "interviewer" | "candidate"
  joinedAt: Date
}

interface Room {
  _id: string
  name: string
  description?: string
  avatarUrl?: string
  creatorId: {
    _id: string
    name: string
    avatarUrl?: string
    email?: string
  }
  type: "group" | "interview"
  members: Member[]
  unreadCount?: number
  lastMessage?: {
    _id: string
    text?: string
    senderId: string
    roomId: string
    type: string
    createdAt: string
    seen: boolean
  }
  updatedAt: string
  interviewSettings?: {
    question: string
    duration: number
    languages: string[]
    isActive: boolean
    startedAt?: string
  }
}

interface Message {
  _id: string
  senderId: string
  roomId?: string
  receiverId?: string
  text?: string
  image?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  language?: string
  type: "text" | "file" | "code" | "system"
  seen: boolean
  createdAt: string
}

interface ExecutionResult {
  success: boolean
  language?: string
  version?: string
  run: {
    stdout: string
    stderr: string
    exitCode: number
    status: string
    time: number
    memory: number
  }
}

interface RoomContextType {
  rooms: Room[]
  selectedRoom: Room | null
  setSelectedRoom: (room: Room | null) => void
  roomMessages: Message[]
  members: Member[]
  typingUsers: Record<string, boolean>
  isLoading: boolean
  error: string | null
  fetchRooms: () => Promise<void>
  fetchRoom: (roomId: string) => Promise<void>
  createRoom: (data: {
    name: string
    description?: string
    avatarUrl?: string
    type?: "group" | "interview"
    interviewSettings?: any
    memberIds?: string[]
  }) => Promise<Room>
  joinRoom: (roomId: string) => Promise<void>
  leaveRoom: (roomId: string) => Promise<void>
  sendRoomMessage: (
    roomId: string,
    text: string,
    file?: { url: string; name: string; type: string },
    code?: string,
    language?: string,
  ) => Promise<void>
  fetchMessages: (roomId: string, page?: number) => Promise<void>
  fetchMembers: (roomId: string) => Promise<void>
  updateRoomSettings: (
    roomId: string,
    settings: {
      name?: string
      description?: string
      avatarUrl?: string
      interviewSettings?: any
    },
  ) => Promise<void>
  controlInterviewTimer: (roomId: string, action: "start" | "pause" | "reset") => Promise<void>
  submitInterviewCode: (roomId: string, code: string, language: string) => Promise<void>
  executeCode: (language: string, code: string, stdin?: string) => Promise<ExecutionResult>
  sendTyping: (roomId: string, isTyping: boolean) => void
  sendCodeChange: (roomId: string, code: string, language: string) => void
}

const RoomContext = createContext<RoomContextType | null>(null)

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const {
    joinRoom: socketJoinRoom,
    leaveRoom: socketLeaveRoom,
    sendTyping: socketSendTyping,
    sendCodeChange: socketSendCodeChange,
    onUserTyping,
    onCodeUpdated,
    onRoomMessage,
    onUserJoinedRoom,
    onUserLeftRoom,
    onInterviewTimerUpdate,
    onInterviewSubmission,
    onRoomUpdated,
  } = useRoomSocket(user?._id)

  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomMessages, setRoomMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch rooms list
  const fetchRooms = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get("/", "rooms")
      setRooms(data.rooms || [])
    } catch (err: any) {
      setError(err.message || "Failed to load rooms")
      toast.error(err.message || "Failed to load rooms")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Create a new room
  const createRoom = async (roomData: {
    name: string
    description?: string
    avatarUrl?: string
    type?: "group" | "interview"
    interviewSettings?: any
    memberIds?: string[]
  }) => {
    try {
      const res = await api.post("/", roomData, "rooms")
      const newRoom = res.room
      setRooms((prev) => [newRoom, ...prev])
      toast.success("Room created successfully!")
      return newRoom
    } catch (err: any) {
      toast.error(err.message || "Failed to create room")
      throw err
    }
  }

  // Join a room
  const joinRoom = async (roomId: string) => {
    try {
      await api.post(`/${roomId}/join`, {}, "rooms")
      toast.success("Joined room successfully!")
      // Refresh rooms to get updated member list
      await fetchRooms()
    } catch (err: any) {
      toast.error(err.message || "Failed to join room")
      throw err
    }
  }

  // Leave a room
  const leaveRoom = async (roomId: string) => {
    try {
      await api.delete(`/${roomId}/leave`, {}, "rooms")
      toast.success("Left room")
      if (selectedRoom?._id === roomId) {
        setSelectedRoom(null)
        setRoomMessages([])
      }
      await fetchRooms()
    } catch (err: any) {
      toast.error(err.message || "Failed to leave room")
      throw err
    }
  }

  // Fetch messages for a room
  const fetchMessages = async (roomId: string, page: number = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get(`/${roomId}/messages?page=${page}`, "rooms")
      if (page === 1) {
        setRoomMessages(data.messages || [])
      } else {
        setRoomMessages((prev) => [...prev, ...(data.messages || [])])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load messages")
      toast.error(err.message || "Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch room members
  const fetchMembers = async (roomId: string) => {
    try {
      const data = await api.get(`/${roomId}/members`, "rooms")
      setMembers(data.members || [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load members")
    }
  }

  // Fetch single room by ID and set as selected
  const fetchRoom = async (roomId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get(`/${roomId}`, "rooms")
      setSelectedRoom(data.room)
      // Also load messages and members
      await Promise.all([fetchMessages(roomId, 1), fetchMembers(roomId)])
    } catch (err: any) {
      setError(err.message || "Failed to load room")
      toast.error(err.message || "Failed to load room")
    } finally {
      setIsLoading(false)
    }
  }

  // Send a message to a room
  const sendRoomMessage = async (
    roomId: string,
    text: string,
    file?: { url: string; name: string; type: string },
    code?: string,
    language?: string,
  ) => {
    try {
      const body: any = { text }
      if (file) {
        body.fileUrl = file.url
        body.fileName = file.name
        body.fileType = file.type
      }
      if (code) body.code = code
      if (language) body.language = language

      await api.post(`/${roomId}/message`, body, "rooms")
      // The actual message will come via socket broadcast, no need to add locally
    } catch (err: any) {
      toast.error(err.message || "Failed to send message")
      throw err
    }
  }

  // Update room settings
  const updateRoomSettings = async (
    roomId: string,
    settings: {
      name?: string
      description?: string
      avatarUrl?: string
      interviewSettings?: any
    },
  ) => {
    try {
      const res = await api.put(`/${roomId}/settings`, settings, "rooms")
      const updatedRoom = res.room
      setRooms((prev) => prev.map((r) => (r._id === roomId ? updatedRoom : r)))
      if (selectedRoom && selectedRoom._id === roomId) {
        setSelectedRoom(updatedRoom)
      }
      toast.success("Room settings updated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings")
      throw err
    }
  }

  // Interview timer controls
  const controlInterviewTimer = async (roomId: string, action: "start" | "pause" | "reset") => {
    try {
      await api.post(`/${roomId}/timer`, { action }, "rooms")
      toast.success(`Timer ${action}ed`)
    } catch (err: any) {
      toast.error(err.message || "Failed to control timer")
      throw err
    }
  }

  // Submit interview code
  const submitInterviewCode = async (roomId: string, code: string, language: string) => {
    try {
      await api.post(`/${roomId}/submit`, { code, language }, "rooms")
      toast.success("Solution submitted!")
    } catch (err: any) {
      toast.error(err.message || "Failed to submit solution")
      throw err
    }
  }

  // Execute code directly
  const executeCode = async (language: string, code: string, stdin?: string): Promise<ExecutionResult> => {
    try {
      const res = await api.post("/", { language, code, stdin }, "execution")
      return res
    } catch (err: any) {
      toast.error(err.message || "Code execution failed")
      throw err
    }
  }

  // Socket event handlers
  useEffect(() => {
    const unsubscribeMessage = onRoomMessage((data) => {
      const { roomId, message } = data
      if (selectedRoom && selectedRoom._id === roomId) {
        setRoomMessages((prev) => [...prev, message])
      }
      // Update room's last message in rooms list
      setRooms((prev) =>
        prev.map((r) => (r._id === roomId ? { ...r, lastMessage: message, updatedAt: new Date().toISOString() } : r)),
      )
    })

    const unsubscribeJoined = onUserJoinedRoom((data) => {
      const { roomId, user: newUser, room } = data
      if (selectedRoom && selectedRoom._id === roomId) {
        setMembers((prev) => [...prev, { ...room.members.find((m: any) => m.user._id === newUser._id) }])
      }
      setRooms((prev) => prev.map((r) => (r._id === roomId ? room : r)))
      toast.success(`${newUser.name} joined the room`)
    })

    const unsubscribeLeft = onUserLeftRoom((data) => {
      const { roomId, userId } = data
      if (selectedRoom && selectedRoom._id === roomId) {
        setMembers((prev) => prev.filter((m) => m.user._id !== userId))
      }
      // Remove from rooms list or mark left - simplified:
      toast.info("A user left the room")
    })

    const unsubscribeTyping = onUserTyping((data) => {
      const { userId, isTyping } = data
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }))
      // Auto-clear typing indicator after 3s
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev }
            delete next[userId]
            return next
          })
        }, 3000)
      }
    })

    const unsubscribeCodeUpdated = onCodeUpdated((data) => {
      // For collaborative editor, external state will handle
      // Broadcast to interested components via an event bus or separate context?
      // For now, we can store latest code in a map: roomId -> { userId, code, language }
      // But better: have CollaborativeEditor component subscribe to this and manage its own state
      // We'll expose a custom event or useEffect in that component
      // For now, just log or could add room-specific code state
    })

    const unsubscribeTimer = onInterviewTimerUpdate((data) => {
      // Could be handled by InterviewRoomPanel if selectedRoom is interview type
      // Dispatch custom event or use a separate context for timer state
      // For now, we'll let Interview component listen to this directly
    })

    const unsubscribeSubmission = onInterviewSubmission((data) => {
      toast.success(`Submissions received from ${data.candidateName}`)
    })

    const unsubscribeRoomUpdated = onRoomUpdated((data) => {
      const { roomId, room } = data
      setRooms((prev) => prev.map((r) => (r._id === roomId ? room : r)))
      if (selectedRoom && selectedRoom._id === roomId) {
        setSelectedRoom(room)
      }
    })

    return () => {
      unsubscribeMessage()
      unsubscribeJoined()
      unsubscribeLeft()
      unsubscribeTyping()
      unsubscribeCodeUpdated()
      unsubscribeTimer()
      unsubscribeSubmission()
      unsubscribeRoomUpdated()
    }
  }, [
    selectedRoom,
    onRoomMessage,
    onUserJoinedRoom,
    onUserLeftRoom,
    onUserTyping,
    onCodeUpdated,
    onInterviewTimerUpdate,
    onInterviewSubmission,
    onRoomUpdated,
  ])

  // Auto-join/leave room when selectedRoom changes
  useEffect(() => {
    if (!user) return
    if (selectedRoom) {
      socketJoinRoom(selectedRoom._id)
      fetchMessages(selectedRoom._id, 1)
      fetchMembers(selectedRoom._id)
    }
    // Cleanup: leave previous room on change
    return () => {
      if (selectedRoom) {
        // Don't leave immediately because selectedRoom will be old value
        // Actually useEffect cleanup runs before deps change, so selectedRoom is previous room
        socketLeaveRoom(selectedRoom._id)
      }
    }
  }, [selectedRoom?._id, user, socketJoinRoom, socketLeaveRoom, fetchMessages, fetchMembers])

  // Load rooms on mount
  useEffect(() => {
    if (user) {
      fetchRooms()
    }
  }, [user, fetchRooms])

  return (
    <RoomContext.Provider
      value={{
        rooms,
        selectedRoom,
        setSelectedRoom,
        roomMessages,
        members,
        typingUsers,
        isLoading,
        error,
        fetchRooms,
        fetchRoom,
        createRoom,
        joinRoom,
        leaveRoom,
        sendRoomMessage,
        fetchMessages,
        fetchMembers,
        updateRoomSettings,
        controlInterviewTimer,
        submitInterviewCode,
        executeCode,
        sendTyping: socketSendTyping,
        sendCodeChange: socketSendCodeChange,
      }}
    >
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider")
  }
  return context
}
