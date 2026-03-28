"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"

interface UseRoomSocketReturn {
  socket: Socket | null
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  sendTyping: (roomId: string, isTyping: boolean) => void
  sendCodeChange: (roomId: string, code: string, language: string) => void
  onUserTyping: (callback: (data: { userId: string; isTyping: boolean }) => void) => void
  offUserTyping: (callback: (data: { userId: string; isTyping: boolean }) => void) => void
  onCodeUpdated: (callback: (data: { userId: string; code: string; language: string }) => void) => void
  offCodeUpdated: (callback: (data: { userId: string; code: string; language: string }) => void) => void
  onRoomMessage: (callback: (data: { roomId: string; message: any }) => void) => void
  offRoomMessage: (callback: (data: { roomId: string; message: any }) => void) => void
  onUserJoinedRoom: (callback: (data: { roomId: string; user: any; room: any }) => void) => void
  offUserJoinedRoom: (callback: (data: { roomId: string; user: any; room: any }) => void) => void
  onUserLeftRoom: (callback: (data: { roomId: string; userId: string }) => void) => void
  offUserLeftRoom: (callback: (data: { roomId: string; userId: string }) => void) => void
  onInterviewTimerUpdate: (callback: (data: any) => void) => void
  offInterviewTimerUpdate: (callback: (data: any) => void) => void
  onInterviewSubmission: (callback: (data: any) => void) => void
  offInterviewSubmission: (callback: (data: any) => void) => void
  onRoomUpdated: (callback: (data: { roomId: string; room: any }) => void) => void
  offRoomUpdated: (callback: (data: { roomId: string; room: any }) => void) => void
}

export function useRoomSocket(userId?: string): UseRoomSocketReturn {
  const socketRef = useRef<Socket | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return

    const socket = io("http://localhost:8080", {
      transports: ["websocket"],
      query: { userId },
    })
    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [userId])

  // Emitters
  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("join-room", roomId)
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit("leave-room", roomId)
  }, [])

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    socketRef.current?.emit("typing", { roomId, isTyping })
  }, [])

  const sendCodeChange = useCallback((roomId: string, code: string, language: string) => {
    socketRef.current?.emit("code-change", { roomId, code, language })
  }, [])

  // Event listener helpers
  const onUserTyping = useCallback((callback: (data: { userId: string; isTyping: boolean }) => void) => {
    const socket = socketRef.current
    socket?.on("userTyping", callback)
    return () => socket?.off("userTyping", callback)
  }, [])

  const onCodeUpdated = useCallback((callback: (data: { userId: string; code: string; language: string }) => void) => {
    const socket = socketRef.current
    socket?.on("codeUpdated", callback)
    return () => socket?.off("codeUpdated", callback)
  }, [])

  const onRoomMessage = useCallback((callback: (data: { roomId: string; message: any }) => void) => {
    const socket = socketRef.current
    socket?.on("roomMessage", callback)
    return () => socket?.off("roomMessage", callback)
  }, [])

  const onUserJoinedRoom = useCallback((callback: (data: { roomId: string; user: any; room: any }) => void) => {
    const socket = socketRef.current
    socket?.on("userJoinedRoom", callback)
    return () => socket?.off("userJoinedRoom", callback)
  }, [])

  const onUserLeftRoom = useCallback((callback: (data: { roomId: string; userId: string }) => void) => {
    const socket = socketRef.current
    socket?.on("userLeftRoom", callback)
    return () => socket?.off("userLeftRoom", callback)
  }, [])

  const onInterviewTimerUpdate = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current
    socket?.on("interviewTimerUpdate", callback)
    return () => socket?.off("interviewTimerUpdate", callback)
  }, [])

  const onInterviewSubmission = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current
    socket?.on("interviewSubmission", callback)
    return () => socket?.off("interviewSubmission", callback)
  }, [])

  const onRoomUpdated = useCallback((callback: (data: { roomId: string; room: any }) => void) => {
    const socket = socketRef.current
    socket?.on("roomUpdated", callback)
    return () => socket?.off("roomUpdated", callback)
  }, [])

  // Off wrappers (for cleanup)
  const offUserTyping = useCallback((callback: (data: { userId: string; isTyping: boolean }) => void) => {
    socketRef.current?.off("userTyping", callback)
  }, [])

  const offCodeUpdated = useCallback((callback: (data: { userId: string; code: string; language: string }) => void) => {
    socketRef.current?.off("codeUpdated", callback)
  }, [])

  const offRoomMessage = useCallback((callback: (data: { roomId: string; message: any }) => void) => {
    socketRef.current?.off("roomMessage", callback)
  }, [])

  const offUserJoinedRoom = useCallback((callback: (data: { roomId: string; user: any; room: any }) => void) => {
    socketRef.current?.off("userJoinedRoom", callback)
  }, [])

  const offUserLeftRoom = useCallback((callback: (data: { roomId: string; userId: string }) => void) => {
    socketRef.current?.off("userLeftRoom", callback)
  }, [])

  const offInterviewTimerUpdate = useCallback((callback: (data: any) => void) => {
    socketRef.current?.off("interviewTimerUpdate", callback)
  }, [])

  const offInterviewSubmission = useCallback((callback: (data: any) => void) => {
    socketRef.current?.off("interviewSubmission", callback)
  }, [])

  const offRoomUpdated = useCallback((callback: (data: { roomId: string; room: any }) => void) => {
    socketRef.current?.off("roomUpdated", callback)
  }, [])

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    sendTyping,
    sendCodeChange,
    onUserTyping,
    offUserTyping,
    onCodeUpdated,
    offCodeUpdated,
    onRoomMessage,
    offRoomMessage,
    onUserJoinedRoom,
    offUserJoinedRoom,
    onUserLeftRoom,
    offUserLeftRoom,
    onInterviewTimerUpdate,
    offInterviewTimerUpdate,
    onInterviewSubmission,
    offInterviewSubmission,
    onRoomUpdated,
    offRoomUpdated,
  }
}
