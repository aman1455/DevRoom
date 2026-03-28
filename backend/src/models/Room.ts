import mongoose, { Document, Schema, Types } from "mongoose"
import { IRoom, IInterviewSettings, IRoomMember } from "../types/mongoose"

const roomSchema = new Schema<IRoom>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: "",
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["group", "interview"],
    default: "group",
  },
  interviewSettings: {
    question: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 60, // minutes
    },
    languages: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
    },
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member", "interviewer", "candidate"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  messages: [{
    type: Schema.Types.ObjectId,
    ref: "Message",
  }],
}, { timestamps: true })

// Index for faster queries
roomSchema.index({ creatorId: 1 })
roomSchema.index({ members: 1 })
roomSchema.index({ type: 1 })

const Room = mongoose.model<IRoom>("Room", roomSchema)

export default Room
