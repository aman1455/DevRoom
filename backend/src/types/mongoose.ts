import { Types } from "mongoose"

export interface IUser {
  _id: Types.ObjectId
  email: string
  password: string
  name: string
  avatarUrl: string
  bio?: string
  rooms: Types.ObjectId[]
  invites: Types.ObjectId[] // Room invite references
  createdAt: Date
  updatedAt: Date
}

export interface IMessage {
  _id: Types.ObjectId
  senderId: Types.ObjectId
  receiverId?: Types.ObjectId
  roomId?: Types.ObjectId
  text: string
  image: string
  fileUrl: string
  fileName: string
  fileType: string
  language: string
  type: "text" | "file" | "code" | "system"
  seen: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IRoomMember {
  user: Types.ObjectId
  role: "admin" | "member" | "interviewer" | "candidate"
  joinedAt: Date
}

export interface IInvite {
  user: Types.ObjectId
  invitedBy: Types.ObjectId
  status: "pending" | "accepted" | "rejected"
  invitedAt: Date
}

export interface IInterviewSettings {
  question: string
  duration: number
  languages: string[]
  isActive: boolean
  startedAt: Date | null
}

export interface IRoom {
  _id: Types.ObjectId
  name: string
  description: string
  avatarUrl: string
  creatorId: Types.ObjectId
  type: "group" | "interview"
  interviewSettings: IInterviewSettings
  members: IRoomMember[]
  invites: IInvite[]
  messages: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}
