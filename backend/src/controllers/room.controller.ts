import { Request, Response } from "express"
import Room from "../models/Room"
import Message from "../models/Message"
import User from "../models/User"
import { io, userSocketMap } from "../server"
import { Types } from "mongoose"

// Request body types
interface CreateRoomBody {
  name: string
  description?: string
  avatarUrl?: string
  type?: "group" | "interview"
  interviewSettings?: {
    question?: string
    duration?: number
    languages?: string[]
    isActive?: boolean
    startedAt?: Date | null
  }
  memberIds?: string[]
}

interface UpdateRoomSettingsBody {
  name?: string
  description?: string
  avatarUrl?: string
  interviewSettings?: {
    question?: string
    duration?: number
    languages?: string[]
    isActive?: boolean
    startedAt?: Date | null
  }
}

interface ControlTimerBody {
  action: "start" | "pause" | "reset" | "update"
  time?: number
}

interface SubmitCodeBody {
  code: string
  language: string
}

interface SendRoomMessageBody {
  text?: string
  image?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  language?: string
}

type RoomMemberWithRole = {
  user: Types.ObjectId
  role: "admin" | "member" | "interviewer" | "candidate"
  joinedAt: Date
}

// Helper: Get rooms for a user with member info and last message
export const getUserRooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id

    // Find rooms where user is a member
    const rooms = await Room.find({ "members.user": userId })
      .populate("creatorId", "name avatarUrl email")
      .populate("members.user", "name avatarUrl email")
      .populate("messages", "text senderId createdAt seen type")
      .sort({ updatedAt: -1 })

    // Get unread message counts per room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        // Count unseen messages in this room where sender is not the current user
        const unreadCount = await Message.countDocuments({
          roomId: room._id,
          seen: false,
          senderId: { $ne: userId },
        })

        // Get last message (messages is populated, so it's an array of Message docs)
        const lastMessage = room.messages && room.messages.length > 0 ? room.messages[0] : null

        return {
          _id: room._id,
          name: room.name,
          description: room.description,
          avatarUrl: room.avatarUrl,
          type: room.type,
          creatorId: room.creatorId,
          members: room.members,
          unreadCount,
          lastMessage,
          updatedAt: room.updatedAt,
        }
      }),
    )

    res.status(200).json({ rooms: roomsWithUnread })
  } catch (error) {
    console.error("Error fetching user rooms:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Create a new room
export const createRoom = async (req: Request<{}, {}, CreateRoomBody>, res: Response) => {
  try {
    const { name, description, avatarUrl, type, interviewSettings, memberIds } = req.body
    const creatorId = req.user!._id

    if (!name) {
      return res.status(400).json({ message: "Room name is required." })
    }

    // Build members array: creator is admin + additional members
    const members: RoomMemberWithRole[] = [
      {
        user: creatorId,
        role: (type === "interview" ? "interviewer" : "admin") as "admin" | "interviewer",
        joinedAt: new Date(),
      },
      ...(memberIds || []).map((memberId: string) => ({
        user: new Types.ObjectId(memberId),
        role: (type === "interview" ? "candidate" : "member") as "member" | "candidate",
        joinedAt: new Date(),
      })),
    ]

    const room = new Room({
      name,
      description: description || "",
      avatarUrl: avatarUrl || "",
      creatorId,
      type: type || "group",
      interviewSettings: interviewSettings || {
        question: "",
        duration: 60,
        languages: ["javascript", "python"],
        isActive: false,
        startedAt: null,
      },
      members,
    })

    await room.save()

    // Populate user details
    await room.populate("creatorId", "name avatarUrl email")
    await room.populate("members.user", "name avatarUrl email")

    // Add room to creator's user.rooms array
    await User.findByIdAndUpdate(creatorId, {
      $push: { rooms: room._id },
    })

    // Add room to each member's rooms array
    const memberUserIds = members.map((m) => m.user)
    await User.updateMany(
      { _id: { $in: memberUserIds } },
      { $push: { rooms: room._id } },
    )

    // Broadcast room creation to all members via socket
    memberUserIds.forEach((userId) => {
      const socketIds = userSocketMap[userId.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("newRoom", room)
        })
      }
    })

    res.status(201).json({
      message: "Room created successfully.",
      room,
    })
  } catch (error) {
    console.error("Error creating room:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Get room details by ID
export const getRoomDetails = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.user!._id

    const room = await Room.findById(roomId)
      .populate("creatorId", "name avatarUrl email")
      .populate("members.user", "name avatarUrl email")
      .populate("messages", "text senderId image fileUrl fileName fileType language type seen createdAt")

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if user is a member
    const isMember = room.members.some((m) => m.user._id.toString() === userId.toString())
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized. Not a member of this room." })
    }

    res.status(200).json({ room })
  } catch (error) {
    console.error("Error fetching room details:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Join a room (add user as member)
export const joinRoom = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if already a member
    const alreadyMember = room.members.some((m) => m.user.toString() === userId.toString())
    if (alreadyMember) {
      return res.status(400).json({ message: "Already a member of this room." })
    }

    // Add member
    room.members.push({
      user: userId,
      role: room.type === "interview" ? "candidate" : "member",
      joinedAt: new Date(),
    })
    await room.save()

    // Add room to user's rooms array
    await User.findByIdAndUpdate(userId, { $push: { rooms: roomId } })

    // Populate and return updated room
    await room.populate("creatorId", "name avatarUrl email")
    await room.populate("members.user", "name avatarUrl email")

    // Notify room members
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("userJoinedRoom", {
            roomId,
            user: {
              _id: userId,
              name: req.user!.name,
              avatarUrl: req.user!.avatarUrl,
            },
            room,
          })
        })
      }
    })

    res.status(200).json({
      message: "Joined room successfully.",
      room,
    })
  } catch (error) {
    console.error("Error joining room:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Leave a room
export const leaveRoom = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Remove member
    room.members = room.members.filter((m) => m.user.toString() !== userId.toString())
    await room.save()

    // Remove room from user's rooms array
    await User.findByIdAndUpdate(userId, { $pull: { rooms: roomId } })

    // Notify room members
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("userLeftRoom", {
            roomId,
            userId,
          })
        })
      }
    })

    res.status(200).json({
      message: "Left room successfully.",
    })
  } catch (error) {
    console.error("Error leaving room:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Send a message to a room
export const sendRoomMessage = async (req: Request<{ roomId: string }, {}, SendRoomMessageBody>, res: Response) => {
  try {
    const { roomId } = req.params
    const { text, image, fileUrl, fileName, fileType, language } = req.body
    const senderId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if user is a member
    const isMember = room.members.some((m) => m.user.toString() === senderId.toString())
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized. Not a member of this room." })
    }

    // Determine message type
    let messageType: "text" | "file" | "code" = "text"
    if (image) messageType = "file"
    if (fileUrl) messageType = "file"
    if (language && (text || fileUrl)) messageType = "code"

    const newMessage = new Message({
      senderId,
      roomId,
      text: text || "",
      image: image || "",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      fileType: fileType || "",
      language: language || "",
      type: messageType,
      seen: false,
    })

    await newMessage.save()

    // Add message reference to room (optional, for quick access)
    room.messages.push(newMessage._id)
    await room.save()

    // Populate sender info for broadcast
    await newMessage.populate("senderId", "name avatarUrl")

    // Broadcast to all room members
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("roomMessage", {
            roomId,
            message: newMessage,
          })
        })
      }
    })

    res.status(201).json({
      message: "Message sent to room successfully.",
      data: newMessage,
    })
  } catch (error) {
    console.error("Error sending room message:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Get messages for a room (with pagination support)
export const getRoomMessages = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.user!._id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const skip = (page - 1) * limit

    // Verify user is a member
    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    const isMember = room.members.some((m) => m.user.toString() === userId.toString())
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized." })
    }

    // Get messages
    const messages = await Message.find({ roomId })
      .populate("senderId", "name avatarUrl")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)

    // Mark messages as seen for this user
    await Message.updateMany(
      {
        roomId,
        seen: false,
        senderId: { $ne: userId },
      },
      { $set: { seen: true } },
    )

    const total = await Message.countDocuments({ roomId })

    res.status(200).json({
      messages,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    })
  } catch (error) {
    console.error("Error fetching room messages:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Update room settings (for interview mode)
export const updateRoomSettings = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const { name, description, avatarUrl, interviewSettings } = req.body as UpdateRoomSettingsBody
    const userId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Check if user is admin (only admin can update)
    const member = room.members.find((m) => m.user.toString() === userId.toString())
    if (!member || member.role !== "admin") {
      return res.status(403).json({ message: "Not authorized. Only admin can update room settings." })
    }

    if (name) room.name = name
    if (description !== undefined) room.description = description
    if (avatarUrl !== undefined) room.avatarUrl = avatarUrl
    if (interviewSettings) {
      room.interviewSettings = { ...room.interviewSettings, ...interviewSettings }
    }

    await room.save()
    await room.populate("creatorId", "name avatarUrl email")
    await room.populate("members.user", "name avatarUrl email")

    // Notify members
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("roomUpdated", {
            roomId,
            room,
          })
        })
      }
    })

    res.status(200).json({
      message: "Room settings updated.",
      room,
    })
  } catch (error) {
    console.error("Error updating room settings:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Interview timer controls
export const controlInterviewTimer = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const { action, time } = req.body as ControlTimerBody
    const userId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Only interviewer or admin can control timer
    const member = room.members.find((m) => m.user.toString() === userId.toString())
    if (!member || !["interviewer", "admin"].includes(member.role)) {
      return res.status(403).json({ message: "Not authorized. Only interviewer can control timer." })
    }

    switch (action) {
      case "start":
        room.interviewSettings.isActive = true
        room.interviewSettings.startedAt = new Date()
        break
      case "pause":
        room.interviewSettings.isActive = false
        break
      case "reset":
        room.interviewSettings.isActive = false
        room.interviewSettings.startedAt = null
        break
      case "update":
        if (time !== undefined) {
          // Custom time update (for syncing)
          // Could be used to set remaining time
        }
        break
    }

    await room.save()

    // Broadcast timer update to all room members
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("interviewTimerUpdate", {
            roomId,
            action,
            time: time || room.interviewSettings.duration,
            isActive: room.interviewSettings.isActive,
            startedAt: room.interviewSettings.startedAt,
          })
        })
      }
    })

    res.status(200).json({
      message: `Timer ${action}d.`,
      interviewSettings: room.interviewSettings,
    })
  } catch (error) {
    console.error("Error controlling interview timer:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Submit interview code (candidate submits solution)
export const submitInterviewCode = async (req: Request<{ roomId: string }, {}, SubmitCodeBody>, res: Response) => {
  try {
    const { roomId } = req.params
    const { code, language } = req.body
    const candidateId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Verify candidate is in room
    const candidateMember = room.members.find((m) => m.user.toString() === candidateId.toString())
    if (!candidateMember || candidateMember.role !== "candidate") {
      return res.status(403).json({ message: "Not authorized. Only candidate can submit." })
    }

    // Create system message for submission
    const submissionMessage = new Message({
      senderId: candidateId,
      roomId,
      text: `submitted a solution in ${language}`,
      type: "system",
    })
    await submissionMessage.save()

    // Create code message
    const codeMessage = new Message({
      senderId: candidateId,
      roomId,
      text: "Interview submission",
      code,
      language,
      type: "code",
    })
    await codeMessage.save()

    // Notify all members (especially interviewers)
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("interviewSubmission", {
            roomId,
            submission: {
              candidateId,
              candidateName: req.user!.name,
              code,
              language,
              timestamp: new Date(),
              messageId: codeMessage._id,
            },
          })
        })
      }
    })

    res.status(200).json({
      message: "Submission received.",
      submission: {
        messageId: codeMessage._id,
        candidateId,
        code,
        language,
      },
    })
  } catch (error) {
    console.error("Error submitting interview code:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Get room members
export const getRoomMembers = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const room = await Room.findById(roomId)
      .populate("members.user", "name avatarUrl email bio status")

    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    res.status(200).json({ members: room.members })
  } catch (error) {
    console.error("Error fetching room members:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Get user's pending invites
export const getPendingInvites = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id

    // Find rooms where this user has pending invites
    const rooms = await Room.find({
      "invites.user": userId,
      "invites.status": "pending",
    })
      .populate("creatorId", "name avatarUrl email")
      .populate("invites.user", "name avatarUrl email")

    // Extract only the pending invite for this user from each room
    const pendingInvites = rooms.map((room) => {
      const invite = room.invites.find((inv) => inv.user._id.toString() === userId.toString() && inv.status === "pending")
      return {
        roomId: room._id,
        roomName: room.name,
        roomDescription: room.description,
        roomAvatar: room.avatarUrl,
        roomType: room.type,
        invitedBy: invite?.invitedBy || room.creatorId,
        invitedAt: invite?.invitedAt,
      }
    })

    res.status(200).json({ pendingInvites })
  } catch (error) {
    console.error("Error fetching pending invites:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Invite a member to a room
export const inviteMember = async (req: Request<{ roomId: string }, {}, { userId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const { userId } = req.body
    const inviterId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Authorization: Only creator or admin can invite
    const isCreator = room.creatorId.toString() === inviterId.toString()
    const member = room.members.find((m) => m.user.toString() === inviterId.toString())
    const isAdmin = member && ["admin", "interviewer"].includes(member.role)
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "Only room creator or admin can invite members." })
    }

    // Check if user is a member already
    const isAlreadyMember = room.members.some((m) => m.user.toString() === userId)
    if (isAlreadyMember) {
      return res.status(400).json({ message: "User is already a member." })
    }

    // Check if invite already exists
    const existingInvite = room.invites.find((inv) => inv.user.toString() === userId && inv.status === "pending")
    if (existingInvite) {
      return res.status(400).json({ message: "Invite already pending." })
    }

    // Add invite
    room.invites.push({
      user: new Types.ObjectId(userId),
      invitedBy: inviterId,
      status: "pending",
      invitedAt: new Date(),
    })
    await room.save()

    // Add room reference to user's invites
    await User.findByIdAndUpdate(userId, { $push: { invites: room._id } })

    // Get inviter and invitee details for notification
    const inviter = await User.findById(inviterId).select("name avatarUrl")
    const invitee = await User.findById(userId).select("name avatarUrl")

    // Notify invited user via socket
    const socketIds = userSocketMap[userId.toString()]
    if (socketIds) {
      socketIds.forEach((socketId: string) => {
        io.to(socketId).emit("roomInvite", {
          roomId,
          room: {
            _id: room._id,
            name: room.name,
            description: room.description,
            avatarUrl: room.avatarUrl,
            type: room.type,
          },
          invitedBy: {
            _id: inviterId,
            name: inviter?.name || "Unknown",
            avatarUrl: inviter?.avatarUrl,
          },
        })
      })
    }

    // Also notify inviter that invite was sent
    if (socketIds) {
      // Already got socketIds above
    }

    res.status(200).json({
      message: "Invite sent successfully.",
      room,
    })
  } catch (error) {
    console.error("Error inviting member:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Accept room invite
export const acceptInvite = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Find the invite
    const inviteIndex = room.invites.findIndex((inv) => inv.user.toString() === userId.toString() && inv.status === "pending")
    if (inviteIndex === -1) {
      return res.status(404).json({ message: "Invite not found or already processed." })
    }

    // Update invite status
    room.invites[inviteIndex].status = "accepted"
    await room.save()

    // Add user as member with appropriate role
    room.members.push({
      user: userId,
      role: room.type === "interview" ? "candidate" : "member",
      joinedAt: new Date(),
    })
    await room.save()

    // Add room to user's rooms array
    await User.findByIdAndUpdate(userId, {
      $push: { rooms: room._id },
      $pull: { invites: room._id },
    })

    // Populate for response
    await room.populate("creatorId", "name avatarUrl email")
    await room.populate("members.user", "name avatarUrl email")

    // Notify all room members (including the new member)
    room.members.forEach((m) => {
      const socketIds = userSocketMap[m.user.toString()]
      if (socketIds) {
        socketIds.forEach((socketId: string) => {
          io.to(socketId).emit("roomUpdated", {
            roomId,
            room,
          })
        })
      }
    })

    res.status(200).json({
      message: "Invite accepted. You have joined the room.",
      room,
    })
  } catch (error) {
    console.error("Error accepting invite:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Reject room invite
export const rejectInvite = async (req: Request<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params
    const userId = req.user!._id

    const room = await Room.findById(roomId)
    if (!room) {
      return res.status(404).json({ message: "Room not found." })
    }

    // Find the invite
    const inviteIndex = room.invites.findIndex((inv) => inv.user.toString() === userId.toString() && inv.status === "pending")
    if (inviteIndex === -1) {
      return res.status(404).json({ message: "Invite not found or already processed." })
    }

    // Update invite status
    room.invites[inviteIndex].status = "rejected"
    await room.save()

    // Remove room from user's invites array
    await User.findByIdAndUpdate(userId, { $pull: { invites: room._id } })

    res.status(200).json({
      message: "Invite rejected.",
    })
  } catch (error) {
    console.error("Error rejecting invite:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}
