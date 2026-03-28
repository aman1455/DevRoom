import mongoose, { Document, Schema, Types } from "mongoose"
import { IMessage } from "../types/mongoose"

const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
  },
  text: {
    type: String,
  },
  image: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileType: {
    type: String,
  },
  language: {
    type: String,
  },
  type: {
    type: String,
    enum: ["text", "file", "code", "system"],
    default: "text",
  },
  seen: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true })

// Validate: either receiverId (1:1) or roomId (room) must be set
messageSchema.pre("validate", function (next) {
  if (!this.receiverId && !this.roomId) {
    next(new Error("Either receiverId or roomId is required"))
  } else if (this.receiverId && this.roomId) {
    next(new Error("Cannot set both receiverId and roomId"))
  } else {
    next()
  }
})

const Message = mongoose.model<IMessage>("Message", messageSchema)

export default Message
