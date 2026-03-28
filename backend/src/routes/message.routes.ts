import { Router } from "express"
import { protectRoute } from "../middleware/auth"
import {
  getMessages,
  getUserForSidebar,
  markMessagesAsSeen,
  sendMessage,
} from "../controllers/message.controller"

const messageRouter = Router()

messageRouter.get("/", protectRoute, getUserForSidebar)
messageRouter.get("/:userId", protectRoute, getMessages)
messageRouter.put("/mark-as-seen/:messageId", protectRoute, markMessagesAsSeen)
messageRouter.post("/send/:receiverId", protectRoute, sendMessage)

export default messageRouter
