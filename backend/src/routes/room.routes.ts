import { Router } from "express"
import { protectRoute } from "../middleware/auth"
import {
  getUserRooms,
  createRoom,
  getRoomDetails,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  getRoomMessages,
  updateRoomSettings,
  controlInterviewTimer,
  submitInterviewCode,
  getRoomMembers,
} from "../controllers/room.controller"

const roomRouter = Router()

// Room routes
roomRouter.get("/", protectRoute, getUserRooms)
roomRouter.post("/", protectRoute, createRoom)
roomRouter.get("/:roomId", protectRoute, getRoomDetails)
roomRouter.post("/:roomId/join", protectRoute, joinRoom)
roomRouter.delete("/:roomId/leave", protectRoute, leaveRoom)
roomRouter.post("/:roomId/message", protectRoute, sendRoomMessage)
roomRouter.get("/:roomId/messages", protectRoute, getRoomMessages)
roomRouter.put("/:roomId/settings", protectRoute, updateRoomSettings)
roomRouter.post("/:roomId/timer", protectRoute, controlInterviewTimer)
roomRouter.post("/:roomId/submit", protectRoute, submitInterviewCode)
roomRouter.get("/:roomId/members", protectRoute, getRoomMembers)

export default roomRouter
